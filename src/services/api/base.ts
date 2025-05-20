
// Base API utilities for making requests and managing server connections

// Get the API server URL - will use localhost by default but can be changed
const getApiUrl = () => {
  // Check if a custom server URL has been set in sessionStorage
  const customApiUrl = sessionStorage.getItem('api_server_url');
  if (customApiUrl) {
    return customApiUrl;
  }
  // Default to localhost if no custom URL is set
  return 'http://localhost:3001';
};

// The base URL for your API server
export let API_URL = getApiUrl();

// Function to update the API URL
export const updateApiUrl = async (newUrl: string) => {
  // Ensure URL has correct format
  if (!newUrl.includes('://')) {
    newUrl = `http://${newUrl}`;
  }
  
  // Remove trailing slash if exists
  newUrl = newUrl.endsWith('/') ? newUrl.slice(0, -1) : newUrl;
  
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
      signal: AbortSignal.timeout(5000) // Increase timeout to 5 seconds
    });
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

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
