
import React, { createContext, useContext, useState, useEffect } from "react";
import { EmailSettings, NotificationSettings } from "@/types";
import { toast } from "sonner";

interface NotificationContextType {
  emailSettings: EmailSettings;
  notificationSettings: NotificationSettings;
  updateEmailSettings: (settings: Partial<EmailSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  testEmailConnection: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  smtpServer: "smtp.gmail.com",
  smtpPort: 587,
  username: "",
  password: "",
  senderEmail: "",
  senderName: "License Manager"
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  emailTemplates: {
    thirtyDays: "Your license {LICENSE_NAME} will expire in 30 days on {EXPIRY_DATE}. Please take action.",
    sevenDays: "REMINDER: Your license {LICENSE_NAME} will expire in 7 days on {EXPIRY_DATE}.",
    oneDay: "URGENT: Your license {LICENSE_NAME} expires tomorrow on {EXPIRY_DATE}!"
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

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

  return (
    <NotificationContext.Provider value={{ 
      emailSettings, 
      notificationSettings, 
      updateEmailSettings, 
      updateNotificationSettings,
      testEmailConnection
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
