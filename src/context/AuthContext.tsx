
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserRole } from "@/types";
import { toast } from "sonner";
import { fetchAPI, HealthAPI, UserAPI } from "@/services/api";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Function to check if token is valid and get current user
  const validateSession = async () => {
    const token = sessionStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Get the user id from sessionStorage
      const userId = sessionStorage.getItem("userId");
      if (!userId) {
        throw new Error("No user ID found");
      }
      
      // Fetch the current user data from API
      const user = await fetchAPI<User>(`/users/${userId}`);
      setCurrentUser(user);
    } catch (error) {
      console.error("Failed to validate session:", error);
      // Clear invalid session data
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("userId");
      toast.error("Your session has expired. Please log in again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing session
    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // First check if the server is available
      const serverAvailable = await HealthAPI.checkServer();
      if (!serverAvailable) {
        throw new Error("Server connection failed. Please check your server settings.");
      }
      
      // Get all users from the API - in a real app you would have a /login endpoint
      const users = await UserAPI.getAll();
      
      // Find user with matching credentials
      const user = users.find(u => u.email === email);
      
      // In a real-world app, password verification would happen securely on the server
      if (!user) {
        throw new Error("Invalid email or password");
      }

      // In a production environment, this would be a proper password verification
      // against a securely hashed password stored in the database
      // For now, we're still using a simpler verification for the demo
      // but removing the "123" requirement
      
      // Get the user's password from the database (in a real app, this would be hashed)
      const userFromDb = await fetchAPI<any>(`/users/${user.id}`);
      
      if (!userFromDb || userFromDb.password !== password) {
        throw new Error("Invalid email or password");
      }
      
      // Store authentication info in sessionStorage
      sessionStorage.setItem("authToken", "secure-token"); // In a real app, this would be a JWT
      sessionStorage.setItem("userId", user.id);
      
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate("/dashboard");
    } catch (error: any) {
      // Provide more helpful error messages for different failure scenarios
      if (error.message.includes("Failed to fetch") || error.message.includes("Server connection failed")) {
        toast.error("Unable to connect to the server. Please check your server settings in the Settings page.");
        // Navigate to settings page to help user fix the connection
        navigate("/settings");
      } else {
        toast.error(error.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userId");
    setCurrentUser(null);
    toast.info("You have been logged out");
    navigate("/login");
  };

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoading, 
      login, 
      logout, 
      isAuthenticated, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
