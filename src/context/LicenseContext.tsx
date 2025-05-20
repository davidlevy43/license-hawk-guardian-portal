
import React, { createContext, useContext, useState, useEffect } from "react";
import { License, LicenseStatus, LicenseType, PaymentMethod } from "@/types";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";

interface LicenseContextType {
  licenses: License[];
  isLoading: boolean;
  addLicense: (license: Omit<License, "id" | "createdAt" | "updatedAt">) => void;
  updateLicense: (id: string, license: Partial<License>) => void;
  deleteLicense: (id: string) => void;
  getLicenseById: (id: string) => License | undefined;
}

const LicenseContext = createContext<LicenseContextType | null>(null);

// Generate some mock license data
const generateMockLicenses = (): License[] => {
  const departments = ["IT", "Marketing", "Sales", "HR", "Finance"];
  const suppliers = ["Microsoft", "Adobe", "Oracle", "IBM", "Cisco", "VMware", "ServiceNow"];
  
  // Updated with emails
  const owners = [
    { name: "John Smith", email: "john.smith@company.com" },
    { name: "Emily Johnson", email: "emily.johnson@company.com" },
    { name: "Michael Williams", email: "michael.williams@company.com" },
    { name: "Sarah Brown", email: "sarah.brown@company.com" },
    { name: "David Jones", email: "david.jones@company.com" }
  ];
  
  const licenseNames = [
    "Windows Server 2022", "Office 365", "Adobe Creative Cloud",
    "Oracle Database", "SQL Server", "VMware vSphere", "ServiceNow",
    "Salesforce", "SAP ERP", "AutoCAD", "Jira", "Confluence"
  ];

  return Array.from({ length: 20 }, (_, i) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 12));
    
    const renewalDate = new Date(startDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    
    const status = getStatusFromDate(renewalDate);
    const randomOwnerIndex = Math.floor(Math.random() * owners.length);
    
    return {
      id: (i + 1).toString(),
      name: licenseNames[Math.floor(Math.random() * licenseNames.length)],
      type: Object.values(LicenseType)[Math.floor(Math.random() * Object.values(LicenseType).length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
      startDate,
      renewalDate,
      monthlyCost: Math.floor(Math.random() * 5000) + 100,
      paymentMethod: Object.values(PaymentMethod)[Math.floor(Math.random() * Object.values(PaymentMethod).length)],
      serviceOwner: owners[randomOwnerIndex].name,
      serviceOwnerEmail: owners[randomOwnerIndex].email,
      status,
      notes: `License ${i + 1} notes go here`,
      createdAt: new Date(),
      updatedAt: new Date(),
      creditCardDigits: Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    };
  });
};

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
    // Load licenses from localStorage or generate mock data
    const loadLicenses = async () => {
      try {
        setIsLoading(true);
        
        // Check localStorage first
        const savedLicenses = localStorage.getItem('appLicenses');
        
        if (savedLicenses) {
          // Parse the saved licenses and convert date strings back to Date objects
          const parsedLicenses = JSON.parse(savedLicenses, (key, value) => {
            if (key === 'startDate' || key === 'renewalDate' || key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
          setLicenses(parsedLicenses);
        } else {
          // If no saved licenses, generate mock data
          const mockLicenses = generateMockLicenses();
          setLicenses(mockLicenses);
          // Save the mock licenses to localStorage
          localStorage.setItem('appLicenses', JSON.stringify(mockLicenses));
        }
      } catch (error) {
        console.error("Error loading licenses:", error);
        toast.error("Failed to load licenses");
        
        // Fallback to mock data if there's an error
        const mockLicenses = generateMockLicenses();
        setLicenses(mockLicenses);
      } finally {
        setIsLoading(false);
      }
    };

    loadLicenses();
  }, []);

  // Save licenses to localStorage whenever they change
  useEffect(() => {
    if (licenses.length > 0 && !isLoading) {
      localStorage.setItem('appLicenses', JSON.stringify(licenses));
    }
  }, [licenses, isLoading]);

  const addLicense = (licenseData: Omit<License, "id" | "createdAt" | "updatedAt">) => {
    const newLicense: License = {
      ...licenseData,
      id: (licenses.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setLicenses(prev => [...prev, newLicense]);
    toast.success(`License "${newLicense.name}" has been added`);
  };

  const updateLicense = (id: string, licenseData: Partial<License>) => {
    setLicenses(prev => prev.map(license => {
      if (license.id === id) {
        return {
          ...license,
          ...licenseData,
          updatedAt: new Date()
        };
      }
      return license;
    }));
    toast.success("License updated successfully");
  };

  const deleteLicense = (id: string) => {
    const licenseToDelete = licenses.find(l => l.id === id);
    setLicenses(prev => prev.filter(license => license.id !== id));
    if (licenseToDelete) {
      toast.success(`License "${licenseToDelete.name}" has been deleted`);
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
