#!/bin/bash
# ============================================================
# 贝壳管理系统 · 一键部署脚本（在服务器上执行）
# 用法：chmod +x deploy.sh && sudo ./deploy.sh
# 前提：JDK 17、MySQL 8、Nginx 已安装
# ============================================================
set -e

APP_NAME="beike-app"
APP_DIR="/opt/beike-app"
WEB_DIR="/var/www/beike-web"
GREEN='\033[0;32m'
NC='\033[0m'

echo "============================================"
echo " 贝壳管理系统 · 一键部署"
echo "============================================"

# 1. 创建目录
echo -e "${GREEN}[1/7] 创建目录...${NC}"
mkdir -p ${APP_DIR}/{logs,uploads}
mkdir -p ${WEB_DIR}

# 2. 关闭旧服务
echo -e "${GREEN}[2/7] 关闭旧服务...${NC}"
systemctl stop ${APP_NAME} 2>/dev/null || true

# 3. 部署 JAR（假设已通过 SFTP 上传到 /tmp/app.jar）
echo -e "${GREEN}[3/7] 部署后端 JAR...${NC}"
if [ -f /tmp/app.jar ]; then
    cp /tmp/app.jar ${APP_DIR}/app.jar
    rm /tmp/app.jar
    echo "JAR 部署完成"
else
    echo "⚠️  /tmp/app.jar 不存在，请先通过 SFTP 上传"
fi

# 4. 部署前端（假设已上传到 /tmp/dist/）
echo -e "${GREEN}[4/7] 部署前端...${NC}"
if [ -d /tmp/dist ]; then
    rm -rf ${WEB_DIR}/*
    cp -r /tmp/dist/* ${WEB_DIR}/
    rm -rf /tmp/dist
    echo "前端部署完成"
else
    echo "⚠️  /tmp/dist 不存在，请先通过 SFTP 上传"
fi

# 5. 安装 systemd 服务
echo -e "${GREEN}[5/7] 安装 systemd 服务...${NC}"
cat > /etc/systemd/system/${APP_NAME}.service << 'SERVICE_EOF'
[Unit]
Description=贝壳线索-项目一体化管理系统
After=syslog.target network.target mysql.service

[Service]
User=root
WorkingDirectory=/opt/beike-app
ExecStart=/usr/bin/java \
    -Xms256m -Xmx512m \
    -XX:+UseG1GC \
    -Djava.security.egd=file:/dev/./urandom \
    -jar /opt/beike-app/app.jar \
    --spring.profiles.active=prod
SuccessExitStatus=143
Restart=always
RestartSec=10
StandardOutput=append:/opt/beike-app/logs/stdout.log
StandardError=append:/opt/beike-app/logs/stderr.log

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable ${APP_NAME}

# 6. 配置 Nginx
echo -e "${GREEN}[6/7] 配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/beike << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/javascript image/svg+xml;

    location / {
        root /var/www/beike-web;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
        client_max_body_size 50m;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
}
NGINX_EOF

# 移除默认站点，启用贝壳站点
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/beike /etc/nginx/sites-enabled/beike
nginx -t && systemctl reload nginx
echo "Nginx 配置完成"

# 7. 启动服务
echo -e "${GREEN}[7/7] 启动服务...${NC}"
systemctl start ${APP_NAME}

echo ""
echo "============================================"
echo " 🎉 部署完成！"
echo " 访问地址: http://服务器IP"
echo " 查看日志: journalctl -u ${APP_NAME} -f"
echo "============================================"
