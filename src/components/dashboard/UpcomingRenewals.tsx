
import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { License, LicenseStatus } from "@/types";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UpcomingRenewalsProps {
  licenses: License[];
}

const UpcomingRenewals: React.FC<UpcomingRenewalsProps> = ({ licenses }) => {
  const navigate = useNavigate();
  
  // Find licenses with upcoming renewals (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const upcomingRenewals = licenses
    .filter(
      (license) =>
        license.status !== LicenseStatus.EXPIRED &&
        new Date(license.renewalDate) <= thirtyDaysFromNow
    )
    .sort(
      (a, b) =>
        new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    )
    .slice(0, 5);

  const calculateDaysRemaining = (renewalDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const renewal = new Date(renewalDate);
    renewal.setHours(0, 0, 0, 0);
    
    const diffTime = renewal.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBadgeColor = (daysRemaining: number) => {
    if (daysRemaining <= 7) return "bg-red-100 text-red-800 border-red-200";
    if (daysRemaining <= 14) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Upcoming Renewals
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/licenses")}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {upcomingRenewals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No upcoming renewals in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingRenewals.map((license) => {
              const daysRemaining = calculateDaysRemaining(license.renewalDate);
              return (
                <div
                  key={license.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="font-medium">{license.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{license.supplier}</span>
                      <span className="mx-1">•</span>
                      <span>${license.monthlyCost.toFixed(2)}/mo</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge
                      variant="outline"
                      className={getBadgeColor(daysRemaining)}
                    >
                      {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
                    </Badge>
                    <span className="text-xs text-muted-foreground mt-1">
                      {format(new Date(license.renewalDate), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingRenewals;
