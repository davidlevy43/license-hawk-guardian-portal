
@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo License Manager - One-Time Setup
echo ===================================================
echo This script will set up everything needed for License Manager to work.
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: This script requires administrator privileges.
    echo Right-click on the script and select "Run as administrator"
    pause
    exit /b 1
)

cd %~dp0
echo Current directory: %cd%
echo [%date% %time%] One-time setup initiated > setup-log.txt

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js not found. Installing...
    echo [%date% %time%] Installing Node.js >> setup-log.txt
    
    mkdir "%TEMP%\node_installer" 2>nul
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi' -OutFile '%TEMP%\node_installer\node.msi'}"
    
    if %ERRORLEVEL% neq 0 (
        echo Failed to download Node.js.
        echo [%date% %time%] ERROR: Node.js download failed >> setup-log.txt
        pause
        exit /b 1
    )
    
    start /wait msiexec /i "%TEMP%\node_installer\node.msi" /quiet /norestart
    
    REM Check if installation was successful
    where node >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Node.js installation failed.
        echo [%date% %time%] ERROR: Node.js installation failed >> setup-log.txt
        pause
        exit /b 1
    )
    
    echo Node.js installed successfully.
    echo [%date% %time%] Node.js installed successfully >> setup-log.txt
) else (
    echo Node.js is already installed.
    echo [%date% %time%] Node.js already installed: >> setup-log.txt
    node --version >> setup-log.txt
)

REM Download NSSM if not present
if not exist "nssm.exe" (
    echo Downloading NSSM (Non-Sucking Service Manager)...
    echo [%date% %time%] Downloading NSSM >> setup-log.txt
    
    mkdir "%TEMP%\nssm_download" 2>nul
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile '%TEMP%\nssm_download\nssm.zip'}"
    
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to download NSSM.
        echo [%date% %time%] ERROR: NSSM download failed >> setup-log.txt
        pause
        exit /b 1
    )
    
    echo Extracting NSSM...
    powershell -Command "& {Expand-Archive -Path '%TEMP%\nssm_download\nssm.zip' -DestinationPath '%TEMP%\nssm_extract' -Force}"
    
    if [Environment]::Is64BitOperatingSystem -eq $true (
        copy "%TEMP%\nssm_extract\nssm-2.24\win64\nssm.exe" "nssm.exe"
    ) else (
        copy "%TEMP%\nssm_extract\nssm-2.24\win32\nssm.exe" "nssm.exe"
    )
    
    echo NSSM downloaded and extracted.
    echo [%date% %time%] NSSM installed >> setup-log.txt
)

REM Install project dependencies and build frontend
if not exist "..\dist" (
    echo Building frontend application...
    echo [%date% %time%] Building frontend >> setup-log.txt
    
    cd ..
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install frontend dependencies.
        echo [%date% %time%] ERROR: Frontend npm install failed >> server\setup-log.txt
        cd server
        pause
        exit /b 1
    )
    
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to build frontend.
        echo [%date% %time%] ERROR: Frontend build failed >> server\setup-log.txt
        cd server
        pause
        exit /b 1
    )
    
    cd server
    echo Frontend built successfully.
    echo [%date% %time%] Frontend built successfully >> setup-log.txt
) else (
    echo Frontend already built.
    echo [%date% %time%] Frontend already built >> setup-log.txt
)

REM Install server dependencies
if not exist "node_modules" (
    echo Installing server dependencies...
    echo [%date% %time%] Installing server dependencies >> setup-log.txt
    
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install server dependencies.
        echo [%date% %time%] ERROR: Server npm install failed >> setup-log.txt
        pause
        exit /b 1
    )
    
    echo Server dependencies installed.
    echo [%date% %time%] Server dependencies installed >> setup-log.txt
)

REM Create a windows service that runs the server reliably
echo Creating Windows service...
echo [%date% %time%] Creating Windows service >> setup-log.txt

REM Set service name
set ServiceName=LicenseManagerService

REM Check if service already exists
sc query %ServiceName% >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Service already exists. Removing it first...
    echo [%date% %time%] Removing existing service >> setup-log.txt
    
    .\nssm.exe stop %ServiceName%
    timeout /t 2 /nobreak >nul
    .\nssm.exe remove %ServiceName% confirm
    timeout /t 2 /nobreak >nul
)

