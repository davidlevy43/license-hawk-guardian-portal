
@echo off
echo Starting License Manager - One Click Solution
echo ===================================================

cd %~dp0

REM Check if service is already running
sc query LicenseManagerService | findstr "RUNNING" > nul
if %ERRORLEVEL% equ 0 (
    REM Service is running - open browser
    echo License Manager service is already running.
    echo Opening in browser...
    start http://iltela21:3001
    exit /b 0
)

REM Try to start the service if it exists
sc query LicenseManagerService > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Starting License Manager service...
    sc start LicenseManagerService
    timeout /t 5 /nobreak > nul
    
    sc query LicenseManagerService | findstr "RUNNING" > nul
    if %ERRORLEVEL% equ 0 (
        echo Service started successfully.
        start http://iltela21:3001
        exit /b 0
    ) else (
        echo Service failed to start. Using direct start method instead.
    )
) else (
    echo License Manager service is not installed.
    echo Running in direct mode...
)

REM If service doesn't exist or couldn't start, run directly
echo Starting License Manager directly...

REM Check for Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js and try again.
    echo You can run setup-once-forever.bat to install it automatically.
    pause
    exit /b 1
)

REM Make sure output files exist
echo > service-output.log
echo > service-error.log

REM Start the server directly - explicitly bind to all IP addresses (0.0.0.0)
start "License Manager" /b cmd /c "node server.js > service-output.log 2> service-error.log"

echo Waiting for server to start...
timeout /t 3 /nobreak > nul

REM Check if server started successfully (by checking if port 3001 is now in use)
netstat -ano | findstr :3001 > nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Server might not have started correctly.
    echo Check service-error.log for details.
)

echo Opening browser...
start http://iltela21:3001

echo Done! License Manager should be running now.
echo If you encounter issues, please run setup-once-forever.bat as Administrator.
