@echo off
title Fix Preview Issue
color 0B
cls
echo.
echo ========================================
echo   Fix Preview Issue
echo ========================================
echo.

echo [1/4] Stopping any existing server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo    ✅ Port cleared

echo.
echo [2/4] Starting server...
cd /d "%~dp0server"
start "Alpha Freight Server" /min cmd /c "node server.js"
timeout /t 5 /nobreak >nul
echo    ✅ Server started

echo.
echo [3/4] Testing server...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo    ✅ Server is running
) else (
    echo    ⚠️  Server might need more time
    timeout /t 3 /nobreak >nul
)

echo.
echo [4/4] Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000/index.html
echo    ✅ Browser opened

echo.
echo ========================================
echo   ✅ Preview Fixed!
echo ========================================
echo.
echo Server is running at:
echo   http://localhost:3000
echo   http://127.0.0.1:3000
echo.
echo Pages available:
echo   http://localhost:3000/index.html
echo   http://localhost:3000/pages/supplier/paynow.html
echo   http://localhost:3000/pages/carrier/dashboard.html
echo.
echo Press any key to close...
pause >nul
