
@echo off
echo Starting License Manager Development Server
echo ===================================================

cd %~dp0\..

REM Check for Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js and try again.
    echo You can run server\setup-once-forever.bat to install it automatically.
    pause
    exit /b 1
)

REM Display network information
echo ===================================================
echo DEVELOPMENT SERVER ACCESS INFORMATION:
echo ===================================================
echo Once started, the development server can be accessed at:
echo Local access: http://localhost:8080
echo Network access:
ipconfig | findstr /i "IPv4" | findstr /v "Loopback"
echo.
echo For other computers on the network, use either:
echo - http://iltela21:8080
echo - OR use the IP address shown above with port 8080
echo ===================================================

echo Starting development server with network access...
echo Press Ctrl+C to stop the server when done.
echo.

npm run dev -- --host

pause
