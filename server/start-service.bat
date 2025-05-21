
@echo off
echo Starting License Manager Service...
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

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: npm is not installed or not in the PATH.
    echo Please install npm and try again.
    echo [%date% %time%] Error: npm not found >> service-log.txt
    exit /b 1
)

REM Log when the service starts
echo [%date% %time%] Service starting... >> service-log.txt

REM Check if the dist folder exists at the parent directory
if not exist "..\dist" (
    echo Warning: dist folder not found. The frontend may not be built.
    echo You must build the React app by running "npm run build" in the project root.
    echo [%date% %time%] Warning: dist folder not found >> service-log.txt
)

REM Start the server with error logging
node server.js >> service-output.log 2>> service-error.log

REM This line should never be reached unless the server exits
echo [%date% %time%] Server exited with code %ERRORLEVEL% >> service-log.txt
exit /b %ERRORLEVEL%
