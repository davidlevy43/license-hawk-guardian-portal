
import { checkServerAvailability } from './base';

// Health check API service
export const HealthAPI = {
  checkServer: async () => {
    return await checkServerAvailability();
  }
};
