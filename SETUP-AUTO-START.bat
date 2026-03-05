@echo off
title Alpha Freight - Auto Start Setup
color 0B
cls
echo.
echo ========================================
echo   Alpha Freight Auto-Start Setup
echo ========================================
echo.
echo This will add Alpha Freight server to Windows Startup
echo so it starts automatically when you turn on your PC.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Get current directory
set "CURRENT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo.
echo [1/3] Creating startup shortcut...
echo.

REM Create shortcut in Startup folder
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Alpha Freight Server.lnk"
set "TARGET_PATH=%CURRENT_DIR%AUTO-START-SERVER.vbs"

REM Use PowerShell to create shortcut
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%TARGET_PATH%'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.Description = 'Auto-start Alpha Freight Server'; $Shortcut.Save()"

if %errorlevel% == 0 (
    echo    ✅ Shortcut created successfully!
) else (
    echo    ❌ Failed to create shortcut
    pause
    exit /b 1
)

echo.
echo [2/3] Testing server startup...
echo.

REM Test if server can start
cd /d "%CURRENT_DIR%server"
echo    Starting test server...
start /min "" cmd /c "node server.js"
timeout /t 5 /nobreak >nul

REM Check if server is running
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo    ✅ Server test successful!
    echo    Stopping test server...
    taskkill /F /FI "WINDOWTITLE eq Alpha Freight Server*" >nul 2>&1
    timeout /t 2 /nobreak >nul
) else (
    echo    ⚠️  Server test failed - please check Node.js installation
)

echo.
echo [3/3] Setup complete!
echo.
echo ========================================
echo   ✅ Auto-start configured!
echo ========================================
echo.
echo The server will now start automatically when you:
echo   - Turn on your PC
echo   - Log in to Windows
echo.
echo To disable auto-start:
echo   1. Press Win+R
echo   2. Type: shell:startup
echo   3. Delete "Alpha Freight Server.lnk"
echo.
echo To manually start server:
echo   Double-click: START-SERVER.bat
echo.
echo ========================================
echo.
pause
