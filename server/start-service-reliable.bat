
@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo License Manager - One-Click Reliable Startup
echo ===================================================
echo Starting diagnostic checks...
cd %~dp0
echo Current directory: %cd%

REM Create log files if they don't exist
if not exist service-log.txt type nul > service-log.txt
if not exist service-output.log type nul > service-output.log
if not exist service-error.log type nul > service-error.log

echo [%date% %time%] One-click startup initiated >> service-log.txt

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in the PATH.
    echo [%date% %time%] ERROR: Node.js not found >> service-log.txt
    echo Installing Node.js automatically...
    
    REM Create a temporary directory for downloading Node.js
    mkdir "%TEMP%\node_installer" 2>nul
    
    REM Download Node.js LTS installer
    echo Downloading Node.js...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi' -OutFile '%TEMP%\node_installer\node.msi'}"
    
    if %ERRORLEVEL% neq 0 (
        echo Failed to download Node.js. Please install it manually from https://nodejs.org/
        echo [%date% %time%] ERROR: Failed to download Node.js >> service-log.txt
        pause
        exit /b 1
    )
    
    echo Installing Node.js...
    start /wait msiexec /i "%TEMP%\node_installer\node.msi" /quiet /norestart
    
    REM Refresh PATH environment
    call refreshenv.cmd 2>nul || echo PATH will be updated after restart
    
    echo Node.js installed. Please restart this script.
    echo [%date% %time%] Node.js installed, restart required >> service-log.txt
    pause
    exit /b 0
)

REM Check for the dist folder at the parent directory
if not exist "..\dist" (
    echo Building frontend...
    echo [%date% %time%] Frontend build starting... >> service-log.txt
    
    REM Navigate to parent directory and build frontend
    pushd ..
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install frontend dependencies.
        echo [%date% %time%] ERROR: Frontend npm install failed >> service-log.txt
        pause
        exit /b 1
    )
    
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to build frontend.
        echo [%date% %time%] ERROR: Frontend build failed >> service-log.txt
        pause
        exit /b 1
    )
    popd
    
    echo Frontend built successfully.
    echo [%date% %time%] Frontend built successfully >> service-log.txt
)

REM Install server dependencies if needed
if not exist "node_modules" (
    echo Installing server dependencies...
    echo [%date% %time%] Installing server dependencies... >> service-log.txt
    
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install server dependencies.
        echo [%date% %time%] ERROR: Server npm install failed >> service-log.txt
        pause
        exit /b 1
    )
    
    echo Server dependencies installed successfully.
    echo [%date% %time%] Server dependencies installed >> service-log.txt
)

REM Check if port 3001 is already in use and kill the process if needed
echo Checking if port 3001 is already in use...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    set PID=%%a
    if not "!PID!"=="" (
        echo Port 3001 is in use by process !PID!, attempting to terminate...
        echo [%date% %time%] Port 3001 in use by PID !PID!, terminating >> service-log.txt
        
        taskkill /F /PID !PID! >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            echo Successfully freed port 3001
            echo [%date% %time%] Successfully terminated process !PID! >> service-log.txt
        ) else (
            echo WARNING: Could not free port 3001. You may need to manually stop the application using it.
            echo [%date% %time%] WARNING: Failed to terminate process !PID! >> service-log.txt
        )
    )
)

REM Explicitly open the firewall port
echo Configuring Windows Firewall...
echo [%date% %time%] Configuring Windows Firewall >> service-log.txt

powershell -Command "& {try { $rule = Get-NetFirewallRule -DisplayName 'License Manager Port 3001' -ErrorAction Stop; Write-Host 'Firewall rule already exists' } catch { New-NetFirewallRule -DisplayName 'License Manager Port 3001' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow; Write-Host 'Firewall rule created successfully' }}" >nul 2>&1

REM Get the machine's IP addresses for display
echo Available network interfaces:
echo [%date% %time%] Network interfaces: >> service-log.txt
ipconfig | findstr /i "IPv4" | findstr /v "Loopback"
ipconfig | findstr /i "IPv4" | findstr /v "Loopback" >> service-log.txt

REM Clear previous log files
echo Clearing previous log files...
echo > service-output.log
echo > service-error.log

REM Start the server
echo ===================================================
echo Starting License Manager Server
echo Server logs will be written to service-output.log and service-error.log
echo ===================================================
echo [%date% %time%] Starting server process >> service-log.txt

REM Start the application
start "License Manager Server" /b cmd /c "node server.js > service-output.log 2> service-error.log"

REM Wait for server to start
echo Waiting for server to start...
timeout /t 5 /nobreak > nul

REM Check if server started by testing port is in use
netstat -ano | findstr :3001 > nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Server failed to start on port 3001. Check service-error.log for details.
    echo [%date% %time%] ERROR: Server failed to start >> service-log.txt
    pause
    exit /b 1
)

REM Get the server process ID
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do set SERVER_PID=%%a
echo Server started with process ID: %SERVER_PID%
echo [%date% %time%] Server started with PID %SERVER_PID% >> service-log.txt

REM Try to open browser automatically
echo Opening application in default browser...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "Loopback" ^| findstr /v "169.254"') do (
    set IP=%%a
    set IP=!IP:~1!
    goto :found_ip
)

:found_ip
if "%IP%"=="" set IP=localhost
echo [%date% %time%] Opening browser to http://%IP%:3001 >> service-log.txt
start http://%IP%:3001

echo ===================================================
echo License Manager is now running!
echo Available at: http://%IP%:3001
echo ===================================================
echo.
echo To stop the server, close this window or press Ctrl+C
echo.

REM Keep the window open
pause
taskkill /F /PID %SERVER_PID% >nul 2>&1
echo [%date% %time%] Server stopped by user >> service-log.txt
echo Server stopped.

endlocal
