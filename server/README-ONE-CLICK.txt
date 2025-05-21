
======================================================
LICENSE MANAGER - ONE CLICK SOLUTION
======================================================

This folder contains scripts to easily run the License Manager application.

FOR FIRST-TIME SETUP:
---------------------
1. Right-click on "setup-once-forever.bat" and select "Run as administrator"
2. Wait for the setup to complete (this will install all dependencies and set up the Windows service)
3. The application will open automatically in your browser when done

FOR DAILY USE:
-------------
Simply double-click "START-ONE-CLICK.bat" to launch the application

FOR DEVELOPMENT WITH NETWORK ACCESS:
-----------------------------------
If you're developing the application and want to access it from other computers:
1. Run "START-DEV-SERVER.bat" to start the development server with network access
2. Other computers can connect using http://iltela21:8080 or http://YOUR_SERVER_IP:8080

TROUBLESHOOTING:
---------------
If you encounter issues:
1. Check the log files in this folder (service-output.log and service-error.log)
2. Make sure you ran the setup as administrator
3. Try running "start-service-reliable.bat" to start the server directly
4. If all else fails, repeat the first-time setup

ACCESSING THE APPLICATION:
------------------------
Once running, you can access the application at:
- http://localhost:3001 (from this computer)
- http://iltela21:3001 (from other computers on the network)
- http://YOUR_SERVER_IP:3001 (from other computers on the network)

Your server IP addresses:
(Run ipconfig to see your current IP addresses)

STOPPING THE SERVICE:
-------------------
- To stop the Windows service: Open Services (services.msc), find "License Manager Application", and click Stop
- If running directly from "start-service-reliable.bat": Close the command window

ADDITIONAL INFORMATION:
---------------------
- The application runs on port 3001 (production) or 8080 (development)
- Data is stored in a SQLite database in the server folder
- The frontend files are built and stored in the dist folder
