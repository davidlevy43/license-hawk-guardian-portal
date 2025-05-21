
@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo License Manager - IIS Website Installation
echo ===================================================
echo This script will install License Manager as an IIS website.
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
echo [%date% %time%] IIS installation initiated > iis-setup-log.txt

REM Check if IIS is installed
echo Checking if IIS is installed...
dism /online /get-featureinfo /featurename:IIS-WebServerRole | findstr "State : Enabled" > nul
if %ERRORLEVEL% neq 0 (
    echo IIS is not installed. Installing IIS components...
    echo [%date% %time%] Installing IIS components >> iis-setup-log.txt
    
    echo Installing IIS Web Server Role...
    dism /online /enable-feature /featurename:IIS-WebServerRole /all /quiet

    echo Installing IIS Management Console...
    dism /online /enable-feature /featurename:IIS-ManagementConsole /quiet

    echo Installing ASP.NET 4.8...
    dism /online /enable-feature /featurename:IIS-ASPNET45 /all /quiet

    echo Installing URL Rewrite Module...
    echo This may take a moment, please wait...
    
    mkdir "%TEMP%\urlrewrite" 2>nul
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://download.microsoft.com/download/D/D/E/DDE57C26-C62C-4C59-A1BB-31D58B36ADA2/rewrite_amd64.msi' -OutFile '%TEMP%\urlrewrite\rewrite_amd64.msi'}"
    
    if %ERRORLEVEL% neq 0 (
        echo WARNING: Could not download URL Rewrite Module automatically.
        echo You may need to install it manually from: https://www.iis.net/downloads/microsoft/url-rewrite
        echo [%date% %time%] WARNING: URL Rewrite download failed >> iis-setup-log.txt
    ) else (
        start /wait msiexec /i "%TEMP%\urlrewrite\rewrite_amd64.msi" /quiet /norestart
        echo URL Rewrite Module installed.
        echo [%date% %time%] URL Rewrite Module installed >> iis-setup-log.txt
    )
    
    echo IIS components installed.
    echo [%date% %time%] IIS components installed >> iis-setup-log.txt
) else (
    echo IIS is already installed.
    echo [%date% %time%] IIS already installed >> iis-setup-log.txt
)

REM Install Node.js if not already installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Node.js not found. Installing...
    echo [%date% %time%] Installing Node.js >> iis-setup-log.txt
    
    mkdir "%TEMP%\node_installer" 2>nul
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi' -OutFile '%TEMP%\node_installer\node.msi'}"
    
    if %ERRORLEVEL% neq 0 (
        echo Failed to download Node.js.
        echo [%date% %time%] ERROR: Node.js download failed >> iis-setup-log.txt
        pause
        exit /b 1
    )
    
    start /wait msiexec /i "%TEMP%\node_installer\node.msi" /quiet /norestart
    
    REM Check if installation was successful
    where node >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Node.js installation failed.
        echo [%date% %time%] ERROR: Node.js installation failed >> iis-setup-log.txt
        pause
        exit /b 1
    )
    
    echo Node.js installed successfully.
    echo [%date% %time%] Node.js installed successfully >> iis-setup-log.txt
) else (
    echo Node.js is already installed.
    echo [%date% %time%] Node.js already installed: >> iis-setup-log.txt
    node --version >> iis-setup-log.txt
)

REM Install iisnode if not already installed
if not exist "%ProgramFiles%\iisnode\iisnode.dll" (
    echo Installing iisnode module...
    echo [%date% %time%] Installing iisnode module >> iis-setup-log.txt
    
    mkdir "%TEMP%\iisnode" 2>nul
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/azure/iisnode/releases/download/v0.2.26/iisnode-full-v0.2.26-x64.msi' -OutFile '%TEMP%\iisnode\iisnode.msi'}"
    
    if %ERRORLEVEL% neq 0 (
        echo Failed to download iisnode.
        echo [%date% %time%] ERROR: iisnode download failed >> iis-setup-log.txt
        pause
        exit /b 1
    )
    
    start /wait msiexec /i "%TEMP%\iisnode\iisnode.msi" /quiet /norestart
    
    if not exist "%ProgramFiles%\iisnode\iisnode.dll" (
        echo ERROR: iisnode installation failed.
        echo [%date% %time%] ERROR: iisnode installation failed >> iis-setup-log.txt
        pause
        exit /b 1
    )
    
    echo iisnode installed successfully.
    echo [%date% %time%] iisnode installed successfully >> iis-setup-log.txt
) else (
    echo iisnode is already installed.
    echo [%date% %time%] iisnode already installed >> iis-setup-log.txt
)

