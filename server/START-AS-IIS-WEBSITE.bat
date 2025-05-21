
@echo off
echo ===================================================
echo License Manager - IIS Website Quick Start
echo ===================================================

cd %~dp0
echo Current directory: %cd%

echo This script will:
echo 1. Install or verify IIS and required components
echo 2. Set up the License Manager as an IIS website
echo 3. Open the application in your browser
echo 4. Open IIS Manager so you can verify the installation
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

REM Check for administrator privileges
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: This script requires administrator privileges.
    echo Right-click on the script and select "Run as administrator"
    pause
    exit /b 1
)

call install-iis-website.bat

echo ===================================================
echo License Manager IIS website setup complete!
echo ===================================================
echo.
echo If the browser didn't open automatically, you can access the application at:
echo - http://localhost:3001
echo - http://iltela21:3001
echo.
echo If you don't see the website in IIS Manager:
echo 1. Make sure you ran this script as administrator
echo 2. Try restarting IIS (type 'iisreset' in a command prompt)
echo 3. Check the iis-setup-log.txt file for any errors
echo.
echo Press any key to exit...
pause > nul
