import { License, User, UserRole } from '@/types';

// The base URL for your API server
// In a production environment, this would be your actual server URL
const API_URL = 'http://localhost:3001/api';

// Mock data for when API is not available
const MOCK_USERS: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: UserRole.ADMIN,
    createdAt: new Date()
  },
  {
    id: "2",
    username: "user",
    email: "user@example.com",
    role: UserRole.USER,
    createdAt: new Date()
  },
  {
    id: "3",
    username: "manager",
    email: "manager@example.com",
    role: UserRole.USER,
    createdAt: new Date()
  }
];

// Will be set to true if we detect we can't connect to the real API
let useMockData = false;

// Generic request handler with error management and fallback to mock data
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (useMockData) {
    return mockAPIResponse<T>(endpoint, options);
  }

  try {
    console.log(`Making ${options.method || 'GET'} request to ${API_URL}${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    // For DELETE requests that return 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    
    // If this is our first error, switch to mock data
    if (!useMockData) {
      console.log('Switching to mock data mode');
      useMockData = true;
      return mockAPIResponse<T>(endpoint, options);
    }
    
    throw error;
  }
}

// Handle mock API responses based on endpoint and method
async function mockAPIResponse<T>(endpoint: string, options: RequestInit): Promise<T> {
  console.log(`Using mock data for ${options.method || 'GET'} request to ${endpoint}`);
  
  // Add a small delay to simulate network
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (endpoint.startsWith('/users')) {
    // Handle users endpoints
    if (endpoint === '/users') {
      if (options.method === 'POST') {
        // Create user
        const data = JSON.parse(options.body as string);
        const newUser: User = {
          id: `mock-${Date.now()}`,
          username: data.username,
          email: data.email,
          role: data.role,
          createdAt: new Date()
        };
        MOCK_USERS.push(newUser);
        return newUser as unknown as T;
      }
      // List users
      return MOCK_USERS as unknown as T;
    }
    
    // User detail operations
    const userId = endpoint.split('/')[2];
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    if (options.method === 'DELETE') {
      MOCK_USERS.splice(userIndex, 1);
      return {} as T;
    }
    
    if (options.method === 'PATCH') {
      const data = JSON.parse(options.body as string);
      MOCK_USERS[userIndex] = {
        ...MOCK_USERS[userIndex],
        ...data
      };
      return MOCK_USERS[userIndex] as unknown as T;
    }
    
    return MOCK_USERS[userIndex] as unknown as T;
  }
  
  // For other endpoints, return empty data for now
  if (endpoint.includes('licenses')) {
    return [] as unknown as T;
  }
  
  return {} as T;
}

// Process license data before sending to API
const prepareLicenseData = (license: Omit<License, 'id' | 'createdAt' | 'updatedAt'> | Partial<License>) => {
  // Create a copy to avoid modifying the original
  const preparedLicense: Record<string, any> = { ...license };
  
  // Ensure dates are in ISO string format for the API
  if (preparedLicense.startDate instanceof Date) {
    preparedLicense.startDate = preparedLicense.startDate.toISOString();
  }
  
  if (preparedLicense.renewalDate instanceof Date) {
    preparedLicense.renewalDate = preparedLicense.renewalDate.toISOString();
  }
  
  return preparedLicense;
};

// Process license from API to client
const processLicense = (license: any): License => {
  return {
    ...license,
    // Convert string dates to Date objects
    startDate: new Date(license.startDate),
    renewalDate: new Date(license.renewalDate),
    createdAt: new Date(license.createdAt),
    updatedAt: new Date(license.updatedAt)
  };
};

// License APIs
export const LicenseAPI = {
  getAll: async () => {
    try {
      console.log('Fetching all licenses');
      const licenses = await fetchAPI<any[]>('/licenses');
      return licenses.map(processLicense);
    } catch (error) {
      console.error('Failed to fetch licenses:', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      const license = await fetchAPI<any>(`/licenses/${id}`);
      return processLicense(license);
    } catch (error) {
      console.error(`Failed to fetch license ${id}:`, error);
      throw error;
    }
  },
  
  create: async (license: Omit<License, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Creating license:', license);
      const preparedData = prepareLicenseData(license);
      console.log('Prepared license data:', preparedData);
      
      const newLicense = await fetchAPI<any>('/licenses', {
        method: 'POST',
        body: JSON.stringify(preparedData),
      });
      
      return processLicense(newLicense);
    } catch (error) {
      console.error('Failed to create license:', error);
      throw error;
    }
  },
  
  update: async (id: string, license: Partial<License>) => {
    try {
      const preparedData = prepareLicenseData(license);
      const updatedLicense = await fetchAPI<any>(`/licenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(preparedData),
      });
      
      return processLicense(updatedLicense);
    } catch (error) {
      console.error(`Failed to update license ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      await fetchAPI(`/licenses/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete license ${id}:`, error);
      throw error;
    }
  },
};

// User APIs
export const UserAPI = {
  getAll: async () => {
    try {
      console.log('Fetching all users');
      const users = await fetchAPI<User[]>('/users');
      return users.map(user => ({
        ...user,
        createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
      }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      const user = await fetchAPI<User>(`/users/${id}`);
      return {
        ...user,
        createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)
      };
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  },
  
  create: async (user: Omit<User, 'id' | 'createdAt'>) => {
    try {
      const newUser = await fetchAPI<User>('/users', {
        method: 'POST',
        body: JSON.stringify(user),
      });
      return {
        ...newUser,
        createdAt: newUser.createdAt instanceof Date ? newUser.createdAt : new Date(newUser.createdAt)
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  },
    
  update: async (id: string, user: Partial<User>) => {
    try {
      const updatedUser = await fetchAPI<User>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(user),
      });
      return {
        ...updatedUser,
        createdAt: updatedUser.createdAt instanceof Date ? updatedUser.createdAt : new Date(updatedUser.createdAt)
      };
    } catch (error) {
      console.error(`Failed to update user ${id}:`, error);
      throw error;
    }
  },
    
  delete: async (id: string) => {
    try {
      await fetchAPI(`/users/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete user ${id}:`, error);
      throw error;
    }
  },
};
