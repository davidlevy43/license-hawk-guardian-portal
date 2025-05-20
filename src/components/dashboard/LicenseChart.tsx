
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { LicenseStatus } from "@/types";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface LicenseChartProps {
  data: ChartData[];
}

const COLORS = {
  [LicenseStatus.ACTIVE]: "#10B981",
  [LicenseStatus.PENDING]: "#F59E0B",
  [LicenseStatus.EXPIRED]: "#EF4444",
};

const LicenseChart: React.FC<LicenseChartProps> = ({ data }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>License Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip 
                formatter={(value: number) => [`${value} licenses`, ""]}
                labelFormatter={() => ""}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
          {data.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-center">
                <div
                  className="h-3 w-3 rounded-full mr-1"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span>{item.name}</span>
              </div>
              <p className="font-medium">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseChart;
