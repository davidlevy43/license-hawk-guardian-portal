
import { License, User } from '@/types';

// The base URL for your API server
// In a production environment, this would be your actual server URL
const API_URL = 'http://localhost:3001/api';

// Generic request handler with error management
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
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

// License APIs
export const LicenseAPI = {
  getAll: () => fetchAPI<License[]>('/licenses'),
  getById: (id: string) => fetchAPI<License>(`/licenses/${id}`),
  create: (license: Omit<License, 'id' | 'createdAt' | 'updatedAt'>) => 
    fetchAPI<License>('/licenses', {
      method: 'POST',
      body: JSON.stringify(license),
    }),
  update: (id: string, license: Partial<License>) => 
    fetchAPI<License>(`/licenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(license),
    }),
  delete: (id: string) => 
    fetchAPI(`/licenses/${id}`, {
      method: 'DELETE',
    }),
};

// User APIs
export const UserAPI = {
  getAll: async () => {
    const users = await fetchAPI<User[]>('/users');
    return users.map(user => ({
      ...user,
      createdAt: new Date(user.createdAt)
    }));
  },
  getById: async (id: string) => {
    const user = await fetchAPI<User>(`/users/${id}`);
    return {
      ...user,
      createdAt: new Date(user.createdAt)
    };
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
