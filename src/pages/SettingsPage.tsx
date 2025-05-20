
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
import { HealthAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

// Get the server's IP address (to display as hint)
const getLocalIpAddress = () => {
  // This will be replaced with the appropriate local IP at runtime
  return window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
};

const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [apiUrl, setApiUrl] = useState(() => sessionStorage.getItem('api_server_url') || `http://${getLocalIpAddress()}:3001`);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);

  useEffect(() => {
    // Check current connection status when the page loads
    const checkConnection = async () => {
      try {
        const isConnected = await HealthAPI.checkServer();
        setServerStatus(isConnected);
      } catch (error) {
        setServerStatus(false);
      }
    };
    
    checkConnection();
  }, []);

  const handleSaveApiUrl = async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      // Try to connect to the new API URL
      await updateApiUrl(apiUrl);
      toast.success("Server connection successful! Settings saved.");
      setServerStatus(true);
      
      // Refresh the page to apply new API settings
      setTimeout(() => window.location.href = "/", 1000);
    } catch (error: any) {
      setConnectionError(`Could not connect to the server at ${apiUrl}`);
      setServerStatus(false);
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fix URL if user entered incorrect format
  const handleFixUrl = () => {
    // Extract hostname/IP from the current URL
    try {
      const url = new URL(apiUrl);
      // Ensure it has the correct format with protocol and port
      const fixedUrl = `http://${url.hostname}:3001`;
      setApiUrl(fixedUrl);
      toast.info("URL format corrected. Try connecting now.");
    } catch (e) {
      // If the URL is not valid, try to extract just the hostname part
      const hostnameMatch = apiUrl.match(/([^\/:\s]+)/);
      if (hostnameMatch && hostnameMatch[1]) {
        const hostname = hostnameMatch[1];
        setApiUrl(`http://${hostname}:3001`);
        toast.info("URL format corrected. Try connecting now.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your application settings
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Server Configuration</CardTitle>
          <CardDescription>
            Configure the server URL to connect this client to your license management server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serverStatus === true && (
            <Alert variant="default" className="bg-green-50 border-green-200 mb-4">
              <AlertTitle className="text-green-700">Connected</AlertTitle>
              <AlertDescription className="text-green-600">
                Currently connected to {sessionStorage.getItem('api_server_url') || API_URL}
              </AlertDescription>
            </Alert>
          )}
          
          {serverStatus === false && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                {connectionError || "Not connected to any server. Please enter a valid server URL."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="apiUrl">
              Server URL
            </label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://server-ip:3001"
            />
            <p className="text-sm text-muted-foreground">
              Example: http://192.168.1.100:3001
            </p>
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mt-4">
              <p className="text-sm font-medium text-amber-800">
                <strong>Important:</strong> All clients must connect to the same server to see the same data. 
                Use your server's network IP address (not localhost) so other computers can connect.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                The server port (3001) must match the port where your API server is running.
                This is separate from the web application port (which might be 8080 or another port).
              </p>
              <div className="mt-2 p-2 bg-amber-100 rounded border border-amber-300">
                <p className="text-xs font-medium text-amber-800">
                  Troubleshooting:
                </p>
                <ul className="text-xs text-amber-700 list-disc pl-4 mt-1">
                  <li>If you entered a server name (like "iltela21"), make sure it's in the format: http://iltela21:3001</li>
                  <li>The port number (3001) must be included and match your server configuration</li>
                  <li>Make sure your server is running and accessible from this device</li>
                  <li>Check network firewall settings if you can't connect to the server</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={handleSaveApiUrl} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Save and Connect"}
          </Button>
          <Button variant="outline" onClick={handleFixUrl} type="button">
            Fix URL Format
          </Button>
        </CardFooter>
      </Card>

      {isAdmin && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Configure email notification settings for license renewals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Email notification settings can be configured by an administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
