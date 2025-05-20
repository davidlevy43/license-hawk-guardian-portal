
import React, { useState } from "react";
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
import { toast } from "sonner";
import { updateApiUrl, forceRealApiMode } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

// Get the server's IP address (to display as hint)
const getLocalIpAddress = () => {
  // This will be replaced with the appropriate local IP at runtime
  return window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
};

const SettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('api_server_url') || `http://${getLocalIpAddress()}:3001`);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveApiUrl = async () => {
    setIsLoading(true);
    try {
      // Try to connect to the new API URL
      const success = await updateApiUrl(apiUrl);
      if (success) {
        toast.success("Server connection successful! Settings saved.");
      } else {
        toast.error("Could not connect to the server. Using mock data instead.");
      }
    } catch (error: any) {
      toast.error(`Failed to connect: ${error.message}`);
    } finally {
      setIsLoading(false);
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
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveApiUrl} disabled={isLoading}>
            {isLoading ? "Connecting..." : "Save and Connect"}
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
