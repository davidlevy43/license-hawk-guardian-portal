
import React, { createContext, useContext, useState, useEffect } from "react";
import { EmailSettings, NotificationSettings, License } from "@/types";
import { toast } from "sonner";
import { useLicenses } from "./LicenseContext";
import { addDays, isWithinInterval } from "date-fns";

interface NotificationContextType {
  emailSettings: EmailSettings;
  notificationSettings: NotificationSettings;
  updateEmailSettings: (settings: Partial<EmailSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  testEmailConnection: () => Promise<boolean>;
  sendAutomaticNotifications: () => void;
  sendManualNotification: (licenseId: string, templateType: keyof NotificationSettings["emailTemplates"]) => boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  smtpServer: "smtp.gmail.com",
  smtpPort: 587,
  username: "",
  password: "",
  senderEmail: "",
  senderName: "License Manager",
  automaticSending: true
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  emailTemplates: {
    thirtyDays: "Your {LICENSE_TYPE} {LICENSE_NAME} will expire in 30 days on {EXPIRY_DATE}. Payment method: Credit card ending in {CARD_LAST_4}. Please take action.",
    sevenDays: "REMINDER: Your {LICENSE_TYPE} {LICENSE_NAME} will expire in 7 days on {EXPIRY_DATE}. Payment method: Credit card ending in {CARD_LAST_4}.",
    oneDay: "URGENT: Your {LICENSE_TYPE} {LICENSE_NAME} expires tomorrow on {EXPIRY_DATE}! Payment method: Credit card ending in {CARD_LAST_4}."
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const { licenses, getLicenseById } = useLicenses();

  useEffect(() => {
    // Load settings from localStorage if available
    const storedEmailSettings = localStorage.getItem("emailSettings");
    const storedNotificationSettings = localStorage.getItem("notificationSettings");
    
    if (storedEmailSettings) {
      try {
        const parsedSettings = JSON.parse(storedEmailSettings);
        setEmailSettings({...DEFAULT_EMAIL_SETTINGS, ...parsedSettings});
      } catch (error) {
        console.error("Failed to parse email settings:", error);
      }
    }
    
    if (storedNotificationSettings) {
      try {
        const parsedSettings = JSON.parse(storedNotificationSettings);
        setNotificationSettings({...DEFAULT_NOTIFICATION_SETTINGS, ...parsedSettings});
      } catch (error) {
        console.error("Failed to parse notification settings:", error);
      }
    }

    // Check for licenses needing notifications when the component mounts
    const checkInterval = setInterval(() => {
      if (emailSettings.automaticSending && notificationSettings.enabled) {
        sendAutomaticNotifications();
      }
    }, 86400000); // Check once per day (24 hours in milliseconds)
    
    // Initial check
    if (emailSettings.automaticSending && notificationSettings.enabled) {
      sendAutomaticNotifications();
    }

    return () => clearInterval(checkInterval);
  }, [licenses, emailSettings.automaticSending, notificationSettings.enabled]);

  const updateEmailSettings = (settings: Partial<EmailSettings>) => {
    const updatedSettings = {...emailSettings, ...settings};
    setEmailSettings(updatedSettings);
    localStorage.setItem("emailSettings", JSON.stringify(updatedSettings));
    toast.success("Email settings updated");
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    const updatedSettings = {
      ...notificationSettings,
      ...settings,
      emailTemplates: {
        ...notificationSettings.emailTemplates,
        ...(settings.emailTemplates || {})
      }
    };
    setNotificationSettings(updatedSettings);
    localStorage.setItem("notificationSettings", JSON.stringify(updatedSettings));
    toast.success("Notification settings updated");
  };

  const testEmailConnection = async (): Promise<boolean> => {
    // In a real app, this would send a test email
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = !!emailSettings.username && !!emailSettings.password && !!emailSettings.senderEmail;
        if (success) {
          toast.success("Email connection test successful!");
        } else {
          toast.error("Email connection test failed. Please check your settings.");
        }
        resolve(success);
      }, 1500);
    });
  };

  const sendAutomaticNotifications = () => {
    if (!notificationSettings.enabled) return;
    
    const today = new Date();
    const oneDay = addDays(today, 1);
    const sevenDays = addDays(today, 7);
    const thirtyDays = addDays(today, 30);
    
    // Find licenses that are about to expire
    const oneDayLicenses = findLicensesForNotification(oneDay, today);
    const sevenDayLicenses = findLicensesForNotification(sevenDays, addDays(today, 6));
    const thirtyDayLicenses = findLicensesForNotification(thirtyDays, addDays(today, 29));
    
    // Send notifications for each license
    oneDayLicenses.forEach(license => sendEmailNotification(license, "oneDay"));
    sevenDayLicenses.forEach(license => sendEmailNotification(license, "sevenDays"));
    thirtyDayLicenses.forEach(license => sendEmailNotification(license, "thirtyDays"));
  };

  const findLicensesForNotification = (expiryDate: Date, rangeStart: Date) => {
    return licenses.filter(license => {
      const renewalDate = new Date(license.renewalDate);
      return isWithinInterval(renewalDate, { start: rangeStart, end: expiryDate });
    });
  };

  const sendManualNotification = (licenseId: string, templateType: keyof NotificationSettings["emailTemplates"]) => {
    const license = getLicenseById(licenseId);
    if (!license) {
      toast.error("License not found");
      return false;
    }
    
    sendEmailNotification(license, templateType);
    return true;
  };

  const sendEmailNotification = (license: License, templateType: keyof NotificationSettings["emailTemplates"]) => {
    // In a real application, this would send an actual email using SMTP settings
    const template = notificationSettings.emailTemplates[templateType];
    const cardLastFour = license.creditCardDigits || "****";
    const licenseType = license.type.charAt(0).toUpperCase() + license.type.slice(1);
    
    const emailContent = template
      .replace("{LICENSE_NAME}", license.name)
      .replace("{LICENSE_TYPE}", licenseType)
      .replace("{EXPIRY_DATE}", new Date(license.renewalDate).toLocaleDateString())
      .replace("{CARD_LAST_4}", cardLastFour)
      .replace("{DEPARTMENT}", license.department)
      .replace("{SUPPLIER}", license.supplier)
      .replace("{COST}", license.monthlyCost.toString())
      .replace("{SERVICE_OWNER}", license.serviceOwner);
    
    // Get recipient's email (service owner email)
    const recipientEmail = license.serviceOwnerEmail || "";
    
    if (!recipientEmail) {
      console.warn(`No email address found for service owner of license "${license.name}"`);
      toast.warning(`No email address available for service owner of "${license.name}"`);
      return;
    }
    
    // Check if SMTP settings are configured
    if (!emailSettings.smtpServer || !emailSettings.username || !emailSettings.password || !emailSettings.senderEmail) {
      console.warn("SMTP settings are not properly configured");
      toast.warning("Email not sent: SMTP settings are incomplete");
      return;
    }
    
    console.log(`Sending ${templateType} notification to ${recipientEmail} for ${license.name}:`, emailContent);
    
    // In a real app, this would actually send the email
    // This is where you would integrate with a real email sending service
    
    // Simulate successful sending
    toast.success(`Notification sent to ${recipientEmail} for license "${license.name}"`);
  };

  return (
    <NotificationContext.Provider value={{ 
      emailSettings, 
      notificationSettings, 
      updateEmailSettings, 
      updateNotificationSettings,
      testEmailConnection,
      sendAutomaticNotifications,
      sendManualNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
