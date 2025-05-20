
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
      
      // Check if response is valid JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.ok;
      } else {
        console.error('Server returned non-JSON response');
        return false;
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
};
