
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserRole } from "@/types";
import { toast } from "sonner";
import { fetchAPI } from "@/services/api";

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
      // Get all users from the API - in a real app you would have a /login endpoint
      const users = await fetchAPI<User[]>('/users');
      
      // Find user with matching credentials
      const user = users.find(u => u.email === email);
      
      // In a real-world app, password verification would happen on the server
      // For this demo, we're checking if a user with the email exists and using a simple password check
      if (!user || (email !== "admin@example.com" && email !== "user@example.com")) {
        throw new Error("Invalid email or password");
      }
      
      // Store authentication info in sessionStorage instead of localStorage
      sessionStorage.setItem("authToken", "demo-token"); // In a real app, this would be a JWT
      sessionStorage.setItem("userId", user.id);
      
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
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
