
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, UserRole } from "@/types";
import { toast } from "sonner";
import { fetchAPI } from "@/services/api";
import { API_URL } from "@/services/api/base";

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
      console.log("Attempting login with email:", email);
      
      // In a production app, we would use a dedicated login endpoint.
      // For this app, we'll need to first get the user by email
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      
      const users = await response.json();
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        console.error("No user found with email:", email);
        throw new Error("Invalid email or password");
      }
      
      // Get the user's full details including password
      const userDetailsResponse = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!userDetailsResponse.ok) {
        throw new Error("Failed to fetch user details");
      }
      
      const userDetails = await userDetailsResponse.json();
      
      // Compare passwords (in a real app, this would be done securely on the server)
      if (userDetails.password !== password) {
        console.error("Password mismatch for user:", email);
        throw new Error("Invalid email or password");
      }
      
      // Store authentication info in sessionStorage
      sessionStorage.setItem("authToken", "secure-token"); // In a real app, this would be a JWT
      sessionStorage.setItem("userId", user.id);
      
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.username}!`);
      navigate("/dashboard");
    } catch (error: any) {
      // Handle login errors
      console.error("Login error:", error);
      throw error; // Let the component handle displaying the error
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
