

import React, { createContext, useContext, useState, useEffect } from "react";
import { License, LicenseStatus, LicenseType, PaymentMethod, CostType } from "@/types";
import { format, addMonths, isPast, addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { LicenseAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface LicenseContextType {
  licenses: License[];
  isLoading: boolean;
  addLicense: (license: Omit<License, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateLicense: (id: string, license: Partial<License>) => Promise<void>;
  deleteLicense: (id: string) => Promise<void>;
  getLicenseById: (id: string) => License | undefined;
  refreshLicenses: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

// Helper function to determine status based on renewal date
const getStatusFromDate = (renewalDate: Date): LicenseStatus => {
  const today = startOfDay(new Date());
  const thirtyDaysFromNow = endOfDay(addDays(today, 30));
  
  console.log("🔍 Status calculation for renewal date:", renewalDate);
  console.log("Today:", today);
  console.log("30 days from now:", thirtyDaysFromNow);
  
  if (isPast(renewalDate)) {
    console.log("Status: EXPIRED (date is in the past)");
    return LicenseStatus.EXPIRED;
  } else if (isWithinInterval(renewalDate, { start: today, end: thirtyDaysFromNow })) {
    console.log("Status: PENDING (within 30 days)");
    return LicenseStatus.PENDING;
  } else {
    console.log("Status: ACTIVE (more than 30 days)");
    return LicenseStatus.ACTIVE;
  }
};

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  const refreshLicenses = async () => {
    // Don't try to load licenses if not authenticated
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping license refresh");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Refreshing licenses...");
      
      // Get all licenses from the API
      const apiLicenses = await LicenseAPI.getAll();
      console.log("Licenses fetched from API:", apiLicenses);
      
      // Update status for each license based on renewal date
      const licensesWithUpdatedStatus = apiLicenses.map(license => {
        const calculatedStatus = getStatusFromDate(license.renewalDate);
        const updatedLicense = { 
          ...license, 
          status: calculatedStatus,
          // Ensure costType is properly typed
          costType: (license.costType as CostType) || CostType.MONTHLY
        };
        
        console.log(`License "${license.name}": renewal ${license.renewalDate}, status ${calculatedStatus}`);
        
        return updatedLicense;
      });
      
      setLicenses(licensesWithUpdatedStatus);
      console.log("Licenses with updated status:", licensesWithUpdatedStatus);
    } catch (error) {
      console.error("Error loading licenses:", error);
      toast.error("Failed to load licenses");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load licenses if authenticated
    if (isAuthenticated) {
      refreshLicenses().catch(err => {
        console.error("Initial license load failed:", err);
      });
    } else {
      // Clear licenses when not authenticated
      setLicenses([]);
    }
  }, [isAuthenticated]);

  const addLicense = async (licenseData: Omit<License, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsLoading(true);
      console.log("Adding license:", licenseData);
      
      // Calculate status based on renewal date
      const calculatedStatus = getStatusFromDate(licenseData.renewalDate);
      const licenseWithStatus = { ...licenseData, status: calculatedStatus };
      
      // Add to API
      const newLicense = await LicenseAPI.create(licenseWithStatus);
      console.log("License created:", newLicense);
      
      // Update state
      setLicenses(prev => [...prev, newLicense]);
      toast.success(`License "${newLicense.name}" has been added`);
    } catch (error: any) {
      console.error("Error adding license:", error);
      toast.error(`Failed to add license: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLicense = async (id: string, licenseData: Partial<License>) => {
    try {
      setIsLoading(true);
      console.log("Updating license:", id, licenseData);
      
      // If renewal date is being updated, recalculate status
      let updatedData = { ...licenseData };
      if (licenseData.renewalDate) {
        updatedData.status = getStatusFromDate(licenseData.renewalDate);
      }
      
      // Update in API
      const updatedLicense = await LicenseAPI.update(id, updatedData);
      
      // Update state
      setLicenses(prev => prev.map(license => {
        if (license.id === id) {
          return updatedLicense;
        }
        return license;
      }));
      
      toast.success(`License "${updatedLicense.name}" updated successfully`);
    } catch (error: any) {
      console.error("Error updating license:", error);
      toast.error(`Failed to update license: ${error.message}`);
      throw error;
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
    } catch (error: any) {
      console.error("Error deleting license:", error);
      toast.error(`Failed to delete license: ${error.message}`);
      throw error;
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
      getLicenseById,
      refreshLicenses
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

