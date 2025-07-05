import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNotification } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import emailjs from '@emailjs/browser';

const formSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  templateId: z.string().min(1, "Template ID is required"),
  publicKey: z.string().min(1, "Public Key is required"),
  privateKey: z.string().min(1, "Private Key is required"),
  senderEmail: z.string().email("Invalid email address"),
  senderName: z.string().min(1, "Sender name is required"),
});

type FormValues = z.infer<typeof formSchema>;

const EmailSettingsForm: React.FC = () => {
  const { emailSettings, updateEmailSettings } = useNotification();
  const [isTestingEmail, setIsTestingEmail] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emailSettings,
  });

  const onSubmit = async (data: FormValues) => {
    updateEmailSettings(data);
  };

  const sendTestEmail = async () => {
    const formData = form.getValues();
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast.error("Please fix the form errors before sending a test email");
      return;
    }
    
    setIsTestingEmail(true);
    
    try {
      console.log("Sending test email with EmailJS settings:", formData);
      
      // Initialize EmailJS with public key
      emailjs.init(formData.publicKey);
      
      // Test template parameters
      const templateParams = {
        to_email: formData.senderEmail,
        from_name: formData.senderName,
        message: "This is a test email from License Manager to verify EmailJS configuration.",
        subject: "EmailJS Test Email"
      };
      
      const result = await emailjs.send(
        formData.serviceId,
        formData.templateId,
        templateParams,
        formData.publicKey
      );
      
      if (result.status === 200) {
        toast.success(`Test email sent successfully to ${formData.senderEmail}!`);
        console.log("✅ Test email sent successfully via EmailJS");
      } else {
        toast.error("Failed to send test email");
        console.error("❌ EmailJS error:", result);
      }
      
    } catch (error: any) {
      console.error('Error sending test email via EmailJS:', error);
      toast.error(`Error sending test email: ${error.message || 'Unknown error'}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTestConnection = async () => {
    const formData = form.getValues();
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast.error("Please fix the form errors before testing connection");
      return;
    }
    
    // Save the current form data first
    updateEmailSettings(formData);
    
    try {
      // Initialize EmailJS with public key to test connection
      emailjs.init(formData.publicKey);
      
      toast.success("EmailJS connection settings saved successfully!");
      console.log("✅ EmailJS configuration validated");
      
    } catch (error: any) {
      console.error('EmailJS configuration error:', error);
      toast.error(`Configuration error: ${error.message || 'Invalid EmailJS settings'}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EmailJS Service ID</FormLabel>
                <FormControl>
                  <Input placeholder="service_xxxxxxx" {...field} />
                </FormControl>
                <FormDescription>
                  Your EmailJS service ID from dashboard
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EmailJS Template ID</FormLabel>
                <FormControl>
                  <Input placeholder="template_xxxxxxx" {...field} />
                </FormControl>
                <FormDescription>
                  Your EmailJS template ID from dashboard
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publicKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EmailJS Public Key</FormLabel>
                <FormControl>
                  <Input placeholder="user_xxxxxxxxxxxxxxx" {...field} />
                </FormControl>
                <FormDescription>
                  Your EmailJS public key (User ID)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="privateKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>EmailJS Private Key</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Your EmailJS private key (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sender Email</FormLabel>
                <FormControl>
                  <Input placeholder="license-manager@company.com" {...field} />
                </FormControl>
                <FormDescription>
                  Email address for recipients to reply to
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="senderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sender Name</FormLabel>
                <FormControl>
                  <Input placeholder="License Manager" {...field} />
                </FormControl>
                <FormDescription>
                  Name shown to recipients
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleTestConnection}
          >
            Validate Settings
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={sendTestEmail}
            disabled={isTestingEmail}
          >
            {isTestingEmail ? "Sending Test Email..." : "Send Test Email"}
          </Button>
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </Form>
  );
};

export default EmailSettingsForm;
