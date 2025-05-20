
import { User } from '@/types';
import { fetchAPI } from './base';

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
