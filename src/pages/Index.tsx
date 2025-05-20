
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/dashboard");
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg">Redirecting to dashboard...</span>
      </div>
    </div>
  );
};

export default Index;
