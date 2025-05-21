
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
    Write-Host "License Manager service has been installed and started successfully."
} catch {
    Write-Host "WARNING: Failed to start the service automatically. You can try to start it manually from Services."
    Write-Host "Error details: $_"
}

Write-Host "The application should be accessible at: http://$IPAddress`:3001"
Write-Host "If the service failed to start, check the logs in:"
Write-Host "  - $WorkingDirectory\service-output.log"
Write-Host "  - $WorkingDirectory\service-error.log"

# Add helpful tips
Write-Host ""
Write-Host "Troubleshooting Tips:"
Write-Host "1. Make sure Node.js is installed and in the system PATH"
Write-Host "2. Check that all dependencies are installed (run 'npm install' in both root and server folders)"
Write-Host "3. Verify that port 3001 is not being used by another application"
Write-Host "4. Ensure the Windows Firewall allows connections to port 3001"
