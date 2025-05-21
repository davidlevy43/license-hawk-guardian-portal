
# Running License Manager as a Windows Server 2022 Service

This guide explains how to run the License Manager application as a Windows service, allowing users to access it through the local network without internet access.

## Prerequisites

1. Windows Server 2022
2. Node.js installed on the server
3. NSSM (Non-Sucking Service Manager) - download from [https://nssm.cc/download](https://nssm.cc/download)

## Installation Steps

### 1. Prepare the application

1. Copy the entire application folder to your Windows Server
2. Open a Command Prompt as Administrator and navigate to the application folder
3. Install dependencies:
   ```
   npm install
   cd server
   npm install
   ```
4. Build the frontend:
   ```
   cd ..
   npm run build
   ```

### 2. Install as a Windows Service

1. Download NSSM from [https://nssm.cc/download](https://nssm.cc/download)
2. Extract `nssm.exe` and place it in the `server` folder of your application
3. Open PowerShell as Administrator and navigate to the `server` folder
4. Run the installation script:
   ```
   .\install-as-service.ps1
   ```
5. The service will be installed and started automatically

### 3. Accessing the Application

Once the service is running, users on the local network can access the application by navigating to:

```
http://YOUR_SERVER_IP:3001
```

Replace `YOUR_SERVER_IP` with the actual IP address or hostname of your Windows Server.

### 4. Managing the Service

You can manage the License Manager service using the Windows Services console:

1. Press `Win + R`, type `services.msc` and press Enter
2. Find "License Manager Application" in the list of services
3. Use the service controls to start, stop, or restart the service as needed

### 5. Troubleshooting

If you encounter any issues:

#### Server Won't Start

1. Check the log files in the `server` folder:
   - `service-log.txt` - Basic service startup information
   - `service-output.log` - Standard output from the application
   - `service-error.log` - Error logs from the application

2. Verify Node.js installation:
   - Open Command Prompt and run `node --version` to check that Node.js is installed
   - If not found, download and install Node.js from [https://nodejs.org/](https://nodejs.org/)
   - Make sure the Node.js path is in your system PATH environment variable
   - Restart the server after installation

3. Check for dependency issues:
   - Navigate to project folder and run `npm install` in both the root and server directories
   - Look for any error messages during installation

4. Try running the server directly (not as a service):
   - Navigate to the server directory in Command Prompt
   - Run `node server.js` to see any immediate startup errors
   - If there are errors, fix them before trying to run as a service

#### Service Won't Start ("Windows could not start the License Manager Application service")

This is often caused by:

1. **Node.js not found**: Make sure Node.js is in the system PATH for the SYSTEM account, not just your user account.
2. **Permission issues**: Services run under the LocalSystem account by default, which may not have the same permissions as your user account.
3. **Port conflicts**: Another application might be using port 3001.
4. **Path issues**: The service may be looking for files in the wrong location.

Solutions:

1. Make sure you've run the install script (`install-as-service.ps1`) as Administrator.
2. In `services.msc`, check the service properties:
   - Ensure the "Path to executable" is correctly pointing to nssm.exe
   - Check the "Log On" tab to ensure it's set to "Local System Account"
3. Configure Windows Firewall to allow the application (port 3001)
4. Check the Windows Event Viewer for detailed error messages:
   - Open Event Viewer (eventvwr.msc)
   - Go to Windows Logs > System
   - Look for Service Control Manager entries related to LicenseManagerService

#### Firewall Issues

1. Make sure port 3001 is allowed through the Windows Firewall:
   - Open Windows Defender Firewall with Advanced Security
   - Select "Inbound Rules" and click "New Rule..."
   - Select "Port" and click Next
   - Select "TCP" and specify port "3001"
   - Allow the connection and complete the wizard

#### Service Installation Issues

1. If NSSM fails to install or start the service:
   - Check that you're running PowerShell as Administrator
   - Manually install the service by running:
     ```
     nssm install LicenseManagerService "path\to\start-service.bat"
     nssm set LicenseManagerService AppDirectory "path\to\server\directory"
     nssm start LicenseManagerService
     ```

#### Cannot Access From Other Computers

1. Verify the IP address:
   - Open Command Prompt on the server and type `ipconfig`
   - Look for the IPv4 Address under your active network adapter
   - Use this IP to access the application (e.g., `http://192.168.1.100:3001`)

2. Test local access first:
   - On the server itself, open a browser and go to `http://localhost:3001`
   - If this works but network access doesn't, it's likely a network/firewall issue

### 6. Manually Starting the Server (Alternative Method)

If you prefer not to use the Windows service, you can start the server manually:

1. Open Command Prompt as Administrator
2. Navigate to the server folder
3. Run the following command:
   ```
   node server.js
   ```
4. Keep the Command Prompt window open while using the application

Note: This method requires the Command Prompt window to remain open.

### 7. Run Directly Using the Batch File

If the service won't start, you can try running the application directly:

1. Open Command Prompt as Administrator
2. Navigate to the server folder
3. Run the `start-service.bat` file:
   ```
   start-service.bat
   ```
4. This will run outside of the service system and display any errors directly

### 8. Common Error Messages

#### "Windows could not start the License Manager Application service"

This generic Windows error usually means:
- The service executable (nssm.exe) couldn't be found
- The batch file path is incorrect
- Node.js is not accessible to the SYSTEM account
- A required dependency is missing

Check the Windows Event Logs (Event Viewer) for more specific error messages.

#### "The service did not return an error"

This typically means the service started but then crashed immediately. Check:
- The service-error.log file for JavaScript errors
- Make sure all required environment variables are set
- Verify that all required files exist in the expected locations
