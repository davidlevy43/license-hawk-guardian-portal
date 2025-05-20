
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserRole } from "@/types";
import { toast } from "sonner";
import { fetchAPI, HealthAPI } from "@/services/api";

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
      const users = await fetchAPI<User[]>('/users');
      
      // Find user with matching credentials
      const user = users.find(u => u.email === email);
      
      // In a real-world app, password verification would happen on the server
      // For this demo, we're simulating basic authentication
      if (!user || !validatePassword(email, password)) {
        throw new Error("Invalid email or password");
      }
      
      // Store authentication info in sessionStorage instead of localStorage
      sessionStorage.setItem("authToken", "demo-token"); // In a real app, this would be a JWT
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

  // Simple password validation function
  const validatePassword = (email: string, password: string) => {
    // For the demo, we'll use basic validation
    // In a real app, this would be handled securely on the server
    
    // Special case for the two demo accounts
    if (email === "admin@example.com" && password === "admin123") return true;
    if (email === "user@example.com" && password === "user123") return true;
    
    // For any other user, check if password contains "123" for this demo
    // In production, we'd compare with a properly hashed password from the DB
    return password.includes("123");
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