echo Installing service...
.\nssm.exe install %ServiceName% "%cd%\node.exe" "server.js"
.\nssm.exe set %ServiceName% DisplayName "License Manager Application"
.\nssm.exe set %ServiceName% Description "License Manager Application Service"
.\nssm.exe set %ServiceName% AppDirectory "%cd%"
.\nssm.exe set %ServiceName% AppStdout "%cd%\service-output.log"
.\nssm.exe set %ServiceName% AppStderr "%cd%\service-error.log"
.\nssm.exe set %ServiceName% AppRotateFiles 1
.\nssm.exe set %ServiceName% AppRotateOnline 1
.\nssm.exe set %ServiceName% AppRotateSeconds 86400
.\nssm.exe set %ServiceName% Start SERVICE_AUTO_START
.\nssm.exe set %ServiceName% ObjectName LocalSystem
.\nssm.exe set %ServiceName% Type SERVICE_WIN32_OWN_PROCESS
.\nssm.exe set %ServiceName% AppNoConsole 1
.\nssm.exe set %ServiceName% DependOnService Tcpip
.\nssm.exe set %ServiceName% AppExit Default Restart
.\nssm.exe set %ServiceName% AppRestartDelay 5000
.\nssm.exe set %ServiceName% AppThrottle 5000

echo Service created successfully.
echo [%date% %time%] Service created successfully >> setup-log.txt

REM Configure Windows Firewall
echo Configuring Windows Firewall...
echo [%date% %time%] Configuring Windows Firewall >> setup-log.txt

powershell -Command "& {try { $rule = Get-NetFirewallRule -DisplayName 'License Manager Port 3001' -ErrorAction Stop; Write-Host 'Firewall rule already exists' } catch { New-NetFirewallRule -DisplayName 'License Manager Port 3001' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow; Write-Host 'Firewall rule created successfully' }}"

REM Create desktop shortcuts
echo Creating desktop shortcuts...
echo [%date% %time%] Creating desktop shortcuts >> setup-log.txt

REM Get the Public desktop and current user's desktop paths
set "PublicDesktop=%PUBLIC%\Desktop"
set "UserDesktop=%USERPROFILE%\Desktop"

REM Create shortcut to application
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PublicDesktop%\License Manager.lnk'); $Shortcut.TargetPath = 'http://localhost:3001'; $Shortcut.Save(); Write-Host 'Created shortcut on Public desktop'}"
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%UserDesktop%\License Manager.lnk'); $Shortcut.TargetPath = 'http://localhost:3001'; $Shortcut.Save(); Write-Host 'Created shortcut on User desktop'}"

REM Create shortcut to start manually
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PublicDesktop%\Start License Manager.lnk'); $Shortcut.TargetPath = '%cd%\start-service-reliable.bat'; $Shortcut.WorkingDirectory = '%cd%'; $Shortcut.Save(); Write-Host 'Created Start shortcut on Public desktop'}"
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%UserDesktop%\Start License Manager.lnk'); $Shortcut.TargetPath = '%cd%\start-service-reliable.bat'; $Shortcut.WorkingDirectory = '%cd%'; $Shortcut.Save(); Write-Host 'Created Start shortcut on User desktop'}"

REM Start the service
echo Starting service...
echo [%date% %time%] Starting service >> setup-log.txt
sc start %ServiceName%

REM Wait for the service to start
echo Waiting for service to start...
timeout /t 10 /nobreak > nul

REM Check if service is running
sc query %ServiceName% | findstr "RUNNING" > nul
if %ERRORLEVEL% equ 0 (
    echo Service started successfully!
    echo [%date% %time%] Service started successfully >> setup-log.txt
    
    REM Get the server's IP address for display
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "Loopback" ^| findstr /v "169.254"') do (
        set IP=%%a
        set IP=!IP:~1!
        goto :found_ip
    )
    
    :found_ip
    if "!IP!"=="" set IP=localhost
    
    echo.
    echo ===================================================
    echo Setup Complete!
    echo ===================================================
    echo.
    echo License Manager is now installed as a Windows service and will start automatically when the computer boots.
    echo.
    echo You can access the application at: http://!IP!:3001
    echo.
    echo Shortcuts have been created on your desktop:
    echo - "License Manager" - Opens the application in your browser
    echo - "Start License Manager" - Use this if the service isn't running
    echo.
    echo If you ever need to manually start or stop the service:
    echo - To start: sc start %ServiceName%
    echo - To stop: sc stop %ServiceName%
    echo - To check status: sc query %ServiceName%
    echo.
    echo If you need to make changes to the service, run this script again.
    echo.
    
    REM Try to open the application in the default browser
    start http://localhost:3001
) else (
    echo WARNING: Service might not have started properly.
    echo [%date% %time%] WARNING: Service may not have started >> setup-log.txt
    echo Please check service-error.log for details.
    echo You can try to start the service manually with: sc start %ServiceName%
    echo Or use the desktop shortcut "Start License Manager" to run manually.
)

echo [%date% %time%] Setup completed >> setup-log.txt
echo.
echo Press any key to exit...
pause > nul
endlocal
