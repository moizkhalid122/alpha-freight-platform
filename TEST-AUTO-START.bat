@echo off
title Test Auto-Start
color 0E
cls
echo.
echo ========================================
echo   Testing Auto-Start Setup
echo ========================================
echo.

REM Check if auto-start is enabled
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Alpha Freight Server.lnk"

if exist "%SHORTCUT_PATH%" (
    echo ✅ Auto-start is ENABLED
    echo.
    echo When you restart PC:
    echo   1. Server will start automatically after 15-20 seconds
    echo   2. Stripe payment will work without manual start
    echo   3. No need to run START-SERVER.bat manually
    echo.
    echo To test:
    echo   1. Restart your PC now
    echo   2. Wait 20 seconds after login
    echo   3. Open browser: http://localhost:3000/api/health
    echo   4. If you see "OK", server is running!
    echo.
) else (
    echo ❌ Auto-start is NOT enabled
    echo.
    echo To enable auto-start:
    echo   1. Run: SETUP-AUTO-START.bat
    echo   2. Restart PC
    echo   3. Server will start automatically
    echo.
)

echo ========================================
echo.
pause
