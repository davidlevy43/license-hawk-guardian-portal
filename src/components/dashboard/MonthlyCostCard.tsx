
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyCostCardProps {
  data: {
    name: string;
    value: number;
  }[];
}

const MonthlyCostCard: React.FC<MonthlyCostCardProps> = ({ data }) => {
  // Calculate total cost (monthly equivalent)
  const totalMonthlyCost = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Cost by Department</span>
          <span className="text-lg">${totalMonthlyCost.toLocaleString()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Monthly Cost"]}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Note: Yearly costs are converted to monthly equivalent (yearly ÷ 12)
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyCostCard;
