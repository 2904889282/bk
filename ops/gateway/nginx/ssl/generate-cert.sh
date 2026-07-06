#!/bin/bash
# 自签名证书 (开发环境)
# 生产环境用 Let's Encrypt: certbot --nginx -d admin.beike.com

DOMAIN=${1:-admin.beike.com}
DAYS=3650
OUTDIR="$(dirname "$0")"

openssl req -x509 -nodes -days $DAYS \
  -newkey rsa:4096 \
  -keyout "$OUTDIR/beike.key" \
  -out "$OUTDIR/beike.crt" \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Beike/OU=IT/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN"

chmod 600 "$OUTDIR/beike.key"
echo "证书已生成: $OUTDIR/beike.{crt,key}"
echo "域名: $DOMAIN, 有效期: $DAYS 天"
echo ""
echo "Nginx 配置:"
echo "  ssl_certificate     $OUTDIR/beike.crt;"
echo "  ssl_certificate_key $OUTDIR/beike.key;"
