
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  enabled: z.boolean(),
  thirtyDays: z.string().min(1, "Template is required"),
  sevenDays: z.string().min(1, "Template is required"),
  oneDay: z.string().min(1, "Template is required"),
});

type FormValues = z.infer<typeof formSchema>;

const NotificationTemplateForm: React.FC = () => {
  const { notificationSettings, updateNotificationSettings } = useNotification();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enabled: notificationSettings.enabled,
      thirtyDays: notificationSettings.emailTemplates.thirtyDays,
      sevenDays: notificationSettings.emailTemplates.sevenDays,
      oneDay: notificationSettings.emailTemplates.oneDay,
    },
  });

  const onSubmit = (data: FormValues) => {
    const { enabled, thirtyDays, sevenDays, oneDay } = data;
    updateNotificationSettings({
      enabled,
      emailTemplates: {
        thirtyDays,
        sevenDays,
        oneDay,
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                <FormDescription>
                  Turn on automatic email notifications for license renewals
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="pt-4">
          <h3 className="text-lg font-medium">Email Templates</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Customize the email notification messages sent to license owners. You can use the following
            placeholders: {"{LICENSE_NAME}"}, {"{EXPIRY_DATE}"}, {"{DEPARTMENT}"}, 
            {"{SUPPLIER}"}, {"{COST}"}, {"{SERVICE_OWNER}"}, {"{CARD_LAST_4}"}
          </p>
          
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <p className="text-amber-700">
              <strong>Note:</strong> Notifications will be sent to the email address of the service owner specified in each license.
            </p>
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="thirtyDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>30 Days Before Expiry</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your license {LICENSE_NAME} will expire in 30 days..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sevenDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>7 Days Before Expiry</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="REMINDER: Your license {LICENSE_NAME} will expire in 7 days..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="oneDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>1 Day Before Expiry</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="URGENT: Your license {LICENSE_NAME} expires tomorrow..."
                      {...field}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Save Templates</Button>
        </div>
      </form>
    </Form>
  );
};

export default NotificationTemplateForm;