REM Build the frontend if not already built
if not exist "..\dist" (
    echo Building frontend application...
    echo [%date% %time%] Building frontend >> iis-setup-log.txt
    
    cd ..
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install frontend dependencies.
        echo [%date% %time%] ERROR: Frontend npm install failed >> server\iis-setup-log.txt
        cd server
        pause
        exit /b 1
    )
    
    call npm run build
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to build frontend.
        echo [%date% %time%] ERROR: Frontend build failed >> server\iis-setup-log.txt
        cd server
        pause
        exit /b 1
    )
    
    cd server
    echo Frontend built successfully.
    echo [%date% %time%] Frontend built successfully >> iis-setup-log.txt
) else (
    echo Frontend already built.
    echo [%date% %time%] Frontend already built >> iis-setup-log.txt
)

REM Install server dependencies
if not exist "node_modules" (
    echo Installing server dependencies...
    echo [%date% %time%] Installing server dependencies >> iis-setup-log.txt
    
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install server dependencies.
        echo [%date% %time%] ERROR: Server npm install failed >> iis-setup-log.txt
        pause
        exit /b 1
    )
    
    echo Server dependencies installed.
    echo [%date% %time%] Server dependencies installed >> iis-setup-log.txt
)

REM Create web.config file
echo Creating web.config file...
echo [%date% %time%] Creating web.config file >> iis-setup-log.txt

echo ^<?xml version="1.0" encoding="UTF-8"?^> > web.config
echo ^<configuration^> >> web.config
echo   ^<system.webServer^> >> web.config
echo     ^<handlers^> >> web.config
echo       ^<add name="iisnode" path="server.js" verb="*" modules="iisnode" /^> >> web.config
echo     ^</handlers^> >> web.config
echo     ^<rewrite^> >> web.config
echo       ^<rules^> >> web.config
echo         ^<rule name="API"^> >> web.config
echo           ^<match url="api/(.*)"/^> >> web.config
echo           ^<action type="Rewrite" url="server.js"/^> >> web.config
echo         ^</rule^> >> web.config
echo         ^<rule name="StaticContent"^> >> web.config
echo           ^<match url="(.*)" /^> >> web.config
echo           ^<action type="Rewrite" url="../dist/{R:1}" /^> >> web.config
echo           ^<conditions^> >> web.config
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^> >> web.config
echo           ^</conditions^> >> web.config
echo         ^</rule^> >> web.config
echo         ^<rule name="SPA"^> >> web.config
echo           ^<match url=".*" /^> >> web.config
echo           ^<conditions^> >> web.config
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^> >> web.config
echo             ^<add input="{REQUEST_URI}" pattern="^/api" negate="true" /^> >> web.config
echo           ^</conditions^> >> web.config
echo           ^<action type="Rewrite" url="../dist/index.html" /^> >> web.config
echo         ^</rule^> >> web.config
echo       ^</rules^> >> web.config
echo     ^</rewrite^> >> web.config
echo     ^<iisnode nodeProcessCommandLine="node.exe" watchedFiles="*.js;iisnode.yml" loggingEnabled="true" logDirectory="iisnode" /^> >> web.config
echo     ^<staticContent^> >> web.config
echo       ^<mimeMap fileExtension=".json" mimeType="application/json" /^> >> web.config
echo     ^</staticContent^> >> web.config
echo   ^</system.webServer^> >> web.config
echo ^</configuration^> >> web.config

echo Web.config created successfully.
echo [%date% %time%] Web.config created successfully >> iis-setup-log.txt

REM Create IIS Website
set SITE_NAME=LicenseManager
set APP_POOL_NAME=LicenseManagerPool
set PHYSICAL_PATH=%cd%

echo Creating IIS application pool...
%windir%\system32\inetsrv\appcmd.exe list apppool /name:%APP_POOL_NAME% > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Application pool %APP_POOL_NAME% already exists. Recreating...
    %windir%\system32\inetsrv\appcmd.exe delete apppool %APP_POOL_NAME%
)

