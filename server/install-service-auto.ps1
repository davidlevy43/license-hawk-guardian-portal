
# PowerShell script to fully install the License Manager as a Windows service
# Run this script as Administrator

# Configuration
$ServiceName = "LicenseManagerService"
$Description = "License Manager Application Service"
$WorkingDirectory = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$ProjectRoot = Split-Path -Path $WorkingDirectory -Parent
$BatchPath = Join-Path -Path $WorkingDirectory -ChildPath "start-service.bat"
$NSSMPath = Join-Path -Path $WorkingDirectory -ChildPath "nssm.exe"
$LogFile = Join-Path -Path $WorkingDirectory -ChildPath "install-log.txt"

# Start logging
Start-Transcript -Path $LogFile -Force
Write-Host "========================================================"
Write-Host "License Manager Service Installation Script" -ForegroundColor Cyan
Write-Host "Started at: $(Get-Date)" -ForegroundColor Cyan
Write-Host "========================================================"
Write-Host ""

# Check for Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    Write-Host "Please restart PowerShell as Administrator and run the script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'." -ForegroundColor Yellow
    Stop-Transcript
    exit 1
}

# Check for NSSM
if (-not (Test-Path $NSSMPath)) {
    Write-Host "NSSM (Non-Sucking Service Manager) not found. Downloading it now..." -ForegroundColor Yellow
    
    # Create a temporary directory for downloading NSSM
    $TempDir = Join-Path -Path $env:TEMP -ChildPath "nssm_download"
    if (-not (Test-Path $TempDir)) {
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    }
    
    $NSSMZipPath = Join-Path -Path $TempDir -ChildPath "nssm.zip"
    $NSSMExtractPath = Join-Path -Path $TempDir -ChildPath "nssm_extract"
    
    try {
        # Download NSSM
        Write-Host "Downloading NSSM..." -ForegroundColor Cyan
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $WebClient = New-Object System.Net.WebClient
        $WebClient.DownloadFile("https://nssm.cc/release/nssm-2.24.zip", $NSSMZipPath)
        
        # Extract the ZIP file
        Write-Host "Extracting NSSM..." -ForegroundColor Cyan
        Expand-Archive -Path $NSSMZipPath -DestinationPath $NSSMExtractPath -Force
        
        # Find the correct NSSM executable based on architecture
        $NSSMExePath = if ([Environment]::Is64BitOperatingSystem) {
            Get-ChildItem -Path $NSSMExtractPath -Recurse -Filter "nssm.exe" | Where-Object { $_.FullName -like "*win64*" } | Select-Object -First 1 -ExpandProperty FullName
        } else {
            Get-ChildItem -Path $NSSMExtractPath -Recurse -Filter "nssm.exe" | Where-Object { $_.FullName -like "*win32*" } | Select-Object -First 1 -ExpandProperty FullName
        }
        
        # Copy NSSM to the working directory
        Copy-Item -Path $NSSMExePath -Destination $NSSMPath -Force
        
        Write-Host "NSSM downloaded and extracted successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Error downloading or extracting NSSM: $_" -ForegroundColor Red
        Write-Host "Please download it manually from https://nssm.cc/download" -ForegroundColor Yellow
        Write-Host "Place nssm.exe in: $WorkingDirectory" -ForegroundColor Yellow
        Stop-Transcript
        exit 1
    }
    finally {
        # Clean up temporary files
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Check if Node.js is installed
Write-Host "Checking for Node.js installation..." -ForegroundColor Cyan
$nodeExists = $null -ne (Get-Command "node" -ErrorAction SilentlyContinue)
if (-not $nodeExists) {
    Write-Host "Node.js is not installed. Installing Node.js LTS version..." -ForegroundColor Yellow
    
    try {
        # Create a temporary directory for downloading Node.js
        $TempDir = Join-Path -Path $env:TEMP -ChildPath "nodejs_download"
        if (-not (Test-Path $TempDir)) {
            New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
        }
        
        $NodeInstallerPath = Join-Path -Path $TempDir -ChildPath "node_installer.msi"
        
        # Download Node.js LTS version
        Write-Host "Downloading Node.js LTS..." -ForegroundColor Cyan
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $WebClient = New-Object System.Net.WebClient
        $WebClient.DownloadFile("https://nodejs.org/dist/v18.18.2/node-v18.18.2-x64.msi", $NodeInstallerPath)
        
        # Install Node.js silently
        Write-Host "Installing Node.js..." -ForegroundColor Cyan
        Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $NodeInstallerPath, "/quiet", "/norestart" -Wait
        
        # Refresh the PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        
        Write-Host "Node.js installed successfully." -ForegroundColor Green
        
        # Verify Node.js installation
        try {
            $nodeVersion = node --version
            Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
        }
        catch {
            Write-Host "Node.js installation verification failed. You may need to restart the computer." -ForegroundColor Yellow
            Write-Host "Please restart the computer and run this script again." -ForegroundColor Yellow
            Stop-Transcript
            exit 1
        }
    }
    catch {
        Write-Host "Error installing Node.js: $_" -ForegroundColor Red
        Write-Host "Please install Node.js manually from https://nodejs.org/" -ForegroundColor Yellow
        Stop-Transcript
        exit 1
    }
    finally {
        # Clean up temporary files
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
else {
    $nodeVersion = node --version
    Write-Host "Node.js is already installed. Version: $nodeVersion" -ForegroundColor Green
}

# Install dependencies and build frontend
Write-Host "Installing project dependencies and building frontend..." -ForegroundColor Cyan

# Navigate to project root
Push-Location -Path $ProjectRoot

try {
    # Install root dependencies
    Write-Host "Installing root project dependencies..." -ForegroundColor Cyan
    $npmInstallProcess = Start-Process -FilePath "npm" -ArgumentList "install" -Wait -NoNewWindow -PassThru
    if ($npmInstallProcess.ExitCode -ne 0) {
        Write-Host "Warning: npm install in root directory returned exit code $($npmInstallProcess.ExitCode)" -ForegroundColor Yellow
        Write-Host "Continuing with installation despite this warning..." -ForegroundColor Yellow
    }
    
    # Build the frontend
    Write-Host "Building the frontend application..." -ForegroundColor Cyan
    $npmBuildProcess = Start-Process -FilePath "npm" -ArgumentList "run", "build" -Wait -NoNewWindow -PassThru
    if ($npmBuildProcess.ExitCode -ne 0) {
        Write-Host "Error: Frontend build failed with exit code $($npmBuildProcess.ExitCode)" -ForegroundColor Red
        Write-Host "Please check error messages above and fix any issues." -ForegroundColor Yellow
        Write-Host "The service will be installed but may not work correctly without the frontend." -ForegroundColor Yellow
    }
    else {
        Write-Host "Frontend built successfully." -ForegroundColor Green
    }
}
catch {
    Write-Host "Error during dependency installation or build: $_" -ForegroundColor Red
}
finally {
    # Return to server directory
    Pop-Location
}

# Install server dependencies
Push-Location -Path $WorkingDirectory
try {
    Write-Host "Installing server dependencies..." -ForegroundColor Cyan
    $serverNpmInstallProcess = Start-Process -FilePath "npm" -ArgumentList "install" -Wait -NoNewWindow -PassThru
    if ($serverNpmInstallProcess.ExitCode -ne 0) {
        Write-Host "Error: npm install in server directory failed with exit code $($serverNpmInstallProcess.ExitCode)" -ForegroundColor Red
    }
    else {
        Write-Host "Server dependencies installed successfully." -ForegroundColor Green
    }
}
catch {
    Write-Host "Error during server dependency installation: $_" -ForegroundColor Red
}
finally {
    Pop-Location
}

# Check for the dist folder
$DistPath = Join-Path -Path $ProjectRoot -ChildPath "dist"
if (-not (Test-Path $DistPath)) {
    Write-Host "WARNING: The dist folder was not found at $DistPath" -ForegroundColor Yellow
    Write-Host "The service will be installed but may not work correctly without the frontend." -ForegroundColor Yellow
}
else {
    Write-Host "Frontend files found at: $DistPath" -ForegroundColor Green
}

# Check if server.js exists
$ServerJsPath = Join-Path -Path $WorkingDirectory -ChildPath "server.js"
if (-not (Test-Path $ServerJsPath)) {
    Write-Host "ERROR: server.js not found at $ServerJsPath" -ForegroundColor Red
    Write-Host "Cannot install the service without the server application." -ForegroundColor Red
    Stop-Transcript
    exit 1
}

# Create a test file to verify disk write permissions
$TestFilePath = Join-Path -Path $WorkingDirectory -ChildPath "permission_test.tmp"
try {
    "Test" | Out-File -FilePath $TestFilePath -Force
    Remove-Item -Path $TestFilePath -Force
    Write-Host "Disk permission check passed." -ForegroundColor Green
}
catch {
    Write-Host "WARNING: Cannot write to the working directory. Service may have permission issues." -ForegroundColor Yellow
}

# Check if the service already exists
$ServiceExists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($ServiceExists) {
    Write-Host "Service $ServiceName already exists. Removing it first..." -ForegroundColor Yellow
    & $NSSMPath stop $ServiceName
    Start-Sleep -Seconds 2
    & $NSSMPath remove $ServiceName confirm
    Start-Sleep -Seconds 2
}

# Verify start-service.bat exists
if (-not (Test-Path $BatchPath)) {
    Write-Host "Error: start-service.bat not found at $BatchPath" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the server directory." -ForegroundColor Yellow
    Stop-Transcript
    exit 1
}

# Install the service
Write-Host "Installing $ServiceName as a Windows service..." -ForegroundColor Cyan
& $NSSMPath install $ServiceName $BatchPath
& $NSSMPath set $ServiceName DisplayName "License Manager Application"
& $NSSMPath set $ServiceName Description $Description
& $NSSMPath set $ServiceName AppDirectory $WorkingDirectory

# Set proper logging
& $NSSMPath set $ServiceName AppStdout "$WorkingDirectory\service-output.log"
& $NSSMPath set $ServiceName AppStderr "$WorkingDirectory\service-error.log"
& $NSSMPath set $ServiceName AppRotateFiles 1
& $NSSMPath set $ServiceName AppRotateOnline 1
& $NSSMPath set $ServiceName AppRotateSeconds 86400
& $NSSMPath set $ServiceName Start SERVICE_AUTO_START

# Set user context to run service (LocalSystem with environment)
& $NSSMPath set $ServiceName ObjectName LocalSystem
& $NSSMPath set $ServiceName Type SERVICE_WIN32_OWN_PROCESS
& $NSSMPath set $ServiceName AppNoConsole 1
& $NSSMPath set $ServiceName DependOnService Tcpip

# Set the service to restart on failure
& $NSSMPath set $ServiceName AppExit Default Restart
& $NSSMPath set $ServiceName AppRestartDelay 10000
& $NSSMPath set $ServiceName AppThrottle 10000

# Configure Windows Firewall
Write-Host "Configuring Windows Firewall..." -ForegroundColor Cyan
try {
    $FirewallRule = Get-NetFirewallRule -DisplayName "License Manager Service" -ErrorAction SilentlyContinue
    if (-not $FirewallRule) {
        New-NetFirewallRule -DisplayName "License Manager Service" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Description "Allow License Manager Service on port 3001"
        Write-Host "Windows Firewall rule created for port 3001." -ForegroundColor Green
    } else {
        Write-Host "Windows Firewall rule already exists for License Manager Service." -ForegroundColor Green
    }
}
catch {
    Write-Host "Warning: Could not configure Windows Firewall. You may need to manually allow port 3001." -ForegroundColor Yellow
}

# Start the service
Write-Host "Starting $ServiceName..." -ForegroundColor Cyan
try {
    Start-Service -Name $ServiceName -ErrorAction Stop
    Start-Sleep -Seconds 5
    $service = Get-Service -Name $ServiceName
    
    if ($service.Status -eq "Running") {
        Write-Host "License Manager service has been installed and started successfully." -ForegroundColor Green
    } else {
        Write-Host "WARNING: The service is installed but not running. Current status: $($service.Status)" -ForegroundColor Yellow
        Write-Host "Please check the service error logs for details." -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Failed to start the service automatically." -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Would you like to try running the server directly (not as a service)?" -ForegroundColor Yellow
    $runDirectly = Read-Host "Run server directly now? (y/n)"
    
    if ($runDirectly -eq "y") {
        Write-Host "Starting server directly..." -ForegroundColor Cyan
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c $BatchPath" -WorkingDirectory $WorkingDirectory
    }
}

# Verify if we can connect to the service
try {
    $TestConnection = Test-NetConnection -ComputerName localhost -Port 3001 -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($TestConnection) {
        Write-Host "Connection to service port 3001 successful!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Could not connect to port 3001. The service might not be running correctly." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Warning: Could not test connection to service. Error: $_" -ForegroundColor Yellow
}

# Try to get the IP address for display at the end
$IPAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Ethernet*" -or $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object -First 1).IPAddress
if (-not $IPAddress) {
    $IPAddress = "YOUR_SERVER_IP"
}

Write-Host ""
Write-Host "========================================================"
Write-Host "Installation Complete" -ForegroundColor Green
Write-Host "========================================================"
Write-Host ""
Write-Host "The application should be accessible at: http://$IPAddress`:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "Important Information:" -ForegroundColor Yellow
Write-Host "- The service is set to start automatically when the server boots"
Write-Host "- Service Name: $ServiceName"
Write-Host "- Working Directory: $WorkingDirectory"
Write-Host "- Frontend Files: $DistPath"
Write-Host ""
Write-Host "Log Files:" -ForegroundColor Yellow
Write-Host "- $WorkingDirectory\service-log.txt (Installation log)"
Write-Host "- $WorkingDirectory\service-output.log (Service standard output)"
Write-Host "- $WorkingDirectory\service-error.log (Service error output)"
Write-Host ""
Write-Host "Quick Commands:" -ForegroundColor Yellow
Write-Host "- To start the service manually: Start-Service $ServiceName" -ForegroundColor White
Write-Host "- To stop the service: Stop-Service $ServiceName" -ForegroundColor White
Write-Host "- To check service status: Get-Service $ServiceName" -ForegroundColor White
Write-Host "- To view the Windows event logs for the service: Get-EventLog -LogName System -Source Service* | Where-Object {`$_.Message -like '*$ServiceName*'} | Select-Object -First 10" -ForegroundColor White
Write-Host ""
Write-Host "You can also manage the service through the Windows Services console (services.msc)" -ForegroundColor White

# Write date and time to log
Write-Host ""
Write-Host "Installation script completed at: $(Get-Date)" -ForegroundColor Cyan
Write-Host "See $LogFile for full installation log." -ForegroundColor Cyan

# Stop logging
Stop-Transcript
