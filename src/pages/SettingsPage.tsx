
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const SettingsPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();

  const handleSaveSettings = () => {
    toast.success("Settings saved successfully");
  };
  
  const handleExportData = () => {
    toast.success("Export started. You'll receive a download link shortly.");
  };
  
  const handleResetPassword = () => {
    toast.success("Password reset email sent");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {isAdmin && <TabsTrigger value="system">System</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                View and update your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={currentUser?.username} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={currentUser?.email} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={currentUser?.role} readOnly />
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Security</h3>
                <div className="space-y-4">
                  <Button variant="outline" onClick={handleResetPassword}>
                    Change Password
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for license renewals
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Dashboard Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Show alerts on dashboard for upcoming renewals
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Display</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Compact View</Label>
                      <p className="text-sm text-muted-foreground">
                        Show more items per page in compact format
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings (Admin only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" onClick={handleExportData}>
                        Export License Data
                      </Button>
                      <Button variant="outline">
                        Import License Data
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">System Maintenance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Temporarily disable access for non-admin users
                        </p>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>Save System Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default SettingsPage;
