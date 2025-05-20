import React, { useMemo } from "react";
import { useLicenses } from "@/context/LicenseContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { addDays, format, isSameMonth, parseISO } from "date-fns";
import { DayProps } from "react-day-picker";

const CalendarPage: React.FC = () => {
  const { licenses, isLoading } = useLicenses();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());

  // Get all license renewal dates for the current month
  const licenseDates = useMemo(() => {
    if (!licenses.length || !selectedDate) return {};
    
    return licenses.reduce((acc: Record<string, any[]>, license) => {
      const renewalDate = new Date(license.renewalDate);
      
      if (isSameMonth(renewalDate, selectedDate)) {
        const dateStr = format(renewalDate, "yyyy-MM-dd");
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(license);
      }
      
      return acc;
    }, {});
  }, [licenses, selectedDate]);

  // Get licenses for selected date
  const selectedDateLicenses = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return licenseDates[dateStr] || [];
  }, [licenseDates, selectedDate]);

  // Calculate upcoming renewals (next 7 days)
  const upcomingRenewals = useMemo(() => {
    if (!licenses.length) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysLater = addDays(today, 7);
    
    return licenses.filter((license) => {
      const renewalDate = new Date(license.renewalDate);
      renewalDate.setHours(0, 0, 0, 0);
      
      return renewalDate >= today && renewalDate <= sevenDaysLater;
    }).sort((a, b) => {
      return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
    });
  }, [licenses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Function to render calendar day with badges if there are licenses
  const renderCalendarDay = (props: DayProps) => {
    const { date: day, ...rest } = props;
    
    // Make sure day is a valid Date object
    if (!day || !(day instanceof Date) || isNaN(day.getTime())) {
      return <div>{day ? day.getDate?.() : ''}</div>;
    }
    
    const dateStr = format(day, "yyyy-MM-dd");
    const hasLicenses = licenseDates[dateStr]?.length > 0;
    
    if (hasLicenses) {
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <span>{day.getDate()}</span>
          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary"></span>
        </div>
      );
    }
    
    return <div>{day.getDate()}</div>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          View license renewals on a calendar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>License Calendar</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                components={{
                  Day: renderCalendarDay,
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateLicenses.length === 0 ? (
                <p className="text-muted-foreground">
                  No license renewals on this date.
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedDateLicenses.map((license) => (
                    <div key={license.id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="font-medium">{license.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {license.supplier} • ${license.monthlyCost.toFixed(2)}/mo
                      </div>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-100">
                          {license.department}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coming Up (Next 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRenewals.length === 0 ? (
                <p className="text-muted-foreground">
                  No upcoming license renewals in the next 7 days.
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingRenewals.map((license) => (
                    <div key={license.id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="font-medium">{license.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(license.renewalDate), "MMMM d, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {license.supplier} • ${license.monthlyCost.toFixed(2)}/mo
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
