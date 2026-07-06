@echo off
setlocal EnableExtensions

chcp 65001 >nul
title Beike Admin - Dev Startup

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%apps\api"
set "FRONTEND_URL=http://localhost:5173/"
set "BACKEND_URL=http://localhost:8080/"

echo ============================================
echo  Beike Admin development startup
echo ============================================
echo.
echo Frontend entry : %FRONTEND_URL%
echo Backend API    : %BACKEND_URL%
echo.

where pnpm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pnpm was not found. Install dependencies or add pnpm to PATH.
  pause
  exit /b 1
)

where mvn.cmd >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\apache-maven-3.9.16\bin\mvn.cmd" (
    set "MAVEN_CMD=%USERPROFILE%\apache-maven-3.9.16\bin\mvn.cmd"
  ) else (
    echo [WARN] Maven was not found. The frontend will still start.
    set "MAVEN_CMD="
  )
) else (
  set "MAVEN_CMD=mvn.cmd"
)

where java.exe >nul 2>nul
if errorlevel 1 (
  if exist "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
    set "PATH=%JAVA_HOME%\bin;%PATH%"
  ) else (
    echo [WARN] Java 17 was not found. Backend startup may fail.
  )
)

echo [1/2] Starting frontend...
start "beike-frontend" cmd /k "cd /d "%ROOT%" && pnpm dev --host 0.0.0.0"

if defined MAVEN_CMD (
  if exist "%BACKEND_DIR%\pom.xml" (
    echo [2/2] Starting backend...
    start "beike-backend" cmd /k "cd /d "%BACKEND_DIR%" && "%MAVEN_CMD%" -Dmaven.repo.local=%USERPROFILE%\.m2\repository spring-boot:run"
  ) else (
    echo [WARN] apps\api was not found. Backend was skipped.
  )
) else (
  echo [WARN] Backend was skipped because Maven is unavailable.
)

echo.
echo Open the app at:
echo   %FRONTEND_URL%
echo.
echo Note: port 8080 is the backend API, not the frontend page.
echo If backend dependency download fails, check network access to Maven repositories
echo or pre-populate %USERPROFILE%\.m2\repository.
echo.
pause
