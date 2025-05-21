
# PowerShell script to install the License Manager as a Windows service
# Run this script as Administrator

$ServiceName = "LicenseManagerService"
$Description = "License Manager Application Service"
$WorkingDirectory = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$BatchPath = Join-Path -Path $WorkingDirectory -ChildPath "start-service.bat"
$NSSMPath = Join-Path -Path $WorkingDirectory -ChildPath "nssm.exe"

# First, check if NSSM is present
if (-not (Test-Path $NSSMPath)) {
    Write-Host "NSSM (Non-Sucking Service Manager) not found. Please download it from https://nssm.cc/download"
    Write-Host "Place nssm.exe in the same directory as this script."
    Write-Host "Then run this script again."
    exit 1
}

# Check for the dist folder
$ProjectRoot = Split-Path -Path $WorkingDirectory -Parent
$DistPath = Join-Path -Path $ProjectRoot -ChildPath "dist"

if (-not (Test-Path $DistPath)) {
    Write-Host "WARNING: The dist folder was not found at $DistPath" -ForegroundColor Yellow
    Write-Host "You need to build the frontend application before starting the service." -ForegroundColor Yellow
    Write-Host "To build the frontend, navigate to the project root and run:" -ForegroundColor Cyan
    Write-Host "    npm install" -ForegroundColor Cyan
    Write-Host "    npm run build" -ForegroundColor Cyan
    
    $continue = Read-Host "Do you want to continue installing the service anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Check if the service already exists
$ServiceExists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($ServiceExists) {
    Write-Host "Service $ServiceName already exists. Removing it first..."
    & $NSSMPath stop $ServiceName
    Start-Sleep -Seconds 2
    & $NSSMPath remove $ServiceName confirm
    Start-Sleep -Seconds 2
}

# Install the new service
Write-Host "Installing $ServiceName..."
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

# Set the service to restart on failure
& $NSSMPath set $ServiceName AppExit Default Restart
& $NSSMPath set $ServiceName AppRestartDelay 10000

# Print the Node.js path for debugging
Write-Host "Using Node.js path:"
& where node

# Try to get the IP address for display at the end
$IPAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Ethernet*" -or $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object -First 1).IPAddress
if (-not $IPAddress) {
    $IPAddress = "YOUR_SERVER_IP"
}

# Start the service
Write-Host "Starting $ServiceName..."
try {
    Start-Service -Name $ServiceName -ErrorAction Stop
    Write-Host "License Manager service has been installed and started successfully." -ForegroundColor Green
} catch {
    Write-Host "WARNING: Failed to start the service automatically." -ForegroundColor Red
    Write-Host "You can try to start it manually from Services." -ForegroundColor Yellow
    Write-Host "Error details: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "The application should be accessible at: http://$IPAddress`:3001" -ForegroundColor Cyan
Write-Host "If the service failed to start, check the logs in:" -ForegroundColor Cyan
Write-Host "  - $WorkingDirectory\service-output.log"
Write-Host "  - $WorkingDirectory\service-error.log"

# Add helpful tips
Write-Host ""
Write-Host "Troubleshooting Tips:" -ForegroundColor Yellow
Write-Host "1. Make sure Node.js is installed and in the system PATH"
Write-Host "2. Check that all dependencies are installed (run 'npm install' in both root and server folders)"
Write-Host "3. Make sure to build the frontend before starting the service (run 'npm run build' in the project root)"
Write-Host "4. Verify that port 3001 is not being used by another application"
Write-Host "5. Ensure the Windows Firewall allows connections to port 3001"
