
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

REM Check for URL Rewrite Module
if not exist "%ProgramFiles%\IIS\Rewrite\rewrite.dll" (
    if not exist "%ProgramFiles(x86)%\IIS\Rewrite\rewrite.dll" (
        echo WARNING: URL Rewrite Module may not be installed.
        echo This is required for the website to work properly.
        echo.
        echo Would you like to download and install it now? (Y/N)
        set /p INSTALL_REWRITE=
        if /i "%INSTALL_REWRITE%"=="Y" (
            echo Downloading URL Rewrite Module...
            mkdir "%TEMP%\urlrewrite" 2>nul
            powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://download.microsoft.com/download/D/D/E/DDE57C26-C62C-4C59-A1BB-31D58B36ADA2/rewrite_amd64.msi' -OutFile '%TEMP%\urlrewrite\rewrite_amd64.msi'}"
            
            if %ERRORLEVEL% neq 0 (
                echo Failed to download URL Rewrite Module.
                echo Please install it manually from: https://www.iis.net/downloads/microsoft/url-rewrite
                echo Then run this script again.
                pause
                exit /b 1
            )
            
            echo Installing URL Rewrite Module...
            start /wait msiexec /i "%TEMP%\urlrewrite\rewrite_amd64.msi" /quiet /norestart
            echo URL Rewrite Module installed.
        ) else (
            echo Continuing without installing URL Rewrite Module...
            echo Note: The website may not function correctly without it.
        )
    )
)

REM Manually fix web.config file before installation
echo Ensuring web.config file is properly formatted...
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<handlers^>
echo       ^<add name="iisnode" path="server.js" verb="*" modules="iisnode" /^>
echo     ^</handlers^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="API"^>
echo           ^<match url="api/(.*)" /^>
echo           ^<action type="Rewrite" url="server.js" /^>
echo         ^</rule^>
echo         ^<rule name="StaticContent"^>
echo           ^<match url="(.*)" /^>
echo           ^<action type="Rewrite" url="../dist/{R:1}" /^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo           ^</conditions^>
echo         ^</rule^>
echo         ^<rule name="SPA"^>
echo           ^<match url=".*" /^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^>
echo             ^<add input="{REQUEST_URI}" pattern="^/api" negate="true" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="../dist/index.html" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo     ^<iisnode nodeProcessCommandLine="node.exe" watchedFiles="*.js;iisnode.yml" loggingEnabled="true" logDirectory="iisnode" /^>
echo     ^<staticContent^>
echo       ^<mimeMap fileExtension=".json" mimeType="application/json" /^>
echo     ^</staticContent^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > web.config

REM Set proper permissions immediately
echo Setting proper permissions on web.config...
icacls web.config /grant "IIS_IUSRS:(R)" /T
icacls web.config /grant "NETWORK SERVICE:(R)" /T
icacls web.config /grant "Everyone:(R)" /T
echo Web.config has been properly formatted and permissions set.

call install-iis-website.bat

echo ===================================================
echo License Manager IIS website setup complete!
echo ===================================================
echo.
echo If the browser didn't open automatically, you can access the application at:
echo - http://localhost:3001
echo - http://iltela21:3001
echo.
echo If you don't see the website in IIS Manager or get an error:
echo 1. Make sure you ran this script as administrator
echo 2. Try restarting IIS (type 'iisreset' in a command prompt)
echo 3. Check the iis-setup-log.txt file for any errors
echo 4. Look for error logs in the iisnode folder
echo.

REM Automatic iisreset to ensure changes take effect
echo Restarting IIS to apply all changes...
iisreset /restart
echo IIS restarted successfully.

echo Press any key to exit...
pause > nul
