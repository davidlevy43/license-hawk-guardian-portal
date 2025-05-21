
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
    & $NSSMPath remove $ServiceName confirm
}

# Install the new service
Write-Host "Installing $ServiceName..."
& $NSSMPath install $ServiceName $BatchPath
& $NSSMPath set $ServiceName DisplayName "License Manager Application"
& $NSSMPath set $ServiceName Description $Description
& $NSSMPath set $ServiceName AppDirectory $WorkingDirectory
& $NSSMPath set $ServiceName AppStdout "$WorkingDirectory\service-output.log"
& $NSSMPath set $ServiceName AppStderr "$WorkingDirectory\service-error.log"
& $NSSMPath set $ServiceName Start SERVICE_AUTO_START

# Start the service
Write-Host "Starting $ServiceName..."
Start-Service -Name $ServiceName

Write-Host "License Manager service has been installed and started."
Write-Host "The application should be accessible at: http://YOUR_SERVER_IP:3001"
