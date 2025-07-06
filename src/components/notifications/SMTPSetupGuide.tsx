import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Info } from "lucide-react";

const SMTPSetupGuide: React.FC = () => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          SMTP allows you to send emails directly from your server using your existing email account.
          Follow these steps to set up SMTP with Gmail.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Step 1: Enable 2-Factor Authentication
            <ExternalLink className="h-4 w-4" />
          </CardTitle>
          <CardDescription>
            Enable 2FA on your Gmail account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Google Account Security
            </a> and enable 2-Factor Authentication if not already enabled.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Generate App Password</CardTitle>
          <CardDescription>
            Create a specific password for this application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Go to <strong>Google Account Settings</strong> → <strong>Security</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            2. Under "Signing in to Google", click <strong>2-Step Verification</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            3. At the bottom, click <strong>App passwords</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            4. Select app: <strong>Mail</strong>, Select device: <strong>Other</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            5. Enter "License Manager" and click <strong>Generate</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            6. Copy the 16-character password generated
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 3: Configure SMTP Settings</CardTitle>
          <CardDescription>
            Use these settings for Gmail SMTP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="bg-muted p-3 rounded-md font-mono text-sm">
            <div><strong>SMTP Server:</strong> smtp.gmail.com</div>
            <div><strong>SMTP Port:</strong> 587 (TLS) or 465 (SSL)</div>
            <div><strong>Username:</strong> your-email@gmail.com</div>
            <div><strong>Password:</strong> [16-character app password]</div>
            <div><strong>Sender Email:</strong> your-email@gmail.com</div>
            <div><strong>Sender Name:</strong> License Manager</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 4: Test Configuration</CardTitle>
          <CardDescription>
            Verify your settings work correctly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Fill in all the SMTP settings in the form above
          </p>
          <p className="text-sm text-muted-foreground">
            2. Click <strong>Test Connection</strong> to verify server connectivity
          </p>
          <p className="text-sm text-muted-foreground">
            3. Click <strong>Send Test Email</strong> to receive a test message
          </p>
          <p className="text-sm text-muted-foreground">
            4. Save the settings once everything works correctly
          </p>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Note:</strong> App passwords are more secure than using your regular password. 
          The system will automatically send notifications daily at 9:00 AM for licenses expiring in 1, 7, or 30 days.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SMTPSetupGuide;