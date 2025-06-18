import React, { createContext, useContext, useState, useEffect } from "react";
import { EmailSettings, NotificationSettings, License } from "@/types";
import { toast } from "sonner";
import { useLicenses } from "./LicenseContext";
import { addDays, isWithinInterval } from "date-fns";
import { notificationScheduler } from "@/services/notificationScheduler";

interface NotificationContextType {
  emailSettings: EmailSettings;
  notificationSettings: NotificationSettings;
  updateEmailSettings: (settings: Partial<EmailSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  testEmailConnection: () => Promise<boolean>;
  sendAutomaticNotifications: () => void;
  sendManualNotification: (licenseId: string, templateType: keyof NotificationSettings["emailTemplates"]) => boolean;
  triggerManualCheck: () => void;
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
  }, []);

  useEffect(() => {
    // Start the notification scheduler when licenses or settings change
    if (licenses.length > 0) {
      console.log("🕐 Starting notification scheduler with", licenses.length, "licenses");
      notificationScheduler.start(
        licenses,
        emailSettings,
        notificationSettings,
        sendEmailNotification
      );
    }

    // Cleanup function to stop scheduler when component unmounts
    return () => {
      notificationScheduler.stop();
    };
  }, [licenses, emailSettings, notificationSettings]);

  const updateEmailSettings = (settings: Partial<EmailSettings>) => {
    const updatedSettings = {...emailSettings, ...settings};
    setEmailSettings(updatedSettings);
    localStorage.setItem("emailSettings", JSON.stringify(updatedSettings));
    toast.success("Email settings updated");
    
    // Restart scheduler with new settings
    if (licenses.length > 0) {
      notificationScheduler.start(
        licenses,
        updatedSettings,
        notificationSettings,
        sendEmailNotification
      );
    }
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
    
    // Restart scheduler with new settings
    if (licenses.length > 0) {
      notificationScheduler.start(
        licenses,
        emailSettings,
        updatedSettings,
        sendEmailNotification
      );
    }
  };

  const testEmailConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify(emailSettings)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.error);
        return false;
      }
    } catch (error) {
      console.error('Email test error:', error);
      toast.error('Failed to test email connection');
      return false;
    }
  };

  const sendAutomaticNotifications = () => {
    // This is now handled by the scheduler
    console.log("🕐 sendAutomaticNotifications called (now handled by scheduler)");
  };

  const triggerManualCheck = () => {
    console.log("🕐 Manual notification check triggered from UI");
    notificationScheduler.triggerManualCheck(
      licenses,
      emailSettings,
      notificationSettings,
      sendEmailNotification
    );
    toast.success("Manual notification check completed");
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

  const sendEmailNotification = async (license: License, templateType: string) => {
    try {
      console.log(`📧 Sending ${templateType} notification for ${license.name} to ${license.serviceOwnerEmail}`);
      
      if (!license.serviceOwnerEmail) {
        console.warn(`⚠️ No service owner email for license ${license.name}`);
        return;
      }

      let template = '';
      switch (templateType) {
        case 'thirtyDays':
          template = notificationSettings.emailTemplates.thirtyDays;
          break;
        case 'sevenDays':
          template = notificationSettings.emailTemplates.sevenDays;
          break;
        case 'oneDay':
          template = notificationSettings.emailTemplates.oneDay;
          break;
        default:
          console.error('Unknown template type:', templateType);
          return;
      }

      const response = await fetch(`${API_URL}/api/email/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          emailSettings,
          license,
          templateType,
          template
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Email sent successfully for ${license.name}`);
        toast.success(`Email sent to ${license.serviceOwnerEmail} for ${license.name}`);
      } else {
        console.error(`❌ Failed to send email for ${license.name}:`, data.error);
        toast.error(`Failed to send email: ${data.error}`);
      }
      
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error('Failed to send email notification');
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      emailSettings, 
      notificationSettings, 
      updateEmailSettings, 
      updateNotificationSettings,
      testEmailConnection,
      sendAutomaticNotifications,
      sendManualNotification,
      triggerManualCheck
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
