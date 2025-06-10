import { License } from '@/types';
import { fetchAPI } from './base';

// Process license data before sending to API
const prepareLicenseData = (license: Omit<License, 'id' | 'createdAt' | 'updatedAt'> | Partial<License>) => {
  console.log("🔍 ✅ ENHANCED prepareLicenseData - Input data:", {
    costType: license.costType,
    costTypeType: typeof license.costType,
    paymentMethod: license.paymentMethod,
    paymentMethodType: typeof license.paymentMethod,
    fullLicense: license
  });
  
  // Create a copy to avoid modifying the original
  const preparedLicense: Record<string, any> = { ...license };
  
  // Ensure dates are in ISO string format for the API
  if (preparedLicense.startDate instanceof Date) {
    preparedLicense.startDate = preparedLicense.startDate.toISOString();
  }
  
  if (preparedLicense.renewalDate instanceof Date) {
    preparedLicense.renewalDate = preparedLicense.renewalDate.toISOString();
  }
  
  console.log("🔍 ✅ ENHANCED Final prepared data for API:", {
    costType: preparedLicense.costType,
    paymentMethod: preparedLicense.paymentMethod,
    creditCardDigits: preparedLicense.creditCardDigits,
    hasDigits: !!preparedLicense.creditCardDigits,
    fullPreparedData: preparedLicense
  });
  
  return preparedLicense;
};

// Process license from API to client - FIXED to preserve costType
const processLicense = (license: any): License => {
  console.log("🔍 ✅ FIXED Processing license from API:", {
    name: license.name,
    costType: license.costType,
    cost_type: license.cost_type,
    paymentMethod: license.paymentMethod,
    payment_method: license.payment_method,
    creditCardDigits: license.creditCardDigits,
    credit_card_digits: license.credit_card_digits
  });
  
  // ✅ FIXED: Use the actual costType from the API response, don't override with default
  const actualCostType = license.costType || license.cost_type;
  
  return {
    ...license,
    // Convert string dates to Date objects
    startDate: new Date(license.startDate),
    renewalDate: new Date(license.renewalDate),
    createdAt: new Date(license.createdAt),
    updatedAt: new Date(license.updatedAt),
    // ✅ FIXED: Preserve the actual costType from the API
    costType: actualCostType,
    // Handle snake_case to camelCase conversion for other fields
    paymentMethod: license.paymentMethod || license.payment_method,
    creditCardDigits: license.creditCardDigits || license.credit_card_digits
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
      console.log('Updating license:', id, license);
      const preparedData = prepareLicenseData(license);
      console.log('Prepared update data:', preparedData);
      
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
