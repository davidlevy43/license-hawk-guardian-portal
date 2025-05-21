
import { API_URL } from './base';

// Health check API service
export const HealthAPI = {
  checkServer: async () => {
    try {
      // Fix potential double "/api" in URL path
      const healthEndpoint = `${API_URL}/api/health`;
      console.log(`Checking server at ${healthEndpoint}`);
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000) // Increase timeout to 8 seconds
      });
      
      console.log("Health check response status:", response.status);
      
      // Check if response is valid JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.ok;
      } else {
        console.error('Server returned non-JSON response:', contentType);
        return false;
      }
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
};
