
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, UserRole } from "@/types";
import { toast } from "sonner";
import { fetchAPI } from "@/services/api";
import { API_URL } from "@/services/api/base";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Function to ensure admin user exists using public endpoint
  const ensureAdminUser = async () => {
    try {
      console.log("🔧 [AUTH] Checking setup status...");
      
      // Use public setup endpoint that doesn't require authentication
      const response = await fetch(`${API_URL}/api/setup/check`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Setup check failed: ${response.status}`);
      }
      
      const setupData = await response.json();
      console.log("🔧 [AUTH] Setup response:", setupData);
      
      if (setupData.adminCreated) {
        console.log("🔧 [AUTH] Default admin user created successfully");
        toast.info("Default admin user created. Use admin@example.com / admin123 to login.");
      } else if (setupData.userCount > 0) {
        console.log("🔧 [AUTH] Users already exist, setup not needed");
      }
    } catch (error) {
      console.error("🔧 [AUTH] Error in setup check:", error);
      // Don't show error to user as this is background operation
    }
  };

  useEffect(() => {
    // Only validate session if we're not on the login page or index page
    const publicRoutes = ['/login', '/', '/settings'];
    const currentPath = location.pathname;
    
    if (!publicRoutes.includes(currentPath)) {
      validateSession();
    } else {
      // On public routes, just check if we have stored auth data without calling the server
      const token = sessionStorage.getItem("authToken");
      const userId = sessionStorage.getItem("userId");
      
      if (token && userId && currentPath !== '/login') {
        // If we have auth data and we're not on login, validate the session
        validateSession();
      } else {
        setIsLoading(false);
        // Try to ensure admin user exists when on login page
        if (currentPath === '/login') {
          ensureAdminUser();
        }
      }
    }
  }, [location.pathname]);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("🔐 [CLIENT] Starting login process...");
      console.log("🔐 [CLIENT] Username/Email:", usernameOrEmail);
      console.log("🔐 [CLIENT] API_URL:", API_URL);
      
      // First test if the server is available
      console.log("🔐 [CLIENT] Testing server health...");
      try {
        const healthResponse = await fetch(`${API_URL}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (!healthResponse.ok) {
          throw new Error("Server health check failed");
        }
        console.log("🔐 [CLIENT] Server health check passed ✅");
      } catch (error) {
        console.error("🔐 [CLIENT] Server health check failed:", error);
        throw new Error("Unable to connect to the server. Please check if the server is running and accessible.");
      }
      
      // Try the dedicated login endpoint
      console.log("🔐 [CLIENT] Attempting login via /api/auth/login endpoint...");
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      
      console.log("🔐 [CLIENT] Login endpoint response status:", loginResponse.status);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log("🔐 [CLIENT] Login successful ✅");
        console.log("🔐 [CLIENT] User data received:", { 
          id: loginData.user.id, 
          username: loginData.user.username, 
          email: loginData.user.email 
        });
        
        // Store authentication info in sessionStorage
        sessionStorage.setItem("authToken", loginData.token || "secure-token");
        sessionStorage.setItem("userId", loginData.user.id);
        
        setCurrentUser({
          ...loginData.user,
          createdAt: new Date(loginData.user.createdAt)
        });
        toast.success(`Welcome back, ${loginData.user.username}!`);
        navigate("/dashboard");
        return;
      } else {
        const errorData = await loginResponse.json();
        console.error("🔐 [CLIENT] Login endpoint error:", errorData);
        
        // If login fails with invalid credentials, try to ensure admin user exists
        if (errorData.error === 'Invalid credentials') {
          console.log("🔐 [CLIENT] Login failed, trying setup check...");
          await ensureAdminUser();
          throw new Error("Invalid credentials. If this is a new installation, try admin@example.com / admin123");
        }
        
        throw new Error(errorData.error || "Login failed");
      }
      
    } catch (error: any) {
      // Handle login errors
      console.error("🔐 [CLIENT] Login error:", error);
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
