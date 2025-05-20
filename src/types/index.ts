
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
  SUBSCRIPTION = "subscription"
}

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  BANK_TRANSFER = "bank_transfer",
  PURCHASE_ORDER = "purchase_order",
  PAYPAL = "paypal"
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
  paymentMethod: PaymentMethod;
  serviceOwner: string;
  status: LicenseStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSettings {
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  senderEmail: string;
  senderName: string;
}

export interface NotificationSettings {
  enabled: boolean;
  emailTemplates: {
    thirtyDays: string;
    sevenDays: string;
    oneDay: string;
  };
}
