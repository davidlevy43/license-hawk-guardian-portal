
import { API_URL } from './base';

// Health check API service
export const HealthAPI = {
  checkServer: async () => {
    try {
      console.log(`Checking server at ${API_URL}/api/health`);
      const response = await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
};
