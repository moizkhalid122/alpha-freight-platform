@echo off
echo ========================================
echo Firebase Storage CORS Fix Script
echo ========================================
echo.

REM Check if gcloud is installed
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Google Cloud SDK (gcloud) is not installed!
    echo.
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking authentication...
gcloud auth list >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Please login to Google Cloud...
    gcloud auth login
)

echo [2/3] Creating CORS configuration file...
(
echo [
echo   {
echo     "origin": ["*"],
echo     "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
echo     "maxAgeSeconds": 3600,
echo     "responseHeader": ["Content-Type", "Authorization", "Content-Length"]
echo   }
echo ]
) > cors.json

echo [3/3] Applying CORS rules to Firebase Storage...
gsutil cors set cors.json gs://alpha-brokerage.firebasestorage.app

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! CORS rules applied!
    echo ========================================
    echo.
    echo Please refresh your browser and try uploading POD again.
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR! Failed to apply CORS rules
    echo ========================================
    echo.
    echo Please check:
    echo 1. You are logged in to Google Cloud
    echo 2. You have access to Firebase project
    echo 3. Project ID is correct: alpha-brokerage
    echo.
)

del cors.json >nul 2>&1
pause
