
# Running License Manager as a Windows Server Service

This guide explains how to run the License Manager application as a Windows service, allowing users to access it through the local network without internet access.

## Automatic Installation (Recommended)

For a complete automated setup, run the following script as Administrator:

1. Open PowerShell as Administrator
2. Navigate to the `server` folder
3. Run the installation script:
   ```
   .\install-service-auto.ps1
   ```

This script will:
- Check and install Node.js if needed
- Download NSSM if not present
- Install all dependencies
- Build the frontend
- Create and configure the Windows service
- Configure the Windows Firewall
- Start the service automatically

The service will be configured to start automatically when the server boots.

## Manual Installation

If you prefer to install the service manually or the automatic installation fails, follow these steps:

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
   - Run `start-service.bat` or `node server.js` to see any immediate startup errors
   - If there are errors, fix them before trying to run as a service

#### Service Won't Start ("Windows could not start the License Manager Application service")

This is often caused by:

1. **Node.js not found**: Make sure Node.js is in the system PATH for the SYSTEM account, not just your user account.
2. **Permission issues**: Services run under the LocalSystem account by default, which may not have the same permissions as your user account.
3. **Port conflicts**: Another application might be using port 3001.
4. **Path issues**: The service may be looking for files in the wrong location.

Solutions:

1. Make sure you've run the install script as Administrator.
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

#### Cannot Access From Other Computers

1. Verify the IP address:
   - Open Command Prompt on the server and type `ipconfig`
   - Look for the IPv4 Address under your active network adapter
   - Use this IP to access the application (e.g., `http://192.168.1.100:3001`)

2. Test local access first:
   - On the server itself, open a browser and go to `http://localhost:3001`
   - If this works but network access doesn't, it's likely a network/firewall issue
