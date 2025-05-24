
// API Configuration
export let API_URL = 'http://localhost:3001';

// Update API URL for local Docker setup
export const updateApiUrl = (newUrl: string) => {
  API_URL = newUrl;
  // Store in session storage for persistence
  sessionStorage.setItem('api_server_url', newUrl);
  console.log('API URL updated to:', newUrl);
};

// Initialize API URL from session storage if available
const storedUrl = sessionStorage.getItem('api_server_url');
if (storedUrl) {
  API_URL = storedUrl;
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
