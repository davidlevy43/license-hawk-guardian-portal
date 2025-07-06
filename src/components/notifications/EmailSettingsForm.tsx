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

const formSchema = z.object({
  smtpServer: z.string().min(1, "SMTP Server is required"),
  smtpPort: z.number().min(1, "SMTP Port is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  senderEmail: z.string().email("Invalid email address"),
  senderName: z.string().min(1, "Sender name is required"),
});

type FormValues = z.infer<typeof formSchema>;

const EmailSettingsForm: React.FC = () => {
  const { emailSettings, updateEmailSettings } = useNotification();
  const [isTestingEmail, setIsTestingEmail] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtpServer: emailSettings.smtpServer || '',
      smtpPort: emailSettings.smtpPort || 587,
      username: emailSettings.username || '',
      password: emailSettings.password || '',
      senderEmail: emailSettings.senderEmail || '',
      senderName: emailSettings.senderName || 'License Manager',
    },
  });

  const onSubmit = async (data: FormValues) => {
    await updateEmailSettings(data);
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
      console.log("Sending test email with SMTP settings:", formData);
      
      // First save the settings
      await updateEmailSettings(formData);
      
      // Send test email to the sender's email
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3001'}/api/email/send-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailSettings: formData,
          testEmailAddress: formData.senderEmail
        })
      });

      if (response.ok) {
        toast.success(`Test email sent successfully to ${formData.senderEmail}!`);
        console.log("✅ Test email sent successfully via SMTP");
      } else {
        const error = await response.json();
        toast.error(`Failed to send test email: ${error.error}`);
        console.error("❌ SMTP error:", error);
      }
      
    } catch (error: any) {
      console.error('Error sending test email via SMTP:', error);
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
    await updateEmailSettings(formData);
    
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`${process.env.VITE_API_URL || 'http://localhost:3001'}/api/email/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success("SMTP connection verified successfully!");
        console.log("✅ SMTP configuration validated");
      } else {
        const error = await response.json();
        toast.error(`Connection test failed: ${error.error}`);
      }
      
    } catch (error: any) {
      console.error('SMTP configuration error:', error);
      toast.error(`Configuration error: ${error.message || 'Invalid SMTP settings'}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="smtpServer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SMTP Server</FormLabel>
                <FormControl>
                  <Input placeholder="smtp.gmail.com" {...field} />
                </FormControl>
                <FormDescription>
                  Your email provider's SMTP server
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="smtpPort"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SMTP Port</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="587" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                  />
                </FormControl>
                <FormDescription>
                  Usually 587 for TLS or 465 for SSL
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username/Email</FormLabel>
                <FormControl>
                  <Input placeholder="your-email@gmail.com" {...field} />
                </FormControl>
                <FormDescription>
                  Your email account username
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password/App Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Your email password or app-specific password
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
            Test Connection
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