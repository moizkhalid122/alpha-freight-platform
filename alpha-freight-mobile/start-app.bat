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

echo Agar loading stuck ho to terminal mein "s" dabao (tunnel mode)
echo.
call npx expo start --clear --tunnel
pause
