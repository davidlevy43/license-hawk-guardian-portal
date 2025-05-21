
// Base API utilities for making requests and managing server connections

// Get the API server URL - more flexible approach for local networks
const getApiUrl = () => {
  // Check if a custom server URL has been set in sessionStorage
  const customApiUrl = sessionStorage.getItem('api_server_url');
  if (customApiUrl) {
    console.log("Using custom API URL from sessionStorage:", customApiUrl);
    return customApiUrl;
  }
  
  // In Lovable preview environment, we need to use the same origin
  if (window.location.hostname.includes('lovableproject.com')) {
    const fallbackUrl = window.location.origin;
    console.log("Using fallback URL for Lovable environment:", fallbackUrl);
    return fallbackUrl;
  }
  
  // Default to current hostname with port 3001
  // This works better with local network configurations
  const currentHost = window.location.hostname;
  const defaultUrl = `http://${currentHost}:3001`;
  console.log("Using default API URL:", defaultUrl);
  return defaultUrl;
};

// The base URL for your API server
export let API_URL = getApiUrl();

// Function to update the API URL
export const updateApiUrl = async (newUrl: string) => {
  console.log("Updating API URL to:", newUrl);
  
  // Ensure URL has correct format
  if (!newUrl.includes('://')) {
    newUrl = `http://${newUrl}`;
  }
  
  // Remove trailing slash if exists
  newUrl = newUrl.endsWith('/') ? newUrl.slice(0, -1) : newUrl;
  
  // Remove /api, /login or other paths from the URL if they exist
  try {
    const urlObj = new URL(newUrl);
    newUrl = `${urlObj.protocol}//${urlObj.host}`;
  } catch (error) {
    console.error("Invalid URL format:", error);
    throw new Error("Invalid URL format. Please enter a valid URL.");
  }
  
  // Store the URL for display purposes
  sessionStorage.setItem('api_server_url', newUrl);
  API_URL = newUrl;
  
  console.log(`Testing connection to ${API_URL}/health`);
  
  // Check if server is available
  const isAvailable = await checkServerAvailability();
  if (!isAvailable) {
    throw new Error("Could not connect to the server at " + newUrl);
  }
  
  return true;
};

// Check if server is running - more robust with longer timeout
export async function checkServerAvailability() {
  try {
    const healthEndpoint = `${API_URL}/health`;
    console.log(`Checking server availability at ${healthEndpoint}`);
    
    const response = await fetch(healthEndpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000) // 10 second timeout for slower networks
    });
    
    console.log("Server response status:", response.status);
    return response.ok;
  } catch (error) {
    console.error('Server not available:', error);
    return false;
  }
}

// Force real API mode - this is now the only mode
export const forceRealApiMode = async () => {
  const serverAvailable = await checkServerAvailability();
  if (!serverAvailable) {
    throw new Error('Server not available. Please make sure your server is running on ' + API_URL);
  }
  console.log('Successfully connected to server.');
  return serverAvailable;
};

// Base fetchAPI function for making API requests - with improved error handling
export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    // Fix the URL construction to avoid double "/api" in the path
    let fullUrl;
    if (endpoint.startsWith('/api/')) {
      // If endpoint already contains /api/, don't add it again
      fullUrl = `${API_URL}${endpoint}`;
    } else if (endpoint.startsWith('/')) {
      fullUrl = `${API_URL}/api${endpoint}`;
    } else {
      fullUrl = `${API_URL}/api/${endpoint}`;
    }
      
    console.log(`Making ${options.method || 'GET'} request to ${fullUrl}`);
    
    // For Lovable preview environment, we need to use mock data
    if (window.location.hostname.includes('lovableproject.com')) {
      console.log("Using mock data in preview environment");
      return getMockData(endpoint) as T;
    }
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Check if we received HTML instead of JSON (likely a web server error page)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(`Server returned HTML instead of JSON. The server at ${API_URL} may not be an API server.`);
      }
      
      // Try to parse the error response
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Request failed with status ${response.status}`;
      } catch (e) {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    // For DELETE requests that return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Check if we received HTML instead of JSON (can happen with some error responses)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error(`Server returned HTML instead of JSON. The server at ${API_URL} may not be an API server.`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// For Lovable preview environment, we need to use mock data
function getMockData(endpoint: string) {
  // Default admin user for login
  const defaultAdmin = {
    id: 'admin-id',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  
  // Default second admin user
  const secondAdmin = {
    id: 'david-id',
    username: 'david',
    email: 'david@rotem.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  };

  // Simple mock data for various endpoints
  if (endpoint.includes('/users')) {
    if (endpoint === '/users') {
      return [defaultAdmin, secondAdmin];
    }
    
    if (endpoint.includes('admin-id')) {
      return defaultAdmin;
    }
    
    if (endpoint.includes('david-id')) {
      return secondAdmin;
    }
    
    return defaultAdmin;
  }
  
  if (endpoint.includes('/licenses')) {
    return [];
  }
  
  // Default mock data
  return { status: 'ok', message: 'Mock data response' };
}
