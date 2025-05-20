
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
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
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
  getAll: () => fetchAPI<User[]>('/users'),
  getById: (id: string) => fetchAPI<User>(`/users/${id}`),
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
