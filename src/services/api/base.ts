
// Base API utilities for making requests and managing server connections

// Get the API server URL - will now use current hostname by default
const getApiUrl = () => {
  // Check if a custom server URL has been set in sessionStorage
  const customApiUrl = sessionStorage.getItem('api_server_url');
  if (customApiUrl) {
    console.log("Using custom API URL from sessionStorage:", customApiUrl);
    return customApiUrl;
  }
  
  // Use the current hostname with port 3001 for the API
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
  
  console.log(`Testing connection to ${API_URL}/api/health`);
  
  // Check if server is available
  const isAvailable = await checkServerAvailability();
  if (!isAvailable) {
    throw new Error("Could not connect to the server at " + newUrl);
  }
  
  return true;
};

// Check if server is running
export async function checkServerAvailability() {
  try {
    console.log(`Checking server availability at ${API_URL}/api/health`);
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000) // Increase timeout to 8 seconds
    });
    
    console.log("Server response status:", response.status);
    
    // Check if response is valid JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.ok;
    } else {
      console.error('Server returned non-JSON response:', contentType);
      return false;
    }
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

// Base fetchAPI function for making API requests
export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const fullUrl = endpoint.startsWith('/') 
      ? `${API_URL}/api${endpoint}`
      : `${API_URL}/api/${endpoint}`;
      
    console.log(`Making ${options.method || 'GET'} request to ${fullUrl}`);
    
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
