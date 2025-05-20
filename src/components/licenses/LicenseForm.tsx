import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { License, LicenseType, LicenseStatus, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface LicenseFormProps {
  initialData?: License;
  onSubmit: (data: z.infer<typeof licenseFormSchema>) => void;
  onCancel: () => void;
}

const licenseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(LicenseType),
  department: z.string().min(1, "Department is required"),
  supplier: z.string().min(1, "Supplier is required"),
  startDate: z.date(),
  renewalDate: z.date(),
  monthlyCost: z.coerce.number().min(0, "Monthly cost must be 0 or greater"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  serviceOwner: z.string().min(1, "Service owner is required"),
  status: z.nativeEnum(LicenseStatus),
  notes: z.string().optional(),
  creditCardDigits: z.string().max(4).optional(),
});

type FormValues = z.infer<typeof licenseFormSchema>;

const LicenseForm: React.FC<LicenseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: initialData || {
      name: "",
      type: LicenseType.SOFTWARE,
      department: "",
      supplier: "",
      startDate: new Date(),
      renewalDate: new Date(),
      monthlyCost: 0,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      serviceOwner: "",
      status: LicenseStatus.ACTIVE,
      notes: "",
      creditCardDigits: "",
    },
  });

  // Show credit card digits field only when payment method is credit card
  const showCreditCardField = form.watch("paymentMethod") === PaymentMethod.CREDIT_CARD;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Windows Server 2022" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(LicenseType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="IT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <Input placeholder="Microsoft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Dates and Costs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dates and Costs</h3>
            
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
              name="monthlyCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Cost ($)</FormLabel>
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
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PaymentMethod).map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showCreditCardField && (
              <FormField
                control={form.control}
                name="creditCardDigits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Card (Last 4 digits)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234"
                        maxLength={4}
                        {...field}
                        onChange={(e) => {
                          // Only allow numbers
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 4) {
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
        </div>
        
        {/* Additional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Additional Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="serviceOwner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Owner</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(LicenseStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional information about this license..."
                    {...field}
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? "Update License" : "Add License"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LicenseForm;
