import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Info } from "lucide-react";

const EmailJSSetupGuide: React.FC = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          EmailJS allows you to send emails directly from your browser without a backend server.
          Follow these steps to set up your EmailJS account.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Step 1: Create EmailJS Account
            <ExternalLink className="h-4 w-4" />
          </CardTitle>
          <CardDescription>
            Sign up for a free account at emailjs.com
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Visit <a href="https://www.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              https://www.emailjs.com
            </a> and create a free account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Add Email Service</CardTitle>
          <CardDescription>
            Connect your Gmail account to EmailJS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Go to <strong>Email Services</strong> in your EmailJS dashboard
          </p>
          <p className="text-sm text-muted-foreground">
            2. Click <strong>Add New Service</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            3. Choose <strong>Gmail</strong> and connect your Google account
          </p>
          <p className="text-sm text-muted-foreground">
            4. Copy the <strong>Service ID</strong> (starts with service_)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Create Email Template</CardTitle>
          <CardDescription>
            Set up the email template for notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Go to <strong>Email Templates</strong> in your dashboard
          </p>
          <p className="text-sm text-muted-foreground">
            2. Click <strong>Create New Template</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            3. Use these template variables in your email:
          </p>
          <div className="bg-muted p-3 rounded-md font-mono text-sm">
            <div>To: {"{{to_email}}"}</div>
            <div>From: {"{{from_name}}"}</div>
            <div>Subject: {"{{subject}}"}</div>
            <div>Message: {"{{message}}"}</div>
          </div>
          <p className="text-sm text-muted-foreground">
            4. Copy the <strong>Template ID</strong> (starts with template_)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 4: Get API Keys</CardTitle>
          <CardDescription>
            Copy your EmailJS public and private keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Go to <strong>Account</strong> → <strong>General</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            2. Copy your <strong>Public Key</strong> (User ID)
          </p>
          <p className="text-sm text-muted-foreground">
            3. Copy your <strong>Private Key</strong> (optional, for additional security)
          </p>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Once you have all the keys, enter them in the EmailJS Settings form above and test the configuration.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EmailJSSetupGuide;