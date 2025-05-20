
import { License, User } from '@/types';

// The base URL for your API server
// In a production environment, this would be your actual server URL
const API_URL = 'http://localhost:3001/api';

// Generic request handler with error management
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    throw error;
  }
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
      const users = await fetchAPI<any[]>('/users');
      return users.map(user => ({
        ...user,
        createdAt: new Date(user.createdAt)
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
        createdAt: new Date(user.createdAt)
      };
    } catch (error) {
      console.error(`Failed to fetch user ${id}:`, error);
      throw error;
    }
  },
  
  create: (user: Omit<User, 'id' | 'createdAt'>) => 
    fetchAPI<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
    
  update: (id: string, user: Partial<User>) => 
    fetchAPI<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    }),
    
  delete: (id: string) => 
    fetchAPI(`/users/${id}`, {
      method: 'DELETE',
    }),
};
