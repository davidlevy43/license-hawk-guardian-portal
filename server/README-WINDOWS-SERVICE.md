
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

1. Check the log files in the `server` folder:
   - `service-output.log` - Standard output from the application
   - `service-error.log` - Error logs from the application

2. Make sure port 3001 is allowed through the Windows Firewall:
   - Open Windows Defender Firewall with Advanced Security
   - Select "Inbound Rules" and click "New Rule..."
   - Select "Port" and click Next
   - Select "TCP" and specify port "3001"
   - Allow the connection and complete the wizard

3. Verify that the service is running:
   - Open Task Manager
   - Go to the "Details" tab
   - Check if `node.exe` processes are running

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
