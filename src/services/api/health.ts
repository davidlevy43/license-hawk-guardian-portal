
import { API_URL } from './base';

// Health check API service with more robust error handling
export const HealthAPI = {
  checkServer: async () => {
    try {
      // For Lovable preview environment, return true
      if (window.location.hostname.includes('lovableproject.com')) {
        console.log("Using mock health check for preview environment");
        return true;
      }
      
      // For iltela21 server - specific handling
      if (window.location.hostname === 'iltela21') {
        console.log("Checking local iltela21 server health");
      }
      
      // Use /health endpoint (not /api/health)
      const healthEndpoint = `${API_URL}/health`;
      console.log(`Checking server health at ${healthEndpoint}`);
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000), // 8 second timeout
        // Add cache control to prevent caching issues
        cache: 'no-cache'
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
