
import React, { useMemo } from "react";
import { useLicenses } from "@/context/LicenseContext";
import { LicenseStatus } from "@/types";
import { Database, Clock, AlertCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import LicenseChart from "@/components/dashboard/LicenseChart";
import UpcomingRenewals from "@/components/dashboard/UpcomingRenewals";
import MonthlyCostCard from "@/components/dashboard/MonthlyCostCard";

const Dashboard: React.FC = () => {
  const { licenses, isLoading } = useLicenses();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!licenses.length) {
      return {
        totalLicenses: 0,
        activeLicenses: 0,
        pendingRenewal: 0,
        expiredLicenses: 0,
        totalMonthlyCost: 0,
      };
    }

    return {
      totalLicenses: licenses.length,
      activeLicenses: licenses.filter(
        (license) => license.status === LicenseStatus.ACTIVE
      ).length,
      pendingRenewal: licenses.filter(
        (license) => license.status === LicenseStatus.PENDING
      ).length,
      expiredLicenses: licenses.filter(
        (license) => license.status === LicenseStatus.EXPIRED
      ).length,
      totalMonthlyCost: licenses.reduce((acc, license) => acc + license.monthlyCost, 0),
    };
  }, [licenses]);

  // Prepare data for charts
  const chartData = useMemo(
    () => [
      {
        name: "Active",
        value: stats.activeLicenses,
        color: "#10B981",
      },
      {
        name: "Pending Renewal",
        value: stats.pendingRenewal,
        color: "#F59E0B",
      },
      {
        name: "Expired",
        value: stats.expiredLicenses,
        color: "#EF4444",
      },
    ],
    [stats]
  );

  // Prepare data for department cost chart
  const departmentCostData = useMemo(() => {
    const departmentCosts: Record<string, number> = {};

    licenses.forEach((license) => {
      if (!departmentCosts[license.department]) {
        departmentCosts[license.department] = 0;
      }
      departmentCosts[license.department] += license.monthlyCost;
    });

    return Object.entries(departmentCosts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [licenses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your license management system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Licenses"
          value={stats.totalLicenses}
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          title="Active Licenses"
          value={stats.activeLicenses}
          description={`${Math.round((stats.activeLicenses / stats.totalLicenses) * 100) || 0}% of total`}
          icon={<Database className="h-4 w-4" />}
        />
        <StatCard
          title="Pending Renewal"
          value={stats.pendingRenewal}
          description="Due in the next 30 days"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Monthly Cost"
          value={`$${stats.totalMonthlyCost.toLocaleString()}`}
          description="Total monthly cost for all licenses"
          trend={{ value: 4.5, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <LicenseChart data={chartData} />
        <MonthlyCostCard data={departmentCostData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <UpcomingRenewals licenses={licenses} />
        </div>
        <div className="space-y-6">
          <div className="border rounded-md p-4 bg-yellow-50">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Attention Needed</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {stats.pendingRenewal} licenses are due for renewal in the next 30 days. 
                  Review them in the Licenses section.
                </p>
              </div>
            </div>
          </div>
          
          <div className="border rounded-md p-4 bg-red-50">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Expired Licenses</h3>
                <p className="text-sm text-red-700 mt-1">
                  {stats.expiredLicenses} licenses have expired and need immediate attention.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
