
import React, { createContext, useContext, useState, useEffect } from "react";
import { License, LicenseStatus, LicenseType, PaymentMethod } from "@/types";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";
import { LicenseAPI } from "@/services/api";

interface LicenseContextType {
  licenses: License[];
  isLoading: boolean;
  addLicense: (license: Omit<License, "id" | "createdAt" | "updatedAt">) => void;
  updateLicense: (id: string, license: Partial<License>) => void;
  deleteLicense: (id: string) => void;
  getLicenseById: (id: string) => License | undefined;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

// Helper function to determine status based on renewal date
const getStatusFromDate = (renewalDate: Date): LicenseStatus => {
  const now = new Date();
  const thirtyDaysFromNow = addMonths(now, 1);
  
  if (renewalDate < now) {
    return LicenseStatus.EXPIRED;
  } else if (renewalDate <= thirtyDaysFromNow) {
    return LicenseStatus.PENDING;
  } else {
    return LicenseStatus.ACTIVE;
  }
};

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load licenses from API
    const loadLicenses = async () => {
      try {
        setIsLoading(true);
        
        // Get all licenses from the API
        const apiLicenses = await LicenseAPI.getAll();
        
        // Convert date strings to Date objects if needed
        const processedLicenses = apiLicenses.map(license => ({
          ...license,
          startDate: license.startDate instanceof Date ? license.startDate : new Date(license.startDate),
          renewalDate: license.renewalDate instanceof Date ? license.renewalDate : new Date(license.renewalDate),
          createdAt: license.createdAt instanceof Date ? license.createdAt : new Date(license.createdAt),
          updatedAt: license.updatedAt instanceof Date ? license.updatedAt : new Date(license.updatedAt)
        }));
        
        setLicenses(processedLicenses);
      } catch (error) {
        console.error("Error loading licenses:", error);
        toast.error("Failed to load licenses");
      } finally {
        setIsLoading(false);
      }
    };

    loadLicenses();
  }, []);

  const addLicense = async (licenseData: Omit<License, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsLoading(true);
      // Add to API
      const newLicense = await LicenseAPI.create(licenseData);
      
      // Update state
      setLicenses(prev => [...prev, newLicense]);
      toast.success(`License "${newLicense.name}" has been added`);
    } catch (error) {
      console.error("Error adding license:", error);
      toast.error("Failed to add license");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLicense = async (id: string, licenseData: Partial<License>) => {
    try {
      setIsLoading(true);
      // Update in API
      const updatedLicense = await LicenseAPI.update(id, licenseData);
      
      // Update state
      setLicenses(prev => prev.map(license => {
        if (license.id === id) {
          return updatedLicense;
        }
        return license;
      }));
      
      toast.success("License updated successfully");
    } catch (error) {
      console.error("Error updating license:", error);
      toast.error("Failed to update license");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLicense = async (id: string) => {
    try {
      const licenseToDelete = licenses.find(l => l.id === id);
      setIsLoading(true);
      
      // Delete from API
      await LicenseAPI.delete(id);
      
      // Update state
      setLicenses(prev => prev.filter(license => license.id !== id));
      
      if (licenseToDelete) {
        toast.success(`License "${licenseToDelete.name}" has been deleted`);
      }
    } catch (error) {
      console.error("Error deleting license:", error);
      toast.error("Failed to delete license");
    } finally {
      setIsLoading(false);
    }
  };

  const getLicenseById = (id: string) => {
    return licenses.find(license => license.id === id);
  };

  return (
    <LicenseContext.Provider value={{ 
      licenses, 
      isLoading, 
      addLicense, 
      updateLicense, 
      deleteLicense,
      getLicenseById
    }}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicenses = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error("useLicenses must be used within a LicenseProvider");
  }
  return context;
};
