@echo off
chcp 65001 >nul
title 贝壳管理系统 - 一键启动

echo ============================================
echo  贝壳线索-项目一体化管理系统 v1.0
echo ============================================
echo.

:: 1. 杀 8080 端口旧进程
echo [1/3] 清理 8080 端口...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo 8080 端口已释放

:: 2. 启动后端
echo [2/3] 启动后端 (Spring Boot)...
start "贝壳-后端" cmd /c "cd /d %~dp0backend-monolith && mvn spring-boot:run"

:: 等待后端启动（Spring Boot 一般需要 10-20 秒）
echo 等待后端启动中（约 15 秒）...
timeout /t 15 /nobreak >nul

:: 3. 启动前端
echo [3/3] 启动前端 (Vite)...
start "贝壳-前端" cmd /c "cd /d %~dp0 && pnpm dev"

echo.
echo ============================================
echo  后端: http://localhost:8080
echo  前端: http://localhost:5173 (如端口占用会自动切换 5174)
echo  账号: admin / admin123
echo ============================================
echo.
echo 提示：关闭后端的黑色窗口或前端的黑色窗口即可停止对应服务。
echo 按任意键关闭本窗口（不影响后端和前端运行）...
pause >nul
