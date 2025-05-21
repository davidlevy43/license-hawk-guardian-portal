
# PowerShell script to install the License Manager as a Windows service
# Run this script as Administrator

$ServiceName = "LicenseManagerService"
$Description = "License Manager Application Service"
$WorkingDirectory = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$BatchPath = Join-Path -Path $WorkingDirectory -ChildPath "start-service.bat"
$NSSMPath = Join-Path -Path $WorkingDirectory -ChildPath "nssm.exe"

# First, check for Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    Write-Host "Please restart PowerShell as Administrator and run the script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'." -ForegroundColor Yellow
    pause
    exit 1
}

# Verify necessary files exist
if (-not (Test-Path $BatchPath)) {
    Write-Host "Error: start-service.bat not found at $BatchPath" -ForegroundColor Red
    Write-Host "Make sure you're running this script from the server directory." -ForegroundColor Yellow
    pause
    exit 1
}

# Check if the node command is available
$nodeExists = $null -ne (Get-Command "node" -ErrorAction SilentlyContinue)
if (-not $nodeExists) {
    Write-Host "Error: Node.js is not installed or not in the PATH." -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Then restart PowerShell and try again." -ForegroundColor Yellow
    pause
    exit 1
}

# Check if NSSM is present
if (-not (Test-Path $NSSMPath)) {
    Write-Host "NSSM (Non-Sucking Service Manager) not found. Please download it from https://nssm.cc/download" -ForegroundColor Red
    Write-Host "Place nssm.exe in the same directory as this script ($WorkingDirectory)." -ForegroundColor Red
    Write-Host "Then run this script again." -ForegroundColor Red
    pause
    exit 1
}

