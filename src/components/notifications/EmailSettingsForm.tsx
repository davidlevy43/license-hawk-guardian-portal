
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
import { API_URL } from "@/services/api/base";

const formSchema = z.object({
  smtpServer: z.string().min(1, "SMTP server is required"),
  smtpPort: z.coerce.number().int().positive("Port must be a positive number"),
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
    defaultValues: emailSettings,
  });

  const onSubmit = async (data: FormValues) => {
    updateEmailSettings(data);
  };

  const sendTestEmail = async () => {
    const formData = form.getValues();
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast.error("אנא תקן את השגיאות בטופס לפני שליחת מייל בדיקה");
      return;
    }
    
    setIsTestingEmail(true);
    
    try {
      console.log("שולח מייל בדיקה עם הגדרות:", formData);
      
      const response = await fetch(`${API_URL}/api/email/send-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          emailSettings: formData,
          testEmailAddress: formData.senderEmail
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`מייל בדיקה נשלח בהצלחה ל-${formData.senderEmail}!`);
        console.log("✅ מייל בדיקה נשלח בהצלחה");
      } else {
        toast.error(`שגיאה בשליחת מייל בדיקה: ${data.error}`);
        console.error("❌ שגיאה בשליחת מייל בדיקה:", data.error);
      }
      
    } catch (error: any) {
      console.error('שגיאה בשליחת מייל בדיקה:', error);
      toast.error(`שגיאה בשליחת מייל בדיקה: ${error.message}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleTestConnection = async () => {
    const formData = form.getValues();
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast.error("אנא תקן את השגיאות בטופס לפני בדיקת החיבור");
      return;
    }
    
    // Save the current form data first
    updateEmailSettings(formData);
    
    try {
      const response = await fetch(`${API_URL}/api/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("בדיקת חיבור הצליחה!");
      } else {
        toast.error(`בדיקת חיבור נכשלה: ${data.error}`);
      }
    } catch (error: any) {
      console.error('שגיאה בבדיקת חיבור:', error);
      toast.error(`שגיאה בבדיקת חיבור: ${error.message}`);
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
                  The address of your email server
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
                  <Input type="number" placeholder="587" {...field} />
                </FormControl>
                <FormDescription>
                  Common ports: 25, 465, 587, 2525
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
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="your-email@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  Usually your email address
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  For Gmail, use an app password
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
                  Email address shown to recipients
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
            {isTestingEmail ? "שולח מייל בדיקה..." : "שלח מייל בדיקה"}
          </Button>
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </Form>
  );
};

export default EmailSettingsForm;
