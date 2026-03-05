@echo off
title Alpha Freight Server
color 0A
cls
echo.
echo ========================================
echo   Alpha Freight Express Server
echo ========================================
echo.

cd /d "%~dp0server"

echo [1/3] Checking port 3000...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo    Port 3000 is in use. Stopping processes...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
    echo    Port cleared!
) else (
    echo    Port 3000 is available
)

echo.
echo [2/3] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo    ERROR: Node.js not found!
    echo    Please install Node.js first.
    pause
    exit /b 1
)
echo    Node.js found

echo.
echo [3/3] Starting server...
echo.
echo ========================================
echo   Server will be available at:
echo   http://localhost:3000
echo   http://127.0.0.1:3000
echo ========================================
echo.
echo   Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

node server.js

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Server failed to start!
    echo.
    pause
)
