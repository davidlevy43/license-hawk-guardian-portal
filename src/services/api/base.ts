
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
  
  console.log(`🌐 [API] Making ${options.method || 'GET'} request to ${url}`);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = sessionStorage.getItem('authToken');
  console.log(`🌐 [API] Checking for auth token...`);
  console.log(`🌐 [API] Token exists:`, !!token);
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('🌐 [API] Adding auth token to request:', token.substring(0, 10) + '...');
    console.log('🌐 [API] Full Authorization header:', `Bearer ${token.substring(0, 20)}...`);
  } else {
    console.log('🌐 [API] No auth token found in sessionStorage');
    // Let's also check what's actually in sessionStorage
    console.log('🌐 [API] SessionStorage contents:', {
      authToken: sessionStorage.getItem('authToken'),
      userId: sessionStorage.getItem('userId'),
      keys: Object.keys(sessionStorage)
    });
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  console.log('🌐 [API] Request config:', {
    url,
    method: config.method || 'GET',
    hasAuth: !!defaultHeaders['Authorization'],
    headers: config.headers
  });

  try {
    const response = await fetch(url, config);
    
    console.log(`🌐 [API] Response status: ${response.status} for ${url}`);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error(`🌐 [API] Error response data:`, errorData);
      } catch {
        // If we can't parse the error response, use the default message
        console.error(`🌐 [API] Could not parse error response`);
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      console.log(`🌐 [API] No content response (204)`);
      return {} as T;
    }

    const data = await response.json();
    console.log(`🌐 [API] Success response for ${url}:`, data);
    return data;
  } catch (error) {
    console.error('🌐 [API] Request failed:', error);
    throw error;
  }
};