%windir%\system32\inetsrv\appcmd.exe add apppool /name:%APP_POOL_NAME% /managedRuntimeVersion:""
%windir%\system32\inetsrv\appcmd.exe set apppool /apppool.name:%APP_POOL_NAME% /processModel.identityType:LocalSystem
echo Application pool created.
echo [%date% %time%] Application pool created >> iis-setup-log.txt

echo Creating IIS website...
REM Check if the site already exists
%windir%\system32\inetsrv\appcmd.exe list site /name:%SITE_NAME% > nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Website %SITE_NAME% already exists. Recreating...
    %windir%\system32\inetsrv\appcmd.exe delete site %SITE_NAME%
)

REM Create the website with binding to all IP addresses
%windir%\system32\inetsrv\appcmd.exe add site /name:%SITE_NAME% /physicalPath:%PHYSICAL_PATH% /bindings:http/*:3001:
%windir%\system32\inetsrv\appcmd.exe set site /site.name:%SITE_NAME% /[path='/'].applicationPool:%APP_POOL_NAME%
echo Website created.
echo [%date% %time%] Website created >> iis-setup-log.txt

REM Configure Windows Firewall
echo Configuring Windows Firewall...
echo [%date% %time%] Configuring Windows Firewall >> iis-setup-log.txt

powershell -Command "& {try { $rule = Get-NetFirewallRule -DisplayName 'License Manager IIS Port 3001' -ErrorAction Stop; Write-Host 'Firewall rule already exists' } catch { New-NetFirewallRule -DisplayName 'License Manager IIS Port 3001' -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow; Write-Host 'Firewall rule created successfully' }}"

REM Create desktop shortcuts
echo Creating desktop shortcuts...
echo [%date% %time%] Creating desktop shortcuts >> iis-setup-log.txt

REM Get the Public desktop and current user's desktop paths
set "PublicDesktop=%PUBLIC%\Desktop"
set "UserDesktop=%USERPROFILE%\Desktop"

REM Create shortcut to application
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%PublicDesktop%\License Manager.lnk'); $Shortcut.TargetPath = 'http://localhost:3001'; $Shortcut.Save(); Write-Host 'Created shortcut on Public desktop'}"
powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%UserDesktop%\License Manager.lnk'); $Shortcut.TargetPath = 'http://localhost:3001'; $Shortcut.Save(); Write-Host 'Created shortcut on User desktop'}"

REM Create script to start IIS Express for testing
echo Creating IIS Express start script...
echo @echo off > start-iis-express.bat
echo echo Starting License Manager in IIS Express... >> start-iis-express.bat
echo "%ProgramFiles%\IIS Express\iisexpress.exe" /path:%cd% /port:3001 >> start-iis-express.bat
echo Created IIS Express start script.

REM Get the machine's IP addresses for display
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "Loopback" ^| findstr /v "169.254"') do (
    set IP=%%a
    set IP=!IP:~1!
    goto :found_ip
)

:found_ip
if "!IP!"=="" set IP=localhost

echo.
echo ===================================================
echo Installation Complete!
echo ===================================================
echo.
echo License Manager has been installed as an IIS website.
echo.
echo You can access the application at: 
echo - http://localhost:3001
echo - http://iltela21:3001
echo - http://!IP!:3001
echo.
echo The website has been set up with the following configuration:
echo - Website Name: %SITE_NAME%
echo - Application Pool: %APP_POOL_NAME%
echo - Physical Path: %PHYSICAL_PATH%
echo - Port: 3001
echo.
echo Shortcuts have been created on your desktop:
echo - "License Manager" - Opens the application in your browser
echo.
echo To manage the website in IIS Manager:
echo 1. Open IIS Manager (Start menu -^> Run -^> "inetmgr")
echo 2. Navigate to Sites -^> %SITE_NAME%
echo.
echo If you encounter any issues, please check:
echo - iis-setup-log.txt for installation details
echo - iisnode folder for Node.js logs
echo.

REM Try to open the application in the default browser
start http://localhost:3001

echo [%date% %time%] Setup completed successfully >> iis-setup-log.txt
echo.
echo Press any key to exit...
pause > nul
endlocal
