
import { addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { License } from "@/types";

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private lastCheckDate: string | null = null;
  
  private constructor() {}
  
  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }
  
  start(
    licenses: License[],
    emailSettings: any,
    notificationSettings: any,
    sendEmailNotification: (license: License, templateType: string) => void
  ) {
    // Clear any existing interval
    this.stop();
    
    console.log("🕐 Starting notification scheduler...");
    
    // Check immediately if we haven't checked today
    const today = new Date().toDateString();
    const lastCheck = localStorage.getItem('lastNotificationCheck');
    
    if (lastCheck !== today) {
      console.log("🕐 Performing initial notification check...");
      this.checkAndSendNotifications(licenses, emailSettings, notificationSettings, sendEmailNotification);
      localStorage.setItem('lastNotificationCheck', today);
    }
    
    // Set up interval to check every hour
    this.intervalId = setInterval(() => {
      const currentDate = new Date().toDateString();
      const lastCheckStored = localStorage.getItem('lastNotificationCheck');
      
      // Only run once per day
      if (lastCheckStored !== currentDate) {
        console.log("🕐 Running daily notification check...");
        this.checkAndSendNotifications(licenses, emailSettings, notificationSettings, sendEmailNotification);
        localStorage.setItem('lastNotificationCheck', currentDate);
      }
    }, 60 * 60 * 1000); // Check every hour
    
    console.log("🕐 Notification scheduler started successfully");
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("🕐 Notification scheduler stopped");
    }
  }
  
  private checkAndSendNotifications(
    licenses: License[],
    emailSettings: any,
    notificationSettings: any,
    sendEmailNotification: (license: License, templateType: string) => void
  ) {
    if (!notificationSettings.enabled || !emailSettings.automaticSending) {
      console.log("🕐 Automatic notifications disabled");
      return;
    }
    
    if (!this.isEmailConfigured(emailSettings)) {
      console.log("🕐 Email settings not properly configured");
      return;
    }
    
    console.log(`🕐 Checking ${licenses.length} licenses for notifications...`);
    
    const today = new Date();
    const oneDay = addDays(today, 1);
    const sevenDays = addDays(today, 7);
    const thirtyDays = addDays(today, 30);
    
    // Find licenses that need notifications
    const oneDayLicenses = this.findLicensesInRange(licenses, today, oneDay);
    const sevenDayLicenses = this.findLicensesInRange(licenses, addDays(today, 6), sevenDays);
    const thirtyDayLicenses = this.findLicensesInRange(licenses, addDays(today, 29), thirtyDays);
    
    console.log(`🕐 Found notifications to send:`);
    console.log(`  - 1 day: ${oneDayLicenses.length} licenses`);
    console.log(`  - 7 days: ${sevenDayLicenses.length} licenses`);
    console.log(`  - 30 days: ${thirtyDayLicenses.length} licenses`);
    
    // Send notifications
    oneDayLicenses.forEach(license => {
      console.log(`🕐 Sending 1-day notification for: ${license.name}`);
      sendEmailNotification(license, "oneDay");
    });
    
    sevenDayLicenses.forEach(license => {
      console.log(`🕐 Sending 7-day notification for: ${license.name}`);
      sendEmailNotification(license, "sevenDays");
    });
    
    thirtyDayLicenses.forEach(license => {
      console.log(`🕐 Sending 30-day notification for: ${license.name}`);
      sendEmailNotification(license, "thirtyDays");
    });
    
    const totalSent = oneDayLicenses.length + sevenDayLicenses.length + thirtyDayLicenses.length;
    if (totalSent > 0) {
      console.log(`🕐 Total notifications sent: ${totalSent}`);
    } else {
      console.log("🕐 No notifications needed today");
    }
  }
  
  private findLicensesInRange(licenses: License[], startDate: Date, endDate: Date): License[] {
    return licenses.filter(license => {
      const renewalDate = new Date(license.renewalDate);
      const start = startOfDay(startDate);
      const end = endOfDay(endDate);
      
      return isWithinInterval(renewalDate, { start, end });
    });
  }
  
  private isEmailConfigured(emailSettings: any): boolean {
    return !!(
      emailSettings.smtpServer &&
      emailSettings.username &&
      emailSettings.password &&
      emailSettings.senderEmail
    );
  }
  
  // Manual trigger for testing
  triggerManualCheck(
    licenses: License[],
    emailSettings: any,
    notificationSettings: any,
    sendEmailNotification: (license: License, templateType: string) => void
  ) {
    console.log("🕐 Manual notification check triggered");
    this.checkAndSendNotifications(licenses, emailSettings, notificationSettings, sendEmailNotification);
  }
}

export const notificationScheduler = NotificationScheduler.getInstance();
