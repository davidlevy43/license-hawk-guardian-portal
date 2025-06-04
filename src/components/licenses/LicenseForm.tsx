
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
  
  console.log("🔍 Form initialized with initial data:", {
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

  // Debug form submission
  const handleSubmit = (data: FormValues) => {
    console.log("🔍 Form submission - Full data:", data);
    console.log("🔍 Form submission - Cost type:", data.costType, typeof data.costType);
    console.log("🔍 Form submission - Payment method:", data.paymentMethod, typeof data.paymentMethod);
    console.log("🔍 Form submission - Credit card digits:", data.creditCardDigits);
    onSubmit(data);
  };

  // Debug form values in real time
  const watchedValues = form.watch();
  console.log("🔍 Current form values:", {
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
