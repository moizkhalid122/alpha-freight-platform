@echo off
title Alpha Freight - Quick Start
color 0A
cls
echo.
echo ========================================
echo   Alpha Freight - Quick Start
echo ========================================
echo.

REM Check if server is already running
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✅ Server is already running!
    echo.
    echo Opening browser...
    start http://localhost:3000/index.html
    echo.
    echo Server URL: http://localhost:3000
    echo.
    pause
    exit /b 0
)

echo [1/3] Starting server...
cd /d "%~dp0server"
start "Alpha Freight Server" /min cmd /c "node server.js"
timeout /t 5 /nobreak >nul

echo [2/3] Verifying server...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo    ✅ Server started successfully!
) else (
    echo    ⚠️  Waiting for server...
    timeout /t 3 /nobreak >nul
)

echo.
echo [3/3] Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000/index.html

echo.
echo ========================================
echo   ✅ Server Started!
echo ========================================
echo.
echo 🌐 Server URL: http://localhost:3000
echo 📄 Homepage: http://localhost:3000/index.html
echo.
echo Server is running in background.
echo To stop server, use Task Manager or run:
echo   taskkill /F /FI "WINDOWTITLE eq Alpha Freight Server*"
echo.
pause
