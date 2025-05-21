
import { API_URL } from './base';

// Health check API service
export const HealthAPI = {
  checkServer: async () => {
    try {
      // Ensure we don't have double "/api" in URL path
      const healthEndpoint = `${API_URL}/health`;
      console.log(`Checking server health at ${healthEndpoint}`);
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });
      
      console.log("Health check response status:", response.status);
      
      if (response.ok) {
        return true;
      } else {
        console.error('Server health check failed with status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
};
