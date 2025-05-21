
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HealthAPI } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const checkServerAndRedirect = async () => {
      try {
        // Check if the server is available before redirecting
        const serverAvailable = await HealthAPI.checkServer();
        
        if (!serverAvailable) {
          setServerError(`Unable to connect to the License Manager API server. Please verify that the server is running on port 3001.`);
          // We'll show an error message instead of automatically redirecting
        } else {
          // If we have a valid session token, go to dashboard, otherwise to login
          const hasToken = !!sessionStorage.getItem("authToken");
          navigate(hasToken ? "/dashboard" : "/login");
        }
      } catch (error) {
        console.error("Server check failed:", error);
        setServerError(`Unable to connect to the License Manager API server. Please verify that the server is running on port 3001.`);
      } finally {
        setIsCheckingServer(false);
      }
    };

    checkServerAndRedirect();
  }, [navigate]);

  if (serverError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
        <div className="text-muted-foreground mb-4 text-center max-w-md">
          <p className="mb-2">Make sure the API server is running on port 3001.</p>
          <p className="mb-2">If you've just installed the service, you may need to build the frontend:</p>
          <ol className="text-left list-decimal pl-5 mb-3">
            <li>Navigate to the server directory</li>
            <li>Run <code className="bg-muted px-1 rounded">build-frontend.bat</code></li>
            <li>Restart the License Manager service</li>
          </ol>
        </div>
        <Button asChild>
          <Link to="/login">Try Again</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">
          {isCheckingServer ? "Checking server connection..." : "Redirecting..."}
        </span>
      </div>
    </div>
  );
};

export default Index;
