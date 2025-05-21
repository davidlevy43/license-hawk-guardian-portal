import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { updateApiUrl, API_URL } from "@/services/api/base";
import { HealthAPI, UserAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Get the server's IP address (to display as hint)
const getLocalIpAddress = () => {
  // This will be replaced with the appropriate local IP at runtime
  return window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useState(() => {
    // Set default URL to iltela21 if that's the current hostname
    if (window.location.hostname === 'iltela21') {
      return `http://iltela21:3001`;
    }
    return sessionStorage.getItem('api_server_url') || `http://${getLocalIpAddress()}:3001`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<string | null>(null);
  
  // Admin user creation state
  const [adminEmail, setAdminEmail] = useState('admin@example.com');
  const [adminUsername, setAdminUsername] = useState('Admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);

  useEffect(() => {
    // Check current connection status when the page loads
    const checkConnection = async () => {
      try {
        const isConnected = await HealthAPI.checkServer();
        setServerStatus(isConnected);
        console.log("Server connection check result:", isConnected);
      } catch (error) {
        console.error("Error checking server connection:", error);
        setServerStatus(false);
      }
    };
    
    checkConnection();
  }, []);

  const handleSaveApiUrl = async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      console.log("Attempting to connect to:", apiUrl);
      // Try to connect to the new API URL
      await updateApiUrl(apiUrl);
      toast.success("Server connection successful! Settings saved.");
      setServerStatus(true);
      
      // Show a success message with additional diagnostic info
      const apiInfoResponse = await fetch(`${apiUrl}/api/health`, { method: 'GET' });
      if (apiInfoResponse.ok) {
        const apiInfo = await apiInfoResponse.json();
        setDiagnosticInfo(JSON.stringify(apiInfo, null, 2));
      }
      
      // Redirect to login page after a delay
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      console.error("Connection error:", error);
      setConnectionError(`Could not connect to the server at ${apiUrl}`);
      setServerStatus(false);
      toast.error(`Connection failed: ${error.message}`);
      
      // Run diagnostics
      runConnectionDiagnostics(apiUrl);
    } finally {
      setIsLoading(false);
    }
  };

  const runConnectionDiagnostics = async (url: string) => {
    try {
      // Parse the URL to get hostname
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      
      // Build diagnostic info
      let diagnostics = `Diagnostics for ${url}:\n`;
      diagnostics += `- Browser: ${navigator.userAgent}\n`;
      diagnostics += `- Current URL: ${window.location.href}\n`;
      diagnostics += `- Connecting to: ${hostname} on port ${parsedUrl.port || '80/443'}\n`;
      
      // Common issues
      if (hostname === 'localhost' && window.location.hostname !== 'localhost') {
        diagnostics += `\nPossible issue: You're trying to connect to 'localhost' from a remote browser.\n`;
        diagnostics += `'localhost' only works on the same computer as the server.\n`;
        diagnostics += `Try using the server's actual IP address instead.\n`;
      }
      
      if (hostname === '127.0.0.1' && window.location.hostname !== 'localhost') {
        diagnostics += `\nPossible issue: You're trying to connect to '127.0.0.1' from a remote browser.\n`;
        diagnostics += `'127.0.0.1' only works on the same computer as the server.\n`;
        diagnostics += `Try using the server's actual IP address instead.\n`;
      }
      
      // CORS issues
      diagnostics += `\nTrying to check for CORS issues...\n`;
      
      // Suggest possible solutions
      diagnostics += `\nPossible solutions:\n`;
      diagnostics += `1. Make sure the server is running (check service-output.log)\n`;
      diagnostics += `2. Check if the server is listening on the correct port (3001)\n`;
      diagnostics += `3. Verify the server is accepting connections from all network interfaces\n`;
      diagnostics += `4. Check if a firewall is blocking connections to port 3001\n`;
      diagnostics += `5. Run 'setup-once-forever.bat' as Administrator to fix common issues\n`;
      
      setDiagnosticInfo(diagnostics);
    } catch (error) {
      setDiagnosticInfo(`Error running diagnostics: ${error}`);
    }
  };

  // Fix URL if user entered incorrect format
  const handleFixUrl = () => {
    try {
      // Try to parse the URL
      let fixedUrl = apiUrl;
      
      // Add protocol if missing
      if (!fixedUrl.includes('://')) {
        fixedUrl = `http://${fixedUrl}`;
      }
      
      // Extract hostname/IP from URL
      try {
        const url = new URL(fixedUrl);
        // Make sure it only contains protocol + hostname + correct API port (3001)
        fixedUrl = `${url.protocol}//${url.hostname}:3001`;
      } catch {
        // If URL parsing fails, try to extract just hostname and add correct port
        const hostnameMatch = fixedUrl.match(/([^\/:\s]+)/);
        if (hostnameMatch && hostnameMatch[1]) {
          const hostname = hostnameMatch[1];
          fixedUrl = `http://${hostname}:3001`;
        }
      }
      
      setApiUrl(fixedUrl);
      toast.info("URL format corrected to API server format. Try connecting now.");
    } catch (e) {
      toast.error("Could not fix URL format automatically. Please check the URL format manually.");
    }
  };

  const createAdminUser = async () => {
    setCreatingAdmin(true);
    try {
      // Create admin user using the API
      await UserAPI.create({
        username: adminUsername,
        email: adminEmail,
        password: adminPassword,
        role: UserRole.ADMIN,
      });
      
      toast.success("Admin user created successfully! You can now log in.");
      setAdminCreated(true);
      
      // Redirect to login page after a short delay
      setTimeout(() => navigate("/login"), 1500);
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      toast.error(`Failed to create admin user: ${error.message}`);
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">License Manager Settings</h1>
        <p className="text-muted-foreground">
          Configure your connection to the license management server
        </p>
      </div>

      <Tabs defaultValue="connection">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connection">Server Connection</TabsTrigger>
          <TabsTrigger value="admin" disabled={!serverStatus}>Admin Setup</TabsTrigger>
        </TabsList>
      
        <TabsContent value="connection" className="mt-4">
          <Card className="border-2 border-amber-200">
            <CardHeader className="bg-amber-50">
              <CardTitle className="flex items-center gap-2">
                <span>⚠️</span>
                <span>Server Connection Required</span>
              </CardTitle>
              <CardDescription className="text-amber-800">
                Your application needs to connect to an API server running on port 3001.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {serverStatus === true && (
                <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
                  <AlertTitle className="text-green-700">Connected Successfully</AlertTitle>
                  <AlertDescription className="text-green-600">
                    Successfully connected to {sessionStorage.getItem('api_server_url') || API_URL}
                  </AlertDescription>
                </Alert>
              )}
              
              {serverStatus === false && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>
                    {connectionError || "Unable to connect to the server. Please ensure the API server is running."}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h3 className="font-medium text-blue-800">Quick Start Guide</h3>
                  <ol className="list-decimal ml-5 mt-2 text-sm text-blue-700 space-y-2">
                    <li>Make sure you've run <code className="bg-blue-100 px-1 py-0.5 rounded">START-ONE-CLICK.bat</code> on the iltela21 server</li>
                    <li>The server should be running on port 3001</li>
                    <li>If you're connecting from another computer, use the server's IP address instead of "localhost"</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiUrl">Server URL</Label>
                  <Input
                    id="apiUrl"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://iltela21:3001"
                  />
                  <p className="text-sm text-muted-foreground">
                    The URL should include the protocol (http://), server hostname or IP, and port 3001.
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-md border space-y-3">
                  <h3 className="font-medium">Connection Troubleshooting</h3>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Common Configurations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="justify-start text-left"
                        onClick={() => setApiUrl(`http://iltela21:3001`)}
                      >
                        iltela21: http://iltela21:3001
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-left" 
                        onClick={() => setApiUrl(`http://localhost:3001`)}
                      >
                        Local: http://localhost:3001
                      </Button>
                    </div>
                  </div>
                  
                  {diagnosticInfo && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Diagnostic Information</h4>
                      <div className="bg-gray-100 p-3 rounded-md text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {diagnosticInfo}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 bg-gray-50 border-t">
              <Button onClick={handleSaveApiUrl} disabled={isLoading}>
                {isLoading ? "Connecting..." : "Connect to Server"}
              </Button>
              <Button variant="outline" onClick={handleFixUrl} type="button">
                Fix URL Format
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="mt-4">
          {/* Admin User Creation Card - only shown when server is connected */}
          {serverStatus && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle>Create Admin Account</CardTitle>
                <CardDescription>
                  Set up an initial admin account to log into the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {adminCreated && (
                  <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
                    <AlertTitle className="text-green-700">Admin Created</AlertTitle>
                    <AlertDescription className="text-green-600">
                      Admin user has been created successfully. You can now log in.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Admin Username</Label>
                    <Input
                      id="adminUsername"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Admin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-blue-50 border-t">
                <Button
                  onClick={createAdminUser}
                  disabled={creatingAdmin || !adminEmail || !adminUsername || !adminPassword}
                  className="w-full"
                >
                  {creatingAdmin ? "Creating Admin..." : "Create Admin User"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
