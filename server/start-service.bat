
@echo off
echo Starting License Manager Service...
cd %~dp0
echo Current directory: %cd%

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in the PATH.
    echo Please install Node.js and try again.
    exit /b 1
)

REM Log when the service starts
echo [%date% %time%] Service starting... >> service-log.txt

REM Start the server with error logging
node server.js >> service-output.log 2>> service-error.log

REM This line should never be reached unless the server exits
echo [%date% %time%] Server exited with code %ERRORLEVEL% >> service-log.txt
exit /b %ERRORLEVEL%
