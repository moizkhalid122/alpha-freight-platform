@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   Alpha Freight Mobile - Expo Start
echo ========================================
echo.

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install --legacy-peer-deps
  echo.
)

if not exist ".env" (
  echo WARNING: .env file missing!
  echo Copy .env.example to .env and add your Supabase keys.
  echo Login screen will open but sign-in will fail without keys.
  echo.
)

echo DEV APK ke liye pehle yeh server chalna zaroori hai.
echo Phone aur PC same WiFi par hon.
echo Manual URL: http://192.168.1.7:8081
echo.
call npx expo start --dev-client --lan --clear --port 8081
pause
