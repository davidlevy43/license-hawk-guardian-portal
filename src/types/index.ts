export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  password?: string; // Added optional password field for user creation
}

export enum LicenseStatus {
  ACTIVE = "active",
  PENDING = "pending",
  EXPIRED = "expired"
}

export enum LicenseType {
  SOFTWARE = "software",
  HARDWARE = "hardware",
  SERVICE = "service",
  SUBSCRIPTION = "subscription",
  AGREEMENT = "agreement",
  CERTIFICATE = "certificate"
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  BANK_TRANSFER = "bank_transfer",
  PURCHASE_ORDER = "purchase_order",
  PAYPAL = "paypal"
}

export enum CostType {
  MONTHLY = "monthly",
  YEARLY = "yearly",
  ONE_TIME = "one_time"
}

export interface License {
  id: string;
  name: string;
  type: LicenseType;
  department: string;
  supplier: string;
  startDate: Date;
  renewalDate: Date;
  monthlyCost: number;
  costType: CostType;
  paymentMethod: PaymentMethod;
  serviceOwner: string;
  serviceOwnerEmail: string;
  status: LicenseStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  creditCardDigits?: string; // Last four digits of the credit card
}

export interface EmailSettings {
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  senderEmail: string;
  senderName: string;
  automaticSending: boolean; // Flag to enable/disable automatic sending
}

export interface NotificationSettings {
  enabled: boolean;
  emailTemplates: {
    thirtyDays: string;
    sevenDays: string;
    oneDay: string;
  };
}
