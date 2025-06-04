import React from "react";
import { Control, UseFormWatch } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { PaymentMethod, CostType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DatesAndCostsSectionProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
}

const DatesAndCostsSection: React.FC<DatesAndCostsSectionProps> = ({ control, watch }) => {
  // Watch the payment method to show/hide credit card field
  const paymentMethod = watch("paymentMethod");
  const costType = watch("costType");
  
  console.log("🔍 DatesAndCostsSection - Current values:", {
    paymentMethod,
    costType,
    showCreditCard: paymentMethod === PaymentMethod.CREDIT_CARD
  });

  // Get cost label based on cost type
  const getCostLabel = () => {
    switch (costType) {
      case CostType.MONTHLY:
        return "עלות חודשית ($)";
      case CostType.YEARLY:
        return "עלות שנתית ($)";
      case CostType.ONE_TIME:
        return "עלות חד פעמית ($)";
      default:
        return "עלות ($)";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Dates and Costs</h3>
      
      <FormField
        control={control}
        name="startDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Start Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="renewalDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Renewal Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="costType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>סוג חיוב</FormLabel>
            <Select
              onValueChange={(value) => {
                console.log("🔍 Cost type changing to:", value);
                field.onChange(value);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג חיוב" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={CostType.MONTHLY}>חודשי</SelectItem>
                <SelectItem value={CostType.YEARLY}>שנתי</SelectItem>
                <SelectItem value={CostType.ONE_TIME}>חד פעמי</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="monthlyCost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{getCostLabel()}</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="0.00"
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="paymentMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>אמצעי תשלום</FormLabel>
            <Select
              onValueChange={(value) => {
                console.log("🔍 Payment method changing to:", value);
                field.onChange(value);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="בחר אמצעי תשלום" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.values(PaymentMethod).map((method) => (
                  <SelectItem key={method} value={method}>
                    {method === PaymentMethod.CREDIT_CARD ? "כרטיס אשראי" :
                     method === PaymentMethod.BANK_TRANSFER ? "העברה בנקאית" :
                     method === PaymentMethod.PURCHASE_ORDER ? "הזמנת רכש" :
                     method === PaymentMethod.PAYPAL ? "PayPal" :
                     method.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {paymentMethod === PaymentMethod.CREDIT_CARD && (
        <FormField
          control={control}
          name="creditCardDigits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>כרטיס אשראי (4 ספרות אחרונות)</FormLabel>
              <FormControl>
                <Input
                  placeholder="1234"
                  maxLength={4}
                  {...field}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    if (value.length <= 4) {
                      console.log("🔍 Credit card digits changed to:", value);
                      field.onChange(value);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default DatesAndCostsSection;
