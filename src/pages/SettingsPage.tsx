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
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";

// Get the server's IP address (to display as hint)
const getLocalIpAddress = () => {
  // This will be replaced with the appropriate local IP at runtime
  return window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
};

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
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
      
      // Redirect to login page
      setTimeout(() => navigate("/login"), 1000);
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connection Settings</h1>
        <p className="text-muted-foreground">
          Connect to your license management server
        </p>
      </div>

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
              <AlertTitle className="text-green-700">Connected</AlertTitle>
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
              <h3 className="font-medium text-blue-800">Server Not Running?</h3>
              <ol className="list-decimal ml-5 mt-2 text-sm text-blue-700 space-y-2">
                <li>Make sure your API server is running with: <code className="bg-blue-100 px-1 py-0.5 rounded">cd server && node server.js</code></li>
                <li>Check that the server is running on port 3001</li>
                <li><strong>Important:</strong> To build the frontend, run: <code className="bg-blue-100 px-1 py-0.5 rounded">cd /path/to/project/root && npm run build</code> or <code className="bg-blue-100 px-1 py-0.5 rounded">yarn build</code> from the <strong>main project directory (NOT from the server directory)</strong></li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <h3 className="font-medium text-amber-800">Build Error?</h3>
              <p className="text-sm text-amber-700 mt-2">If you're seeing a "Missing script: build" error, you might be in the wrong directory. The build command must be run from the main project directory, not from the server directory.</p>
              <div className="mt-2 bg-amber-100 p-2 rounded-md text-sm font-mono">
                <p>❌ Running from server directory: <span className="text-red-600">cd server && npm run build</span></p>
                <p>✅ Correct way: <span className="text-green-600">cd .. && npm run build</span> (or go to the root project folder)</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiUrl">Server URL</Label>
              <Input
                id="apiUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://server-ip:3001"
              />
              <p className="text-sm text-muted-foreground">
                The URL should include the protocol (http://), server hostname or IP, and port 3001.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-md border space-y-3">
              <h3 className="font-medium">Connection Troubleshooting</h3>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Common Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start text-left" 
                    onClick={() => setApiUrl(`http://localhost:3001`)}
                  >
                    Local Development: http://localhost:3001
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start text-left"
                    onClick={() => setApiUrl(`http://${window.location.hostname}:3001`)}
                  >
                    Current Host: http://{window.location.hostname}:3001
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Checklist</h4>
                <ul className="text-sm space-y-1 list-disc pl-5">
                  <li>Server is running on port 3001</li>
                  <li>No firewall blocking the connection</li>
                  <li>Correct server IP or hostname</li>
                  <li>Server and client on same network (if applicable)</li>
                  <li>Frontend is built from the main project directory (not server directory)</li>
                </ul>
              </div>
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
    </div>
  );
};

export default SettingsPage;
