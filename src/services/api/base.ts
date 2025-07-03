
// API Configuration - detect if we're using nginx proxy or direct connection
export let API_URL = '';

// Get the current host and determine API URL
const determineApiUrl = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  // If accessing through nginx (no port or port 80), use nginx proxy
  if (!port || port === '80') {
    return `${protocol}//${hostname}`;
  }
  
  // For direct development access, use port 3001
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // For direct server access, use iltelpc71:3001
  return 'http://iltelpc71:3001';
};

// Update API URL for manual configuration
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
  API_URL = determineApiUrl();
  console.log('Auto-detected API URL:', API_URL);
}

// Helper function to make API requests
export const fetchAPI = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_URL}/api${endpoint}`;
  
  console.log(`🌐 [API] Making ${options.method || 'GET'} request to ${url}`);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available - with extensive debugging
  const token = sessionStorage.getItem('authToken');
  console.log(`🌐 [API] Checking for auth token...`);
  console.log(`🌐 [API] Token exists:`, !!token);
  console.log(`🌐 [API] Raw token value (first 30 chars):`, token ? token.substring(0, 30) + '...' : 'null');
  console.log(`🌐 [API] sessionStorage keys:`, Object.keys(sessionStorage));
  
  if (token) {
    const authHeader = `Bearer ${token}`;
    defaultHeaders['Authorization'] = authHeader;
    console.log('🌐 [API] Adding auth token to request');
    console.log('🌐 [API] Authorization header set to:', authHeader.substring(0, 30) + '...');
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

  console.log('🌐 [API] Final request config:', {
    url,
    method: config.method || 'GET',
    hasAuth: !!defaultHeaders['Authorization'],
    headers: JSON.stringify(config.headers, null, 2)
  });

  try {
    const response = await fetch(url, config);
    
    console.log(`🌐 [API] Response status: ${response.status} for ${url}`);
    console.log(`🌐 [API] Response headers:`, Object.fromEntries(response.headers.entries()));
    
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
      
      // Log specific error cases
      if (response.status === 401) {
        console.error(`🌐 [API] 401 Unauthorized - Token issue detected`);
        console.error(`🌐 [API] Current token:`, token ? token.substring(0, 20) + '...' : 'none');
        console.error(`🌐 [API] Auth header sent:`, defaultHeaders['Authorization'] ? 'yes' : 'no');
      } else if (response.status === 404) {
        console.error(`🌐 [API] 404 Not Found - Resource doesn't exist`);
        console.error(`🌐 [API] Endpoint:`, endpoint);
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
    console.error('🌐 [API] Error details:', {
      message: error.message,
      url,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
    });
    throw error;
  }
};
