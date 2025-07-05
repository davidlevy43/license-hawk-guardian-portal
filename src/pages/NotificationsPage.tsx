
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import EmailSettingsForm from "@/components/notifications/EmailSettingsForm";
import NotificationTemplateForm from "@/components/notifications/NotificationTemplateForm";
import EmailJSSetupGuide from "@/components/notifications/EmailJSSetupGuide";

const NotificationsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { triggerManualCheck } = useNotification();

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Notifications</h1>
          <p className="text-muted-foreground">
            Configure the email settings and notification templates
          </p>
        </div>
        
        <Button onClick={triggerManualCheck} variant="outline" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Send Notifications Now
        </Button>
      </div>

      <Tabs defaultValue="smtp">
        <TabsList className="mb-6">
          <TabsTrigger value="smtp">EmailJS Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <CardTitle>EmailJS Configuration</CardTitle>
              <CardDescription>
                Configure your EmailJS service to send automated notifications directly from the browser.
                Create an account at emailjs.com and set up a service and template to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize the notification emails sent to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationTemplateForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>EmailJS Setup Guide</CardTitle>
              <CardDescription>
                Step-by-step instructions to configure EmailJS for your notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmailJSSetupGuide />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;
