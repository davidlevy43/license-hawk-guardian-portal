import React, { createContext, useContext, useState, useEffect } from "react";
import { EmailSettings, NotificationSettings, License } from "@/types";
import { toast } from "sonner";
import { useLicenses } from "./LicenseContext";
import { API_URL } from "@/services/api/base";

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
  smtpServer: "",
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
    thirtyDays: "הרישיון {LICENSE_NAME} מסוג {LICENSE_TYPE} יפוג בעוד 30 יום בתאריך {EXPIRY_DATE}. אמצעי תשלום: {CARD_LAST_4}. אנא פעל בהתאם.",
    sevenDays: "תזכורת: הרישיון {LICENSE_NAME} מסוג {LICENSE_TYPE} יפוג בעוד 7 ימים בתאריך {EXPIRY_DATE}. אמצעי תשלום: {CARD_LAST_4}.",
    oneDay: "דחוף: הרישיון {LICENSE_NAME} מסוג {LICENSE_TYPE} פג מחר בתאריך {EXPIRY_DATE}! אמצעי תשלום: {CARD_LAST_4}."
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(DEFAULT_EMAIL_SETTINGS);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const { licenses, getLicenseById } = useLicenses();

  useEffect(() => {
    // Load settings from server
    loadSettingsFromServer();
  }, []);

  const loadSettingsFromServer = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Load email settings
      const emailResponse = await fetch(`${API_URL}/api/email-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        setEmailSettings({...DEFAULT_EMAIL_SETTINGS, ...emailData});
      }

      // Load notification settings
      const notificationResponse = await fetch(`${API_URL}/api/notification-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        setNotificationSettings({...DEFAULT_NOTIFICATION_SETTINGS, ...notificationData});
      }
    } catch (error) {
      console.error("Failed to load settings from server:", error);
    }
  };

  const updateEmailSettings = async (settings: Partial<EmailSettings>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const updatedSettings = {...emailSettings, ...settings};
      
      const response = await fetch(`${API_URL}/api/email-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        setEmailSettings(updatedSettings);
        toast.success("Email settings updated successfully");
      } else {
        throw new Error('Failed to update email settings');
      }
    } catch (error) {
      console.error("Error updating email settings:", error);
      toast.error("Failed to update email settings");
    }
  };

  const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const updatedSettings = {
        ...notificationSettings,
        ...settings,
        emailTemplates: {
          ...notificationSettings.emailTemplates,
          ...(settings.emailTemplates || {})
        }
      };
      
      const response = await fetch(`${API_URL}/api/notification-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        setNotificationSettings(updatedSettings);
        toast.success("Notification settings updated successfully");
      } else {
        throw new Error('Failed to update notification settings');
      }
    } catch (error) {
      console.error("Error updating notification settings:", error);
      toast.error("Failed to update notification settings");
    }
  };

  const testEmailConnection = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return false;
      }

      const response = await fetch(`${API_URL}/api/email/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          smtpServer: emailSettings.smtpServer,
          smtpPort: emailSettings.smtpPort,
          username: emailSettings.username,
          password: emailSettings.password,
          senderEmail: emailSettings.senderEmail
        })
      });

      if (response.ok) {
        toast.success("SMTP connection verified successfully");
        return true;
      } else {
        const error = await response.json();
        toast.error(`Connection test failed: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error('SMTP test error:', error);
      toast.error('Connection test failed');
      return false;
    }
  };

  const sendAutomaticNotifications = () => {
    // This is now handled by the server scheduler
    console.log("🕐 sendAutomaticNotifications called (now handled by server scheduler)");
  };

  const triggerManualCheck = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      console.log("🕐 Manual notification check triggered from UI");
      
      const response = await fetch(`${API_URL}/api/notifications/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        const notifications = result.result?.notifications || [];
        
        if (notifications.length > 0) {
          const sentCount = notifications.filter((n: any) => n.status === 'sent').length;
          const failedCount = notifications.filter((n: any) => n.status === 'failed').length;
          
          if (sentCount > 0) {
            toast.success(`נשלחו ${sentCount} התראות בהצלחה`);
          }
          if (failedCount > 0) {
            toast.error(`${failedCount} התראות נכשלו`);
          }
        } else {
          toast.info("לא נמצאו רישיונות הדורשים התראה היום");
        }
      } else {
        const error = await response.json();
        toast.error(`Manual check failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error triggering manual check:", error);
      toast.error("Failed to trigger manual notification check");
    }
  };

  const sendManualNotification = (licenseId: string, templateType: keyof NotificationSettings["emailTemplates"]) => {
    const license = getLicenseById(licenseId);
    if (!license) {
      toast.error("License not found");
      return false;
    }
    
    // This would need to be implemented if manual single notifications are needed
    toast.info("Manual single notifications not implemented yet");
    return true;
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