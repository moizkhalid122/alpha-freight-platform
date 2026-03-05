@echo off
REM Auto-start server script for Windows Startup
REM This script will start the server in the background

cd /d "%~dp0"

REM Wait 15 seconds for system to fully boot and network to be ready
timeout /t 15 /nobreak >nul

REM Check if port 3000 is already in use
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    REM Port is already in use, server might be running
    REM Verify it's actually our server
    curl -s http://localhost:3000/api/health >nul 2>&1
    if %errorlevel% == 0 (
        REM Server is already running
        exit /b 0
    ) else (
        REM Port is in use but not our server, kill it
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        timeout /t 2 /nobreak >nul
    )
)

REM Change to server directory
cd /d "%~dp0server"

REM Check if Node.js is available
where node >nul 2>&1
if %errorlevel% neq 0 (
    REM Node.js not found, exit silently
    exit /b 1
)

REM Start server in minimized window (background)
start "Alpha Freight Server" /min cmd /c "node server.js"

REM Wait for server to start
timeout /t 5 /nobreak >nul

REM Verify server is running (try 3 times)
set RETRY_COUNT=0
:CHECK_SERVER
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% == 0 (
    REM Server is running successfully
    exit /b 0
) else (
    set /a RETRY_COUNT+=1
    if %RETRY_COUNT% LSS 3 (
        timeout /t 3 /nobreak >nul
        goto CHECK_SERVER
    )
)

REM If we get here, server didn't start properly
exit /b 1
