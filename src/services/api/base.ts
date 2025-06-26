
// API Configuration
export let API_URL = 'http://localhost:3001';

// Get the current host IP for network connections
const getCurrentHostIP = () => {
  const hostname = window.location.hostname;
  
  // If we're on localhost, try to detect network IP
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // For local development, default to localhost
    return 'localhost';
  }
  
  // Use the current hostname (could be an IP address)
  return hostname;
};

// Update API URL for network setup
export const updateApiUrl = (newUrl: string) => {
  API_URL = newUrl;
  // Store in session storage for persistence
  sessionStorage.setItem('api_server_url', newUrl);
  console.log('API URL updated to:', newUrl);
};

// Initialize API URL from session storage or auto-detect
const storedUrl = sessionStorage.getItem('api_server_url');
if (storedUrl) {
  API_URL = storedUrl;
  console.log('Using stored API URL:', API_URL);
} else {
  // Auto-detect based on current hostname
  const currentHost = getCurrentHostIP();
  API_URL = `http://${currentHost}:3001`;
  console.log('Auto-detected API URL:', API_URL);
}

// Helper function to make API requests
export const fetchAPI = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_URL}/api${endpoint}`;
  
  console.log(`Making ${options.method || 'GET'} request to ${url}`);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = sessionStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('Adding auth token to request:', token.substring(0, 10) + '...');
  } else {
    console.log('No auth token found in sessionStorage');
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If we can't parse the error response, use the default message
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