# Test if the service batch file can run without errors
Write-Host "Testing if start-service.bat can run correctly..." -ForegroundColor Cyan
$testProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c echo Testing batch file & exit" -WorkingDirectory $WorkingDirectory -NoNewWindow -PassThru
$testProcess.WaitForExit()
if ($testProcess.ExitCode -ne 0) {
    Write-Host "Warning: The test run of the batch command failed." -ForegroundColor Yellow
    Write-Host "There might be issues when running the service." -ForegroundColor Yellow
    
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Check for the dist folder
$ProjectRoot = Split-Path -Path $WorkingDirectory -Parent
$DistPath = Join-Path -Path $ProjectRoot -ChildPath "dist"

if (-not (Test-Path $DistPath)) {
    Write-Host "WARNING: The dist folder was not found at $DistPath" -ForegroundColor Yellow
    Write-Host "You need to build the frontend application before starting the service." -ForegroundColor Yellow
    
    $continue = Read-Host "Would you like to build the frontend now? (y/n)"
    if ($continue -eq "y") {
        Write-Host "Building frontend..." -ForegroundColor Cyan
        $BuildScript = Join-Path -Path $WorkingDirectory -ChildPath "build-frontend.bat"
        if (Test-Path $BuildScript) {
            try {
                $process = Start-Process -FilePath $BuildScript -Wait -NoNewWindow -PassThru
                if ($process.ExitCode -ne 0) {
                    Write-Host "Error: Frontend build failed. Please check the errors and try again." -ForegroundColor Red
                    $continue = Read-Host "Continue installing the service anyway? (y/n)"
                    if ($continue -ne "y") {
                        exit 1
                    }
                }
            } catch {
                Write-Host "Error: Failed to run build script. $_" -ForegroundColor Red
                $continue = Read-Host "Continue installing the service anyway? (y/n)"
                if ($continue -ne "y") {
                    exit 1
                }
            }
        } else {
            Write-Host "Error: build-frontend.bat not found." -ForegroundColor Red
            Write-Host "To build the frontend, navigate to the project root and run:" -ForegroundColor Cyan
            Write-Host "    npm install" -ForegroundColor Cyan
            Write-Host "    npm run build" -ForegroundColor Cyan
            
            $continue = Read-Host "Continue installing the service anyway? (y/n)"
            if ($continue -ne "y") {
                exit 1
            }
        }
    } else {
        $continue = Read-Host "Continue installing the service without frontend files? (y/n)"
        if ($continue -ne "y") {
            exit 1
        }
    }
}

# Verify service port 3001 is not in use
$portInUse = $null -ne (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue)
if ($portInUse) {
    Write-Host "WARNING: Port 3001 is already in use!" -ForegroundColor Yellow
    Write-Host "The service may fail to start because the port is occupied." -ForegroundColor Yellow
    Write-Host "Close any applications using port 3001 before proceeding." -ForegroundColor Yellow
    
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
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

# Install the new service
Write-Host "Installing $ServiceName..." -ForegroundColor Cyan
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

# Set user context to run service (current user with environment)
& $NSSMPath set $ServiceName ObjectName LocalSystem
& $NSSMPath set $ServiceName Type SERVICE_WIN32_OWN_PROCESS
& $NSSMPath set $ServiceName AppNoConsole 1
& $NSSMPath set $ServiceName DependOnService Tcpip

# Set the service to restart on failure
& $NSSMPath set $ServiceName AppExit Default Restart
& $NSSMPath set $ServiceName AppRestartDelay 10000
& $NSSMPath set $ServiceName AppThrottle 10000

# Print the Node.js path for debugging
$NodePath = where.exe node
Write-Host "Using Node.js path:" -ForegroundColor Cyan
Write-Host $NodePath -ForegroundColor White

# Try to get the IP address for display at the end
$IPAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Ethernet*" -or $_.InterfaceAlias -like "*Wi-Fi*" } | Select-Object -First 1).IPAddress
if (-not $IPAddress) {
    $IPAddress = "YOUR_SERVER_IP"
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
    Write-Host "You can try to start it manually from Services." -ForegroundColor Yellow
    Write-Host "Error details: $_" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Would you like to try running the server directly (not as a service)?" -ForegroundColor Yellow
    $runDirectly = Read-Host "Run server directly now? (y/n)"
    
    if ($runDirectly -eq "y") {
        Write-Host "Starting server directly..." -ForegroundColor Cyan
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c $BatchPath" -WorkingDirectory $WorkingDirectory
    }
}

Write-Host ""
Write-Host "The application should be accessible at: http://$IPAddress`:3001" -ForegroundColor Cyan
Write-Host "If the service failed to start, check the logs in:" -ForegroundColor Cyan
Write-Host "  - $WorkingDirectory\service-log.txt" -ForegroundColor White
Write-Host "  - $WorkingDirectory\service-output.log" -ForegroundColor White
Write-Host "  - $WorkingDirectory\service-error.log" -ForegroundColor White

# Add helpful tips
Write-Host ""
Write-Host "Troubleshooting Tips:" -ForegroundColor Yellow
Write-Host "1. Make sure Node.js is installed and in the system PATH"
Write-Host "2. Check that all dependencies are installed (run 'npm install' in both root and server folders)"
Write-Host "3. Make sure to build the frontend before starting the service (run 'npm run build' in the project root)"
Write-Host "4. Verify that port 3001 is not being used by another application"
Write-Host "5. Ensure the Windows Firewall allows connections to port 3001"
Write-Host "6. Check if the current user has permissions to run services"
Write-Host "7. Try running the server directly with 'node server.js' to see if there are any immediate errors"

Write-Host ""
Write-Host "Quick Commands:" -ForegroundColor Yellow
Write-Host "- To start the service manually: Start-Service $ServiceName" -ForegroundColor White
Write-Host "- To stop the service: Stop-Service $ServiceName" -ForegroundColor White
Write-Host "- To check service status: Get-Service $ServiceName" -ForegroundColor White
Write-Host "- To view the Windows event logs for the service: Get-EventLog -LogName System -Source Service* | Where-Object {`$_.Message -like '*$ServiceName*'} | Select-Object -First 10" -ForegroundColor White
Write-Host ""
Write-Host "You can also manage the service through the Windows Services console (services.msc)" -ForegroundColor White

# If the service failed to start, suggest running directly
if ((Get-Service -Name $ServiceName -ErrorAction SilentlyContinue).Status -ne "Running") {
    Write-Host ""
    Write-Host "IMPORTANT: Since the service failed to start, try running the server directly:" -ForegroundColor Red
    Write-Host "1. Open a Command Prompt as Administrator" -ForegroundColor White
    Write-Host "2. Navigate to: $WorkingDirectory" -ForegroundColor White
    Write-Host "3. Run: node server.js" -ForegroundColor White
    Write-Host "This will show you any immediate startup errors that might be preventing the service from running." -ForegroundColor White
}
