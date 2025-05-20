
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HealthAPI } from "@/services/api";
import { toast } from "sonner";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [isCheckingServer, setIsCheckingServer] = useState(true);

  useEffect(() => {
    const checkServerAndRedirect = async () => {
      try {
        // Check if the server is available before redirecting
        const serverAvailable = await HealthAPI.checkServer();
        
        if (!serverAvailable) {
          toast.error("Unable to connect to server. Please check your server settings.");
          navigate("/settings");
        } else {
          // If we have a valid session token, go to dashboard, otherwise to login
          const hasToken = !!sessionStorage.getItem("authToken");
          navigate(hasToken ? "/dashboard" : "/login");
        }
      } catch (error) {
        console.error("Server check failed:", error);
        toast.error("Unable to connect to server. Please check your server settings.");
        navigate("/settings");
      } finally {
        setIsCheckingServer(false);
      }
    };

    checkServerAndRedirect();
  }, [navigate]);

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
