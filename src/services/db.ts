import Dexie, { Table } from 'dexie';
import { License, User } from '@/types';
import { format } from 'date-fns';

// Define the database
class AppDatabase extends Dexie {
  licenses!: Table<License, string>;
  users!: Table<User, string>;

  constructor() {
    super('LicenseManagerDB');
    
    // Define tables and schema
    this.version(1).stores({
      licenses: 'id, name, type, department, supplier, status', // Primary key is id
      users: 'id, username, email, role'  // Primary key is id
    });
  }
}

const db = new AppDatabase();

// Initialize the database with default data if empty
export const initializeDatabase = async () => {
  // Check if licenses table is empty
  const licenseCount = await db.licenses.count();
  if (licenseCount === 0) {
    console.log('Initializing license database with mock data');
    const mockLicenses = generateMockLicenses();
    await db.licenses.bulkAdd(mockLicenses);
  }

  // Check if users table is empty
  const userCount = await db.users.count();
  if (userCount === 0) {
    console.log('Initializing users database with mock data');
    const mockUsers = generateMockUsers();
    await db.users.bulkAdd(mockUsers);
  }
};

// Generate mock licenses (same as in LicenseContext)
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

// Generate mock users (from UsersPage)
const generateMockUsers = (): User[] => {
  return [
    {
      id: "1",
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      createdAt: new Date(2023, 0, 15)
    },
    {
      id: "2",
      username: "user",
      email: "user@example.com",
      role: "user",
      createdAt: new Date(2023, 1, 10)
    },
    {
      id: "3",
      username: "johndoe",
      email: "john.doe@example.com",
      role: "user",
      createdAt: new Date(2023, 2, 5)
    },
    {
      id: "4",
      username: "janedoe",
      email: "jane.doe@example.com",
      role: "user",
      createdAt: new Date(2023, 3, 20)
    },
  ];
};

export default db;
