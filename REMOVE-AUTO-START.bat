@echo off
title Alpha Freight - Remove Auto Start
color 0C
cls
echo.
echo ========================================
echo   Remove Auto-Start
echo ========================================
echo.
echo This will remove Alpha Freight server from Windows Startup.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\Alpha Freight Server.lnk"

if exist "%SHORTCUT_PATH%" (
    del "%SHORTCUT_PATH%"
    echo.
    echo ✅ Auto-start removed successfully!
    echo.
    echo The server will no longer start automatically.
    echo.
) else (
    echo.
    echo ⚠️  Auto-start shortcut not found.
    echo    It may have already been removed.
    echo.
)

echo ========================================
echo.
pause
