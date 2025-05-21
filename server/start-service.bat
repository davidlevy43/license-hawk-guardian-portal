
@echo off
echo ===================================================
echo Starting License Manager Service...
echo ===================================================
cd %~dp0
echo Current directory: %cd%

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in the PATH.
    echo Please install Node.js and try again.
    echo [%date% %time%] Error: Node.js not found >> service-log.txt
    exit /b 1
)

REM Check for the dist folder at the parent directory
if not exist "..\dist" (
    echo ===================================================
    echo WARNING: Frontend files not found!
    echo The frontend needs to be built before starting the service.
    echo ===================================================
    echo.
    echo Would you like to build the frontend now? (Y/N)
    choice /C YN /M "Build frontend now?"
    if %ERRORLEVEL% equ 1 (
        echo.
        echo Running build-frontend.bat...
        call build-frontend.bat
        echo.
        echo ===================================================
    ) else (
        echo.
        echo Continuing without building the frontend.
        echo The server API will run, but the web interface will not be available.
        echo [%date% %time%] Warning: dist folder not found, user chose not to build >> service-log.txt
    )
)

REM Log when the service starts
echo [%date% %time%] Service starting... >> service-log.txt

REM Check if the port is already in use
netstat -ano | findstr :3001 > nul
if %ERRORLEVEL% equ 0 (
    echo ===================================================
    echo WARNING: Port 3001 is already in use!
    echo Another application might be using this port.
    echo ===================================================
    echo [%date% %time%] Warning: Port 3001 already in use >> service-log.txt
    echo Press any key to continue anyway or Ctrl+C to abort...
    pause > nul
)

echo ===================================================
echo Starting License Manager server on port 3001
echo ===================================================

REM Start the server with error logging
node server.js >> service-output.log 2>> service-error.log

REM This line should never be reached unless the server exits
echo [%date% %time%] Server exited with code %ERRORLEVEL% >> service-log.txt
exit /b %ERRORLEVEL%
