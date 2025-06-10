
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { License, LicenseType, LicenseStatus, PaymentMethod, CostType } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Form } from "@/components/ui/form";
import BasicInformationSection from "./sections/BasicInformationSection";
import DatesAndCostsSection from "./sections/DatesAndCostsSection";
import AdditionalInformationSection from "./sections/AdditionalInformationSection";
import FormActions from "./sections/FormActions";

interface LicenseFormProps {
  initialData?: License;
  onSubmit: (data: z.infer<typeof licenseFormSchema>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const licenseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(LicenseType),
  department: z.string().min(1, "Department is required"),
  supplier: z.string().min(1, "Supplier is required"),
  startDate: z.date(),
  renewalDate: z.date(),
  monthlyCost: z.coerce.number().min(0, "Cost must be 0 or greater"),
  costType: z.nativeEnum(CostType),
  paymentMethod: z.nativeEnum(PaymentMethod),
  serviceOwner: z.string().min(1, "Service owner is required"),
  serviceOwnerEmail: z.string().email("Please enter a valid email address").min(1, "Service owner email is required"),
  status: z.nativeEnum(LicenseStatus),
  notes: z.string().optional(),
  creditCardDigits: z.string().max(4).optional(),
});

type FormValues = z.infer<typeof licenseFormSchema>;

const LicenseForm: React.FC<LicenseFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { currentUser } = useAuth();
  
  console.log("🔍 FORM INIT - Initial data received:", {
    costType: initialData?.costType,
    paymentMethod: initialData?.paymentMethod,
    creditCardDigits: initialData?.creditCardDigits
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || LicenseType.SOFTWARE,
      department: initialData?.department || "",
      supplier: initialData?.supplier || "",
      startDate: initialData?.startDate || new Date(),
      renewalDate: initialData?.renewalDate || new Date(),
      monthlyCost: initialData?.monthlyCost || 0,
      costType: initialData?.costType || CostType.MONTHLY,
      paymentMethod: initialData?.paymentMethod || PaymentMethod.CREDIT_CARD,
      serviceOwner: initialData?.serviceOwner || "",
      serviceOwnerEmail: initialData?.serviceOwnerEmail || currentUser?.email || "",
      status: initialData?.status || LicenseStatus.ACTIVE,
      notes: initialData?.notes || "",
      creditCardDigits: initialData?.creditCardDigits || "",
    },
    mode: "onChange",
  });

  // Fixed form submission to ensure costType is correctly sent
  const handleSubmit = (data: FormValues) => {
    console.log("🔍 ✅ FIXED Form submission - Raw form data:", data);
    console.log("🔍 ✅ FIXED Form submission - Cost type details:", {
      costType: data.costType,
      costTypeValue: data.costType,
      costTypeEnum: CostType[data.costType as keyof typeof CostType],
      isMonthly: data.costType === CostType.MONTHLY,
      isYearly: data.costType === CostType.YEARLY,
      isOneTime: data.costType === CostType.ONE_TIME
    });
    
    // ✅ FIXED: Ensure the form data contains the exact enum values
    const submissionData = {
      ...data,
      costType: data.costType, // This should already be the correct enum value
      paymentMethod: data.paymentMethod, // This should already be the correct enum value
    };
    
    console.log("🔍 ✅ FIXED Final submission data:", submissionData);
    onSubmit(submissionData);
  };

  // Debug form values in real time
  const watchedValues = form.watch();
  console.log("🔍 FORM WATCH - Current values:", {
    costType: watchedValues.costType,
    paymentMethod: watchedValues.paymentMethod,
    creditCardDigits: watchedValues.creditCardDigits
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BasicInformationSection control={form.control} />
          <DatesAndCostsSection control={form.control} watch={form.watch} />
        </div>
        
        <AdditionalInformationSection control={form.control} />
        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} initialData={initialData} />
      </form>
    </Form>
  );
};

export default LicenseForm;
