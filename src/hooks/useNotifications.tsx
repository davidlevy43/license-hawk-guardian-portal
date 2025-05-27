
import { useMemo } from "react";
import { useLicenses } from "@/context/LicenseContext";
import { addDays, differenceInDays, isPast } from "date-fns";

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'error';
  licenseId?: string;
  createdAt: Date;
}

export const useNotifications = () => {
  const { licenses } = useLicenses();

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];
    const today = new Date();

    licenses.forEach(license => {
      const renewalDate = new Date(license.renewalDate);
      const daysUntilRenewal = differenceInDays(renewalDate, today);

      // Expired licenses
      if (isPast(renewalDate)) {
        const daysExpired = Math.abs(daysUntilRenewal);
        notifs.push({
          id: `expired-${license.id}`,
          title: `${license.name} expired`,
          description: daysExpired === 0 ? 'Expired today' : `Expired ${daysExpired} day${daysExpired > 1 ? 's' : ''} ago`,
          type: 'error',
          licenseId: license.id,
          createdAt: renewalDate
        });
      }
      // Expiring soon (within 30 days)
      else if (daysUntilRenewal <= 30) {
        let type: 'warning' | 'error' = 'warning';
        if (daysUntilRenewal <= 7) type = 'error';

        notifs.push({
          id: `expiring-${license.id}`,
          title: `${license.name} expiring soon`,
          description: `Renewal due in ${daysUntilRenewal} day${daysUntilRenewal !== 1 ? 's' : ''}`,
          type,
          licenseId: license.id,
          createdAt: today
        });
      }
    });

    // Sort by urgency: errors first, then warnings, then by creation date
    return notifs.sort((a, b) => {
      if (a.type === 'error' && b.type !== 'error') return -1;
      if (b.type === 'error' && a.type !== 'error') return 1;
      if (a.type === 'warning' && b.type === 'info') return -1;
      if (b.type === 'warning' && a.type === 'info') return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [licenses]);

  return {
    notifications,
    count: notifications.length
  };
};
