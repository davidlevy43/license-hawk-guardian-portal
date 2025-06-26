
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Wifi, WifiOff, Settings, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/services/api/base";

const formSchema = z.object({
  email: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [diagnosticInfo, setDiagnosticInfo] = useState<string>('');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@example.com",
      password: "admin123",
    },
  });

  // Check server connection on page load
  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    console.log("🔍 Checking server connection to:", API_URL);
    setConnectionStatus('checking');
    setDiagnosticInfo('');
    
    try {
      // Test basic connectivity - use /health endpoint (not /api/health)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const healthData = await response.json();
        console.log("✅ Server connection successful:", healthData);
        setConnectionStatus('connected');
        setDiagnosticInfo(`Connected to: ${API_URL}\nServer: ${healthData.service}\nStatus: ${healthData.status}`);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("❌ Server connection failed:", error);
      setConnectionStatus('failed');
      
      let diagnostic = `Connection failed to: ${API_URL}\n`;
      diagnostic += `Error: ${error.message}\n`;
      diagnostic += `Current hostname: ${window.location.hostname}\n`;
      diagnostic += `Current protocol: ${window.location.protocol}\n`;
      
      if (error.name === 'AbortError') {
        diagnostic += `Issue: Connection timeout (5 seconds)\n`;
        diagnostic += `Possible causes:\n`;
        diagnostic += `- Server is not running\n`;
        diagnostic += `- Port 3001 is blocked\n`;
        diagnostic += `- Network connectivity issues\n`;
      } else if (error.message.includes('Failed to fetch')) {
        diagnostic += `Issue: Network request failed\n`;
        diagnostic += `Possible causes:\n`;
        diagnostic += `- CORS policy blocking request\n`;
        diagnostic += `- Server not accessible from this location\n`;
        diagnostic += `- Firewall blocking connection\n`;
      }
      
      setDiagnosticInfo(diagnostic);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    
    // Check connection first if it failed
    if (connectionStatus === 'failed') {
      setApiError("Cannot login - server connection failed. Please check server status below.");
      return;
    }
    
    try {
      await login(data.email, data.password);
      // The redirect is handled in the login function
    } catch (error: any) {
      if (error.message.includes("Failed to fetch") || error.message.includes("Server connection failed")) {
        setApiError("Unable to connect to the server. Please ensure the API server is running.");
        setConnectionStatus('failed');
        checkServerConnection(); // Refresh diagnostics
      } else {
        setApiError(error.message || "Login failed");
      }
    }
  };

  const fillDefaultCredentials = () => {
    form.setValue('email', 'admin@example.com');
    form.setValue('password', 'admin123');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <div className="text-lg font-bold text-white">LM</div>
          </div>
          <h1 className="text-2xl font-bold">License Manager</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {/* Default Credentials Info */}
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <div className="space-y-2">
              <p className="font-semibold">Default Login Credentials:</p>
              <p><strong>Email:</strong> admin@example.com</p>
              <p><strong>Password:</strong> admin123</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fillDefaultCredentials}
                className="mt-2"
              >
                Use Default Credentials
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Server Connection Status */}
        <div className="mb-4">
          {connectionStatus === 'checking' && (
            <Alert className="border-blue-200 bg-blue-50">
              <Wifi className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                Checking server connection...
              </AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'connected' && (
            <Alert className="border-green-200 bg-green-50">
              <Wifi className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Server connected successfully
              </AlertDescription>
            </Alert>
          )}
          
          {connectionStatus === 'failed' && (
            <Alert variant="destructive" className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Server Connection Failed</p>
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-red-100 p-2 rounded">
                    {diagnosticInfo}
                  </pre>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={checkServerConnection}
                    >
                      Retry Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                    >
                      <Link to="/settings">
                        <Settings className="h-3 w-3 mr-1" />
                        Server Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {apiError}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or Email</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter your username or email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormMessage>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || connectionStatus === 'failed'}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                      Signing in...
                    </span>
                  ) : connectionStatus === 'failed' ? (
                    "Server Unavailable"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Need help? <Link to="/settings" className="text-primary hover:underline">Configure server settings</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
