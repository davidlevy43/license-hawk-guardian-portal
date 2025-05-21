
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
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

call install-iis-website.bat

echo ===================================================
echo License Manager IIS website setup complete!
echo ===================================================
echo.
echo If the browser didn't open automatically, you can access the application at:
echo - http://localhost:3001
echo - http://iltela21:3001
echo.
echo Press any key to exit...
pause > nul
