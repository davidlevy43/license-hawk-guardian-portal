import React, { createContext, useContext, useState, useEffect } from "react";
import { EmailSettings, NotificationSettings, License } from "@/types";
import { toast } from "sonner";
import { useLicenses } from "./LicenseContext";
import { addDays, isWithinInterval } from "date-fns";
import { notificationScheduler } from "@/services/notificationScheduler";
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
  serviceId: "",
  templateId: "",
  publicKey: "",
  privateKey: "",
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
      // Initialize EmailJS with public key
      const emailjs = (await import('@emailjs/browser')).default;
      emailjs.init(emailSettings.publicKey);
      
      toast.success("EmailJS configuration is valid");
      return true;
    } catch (error) {
      console.error('EmailJS test error:', error);
      toast.error('EmailJS configuration test failed');
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

      if (!emailSettings.serviceId || !emailSettings.templateId || !emailSettings.publicKey) {
        console.warn(`⚠️ EmailJS not configured properly`);
        toast.error("EmailJS settings incomplete. Please configure in settings.");
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

      // Import EmailJS dynamically
      const emailjs = (await import('@emailjs/browser')).default;
      
      // Initialize EmailJS
      emailjs.init(emailSettings.publicKey);

      // Replace template variables
      const processedTemplate = template
        .replace(/{LICENSE_TYPE}/g, license.type)
        .replace(/{LICENSE_NAME}/g, license.name)
        .replace(/{EXPIRY_DATE}/g, new Date(license.renewalDate).toLocaleDateString())
        .replace(/{CARD_LAST_4}/g, license.creditCardDigits || 'N/A');

      // Template parameters for EmailJS
      const templateParams = {
        to_email: license.serviceOwnerEmail,
        to_name: license.serviceOwner,
        from_name: emailSettings.senderName,
        reply_to: emailSettings.senderEmail,
        subject: `License Renewal Reminder - ${license.name}`,
        message: processedTemplate,
        license_name: license.name,
        license_type: license.type,
        expiry_date: new Date(license.renewalDate).toLocaleDateString(),
        service_owner: license.serviceOwner
      };

      const result = await emailjs.send(
        emailSettings.serviceId,
        emailSettings.templateId,
        templateParams,
        emailSettings.publicKey
      );
      
      if (result.status === 200) {
        console.log(`✅ Email sent successfully for ${license.name}`);
        toast.success(`Email sent to ${license.serviceOwnerEmail} for ${license.name}`);
      } else {
        console.error(`❌ Failed to send email for ${license.name}:`, result);
        toast.error(`Failed to send email via EmailJS`);
      }
      
    } catch (error) {
      console.error('EmailJS sending error:', error);
      toast.error('Failed to send email notification via EmailJS');
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
