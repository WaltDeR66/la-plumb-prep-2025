import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Settings, Mail, Shield, DollarSign, Users, AlertCircle, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function SystemSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Email Settings
    emailNotifications: true,
    marketingEmails: false,
    betaFeedbackReminders: true,
    enrollmentNotifications: true,
    
    // Platform Settings
    maintenanceMode: false,
    newUserRegistration: true,
    betaProgram: true,
    referralProgram: true,
    
    // Payment Settings
    stripeTestMode: false,
    freeTrialDays: 7,
    cancellationPolicy: "immediate",
    refundPolicy: "30-days",
    
    // Course Settings
    coursePreview: true,
    autoEnrollment: false,
    courseCertificates: true,
    aiMentorAccess: true,
    
    // Security Settings
    passwordMinLength: 8,
    sessionTimeout: 24,
    twoFactorAuth: false,
    ipWhitelist: ""
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Here you would save to your API
      // await apiRequest("POST", "/api/admin/settings", settings);
      toast({
        title: "Settings Saved",
        description: "All system settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="settings-title">System Settings</h1>
            <p className="text-muted-foreground">
              Configure platform settings, notifications, and integrations
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email & Notifications
              </CardTitle>
              <CardDescription>
                Configure automated emails and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">System Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send automated system emails to users</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">Send promotional and marketing emails</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => updateSetting("marketingEmails", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="beta-reminders">Beta Feedback Reminders</Label>
                  <p className="text-sm text-muted-foreground">Monthly reminders for beta testers</p>
                </div>
                <Switch
                  id="beta-reminders"
                  checked={settings.betaFeedbackReminders}
                  onCheckedChange={(checked) => updateSetting("betaFeedbackReminders", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enrollment-notifications">Enrollment Notifications</Label>
                  <p className="text-sm text-muted-foreground">Welcome emails and course access notifications</p>
                </div>
                <Switch
                  id="enrollment-notifications"
                  checked={settings.enrollmentNotifications}
                  onCheckedChange={(checked) => updateSetting("enrollmentNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Platform Configuration
              </CardTitle>
              <CardDescription>
                General platform settings and feature toggles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Temporarily disable public access</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="maintenance-mode"
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting("maintenanceMode", checked)}
                  />
                  {settings.maintenanceMode && <Badge variant="destructive">Active</Badge>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-registration">New User Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new users to create accounts</p>
                </div>
                <Switch
                  id="new-registration"
                  checked={settings.newUserRegistration}
                  onCheckedChange={(checked) => updateSetting("newUserRegistration", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="beta-program">Beta Testing Program</Label>
                  <p className="text-sm text-muted-foreground">Enable beta tester features and feedback collection</p>
                </div>
                <Switch
                  id="beta-program"
                  checked={settings.betaProgram}
                  onCheckedChange={(checked) => updateSetting("betaProgram", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="referral-program">Referral Program</Label>
                  <p className="text-sm text-muted-foreground">Enable user referrals and commission tracking</p>
                </div>
                <Switch
                  id="referral-program"
                  checked={settings.referralProgram}
                  onCheckedChange={(checked) => updateSetting("referralProgram", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment & Billing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment & Billing
              </CardTitle>
              <CardDescription>
                Configure payment processing and billing policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="stripe-test">Stripe Test Mode</Label>
                  <p className="text-sm text-muted-foreground">Use Stripe test environment for payments</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="stripe-test"
                    checked={settings.stripeTestMode}
                    onCheckedChange={(checked) => updateSetting("stripeTestMode", checked)}
                  />
                  {settings.stripeTestMode && <Badge variant="outline">Test Mode</Badge>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial-days">Free Trial Days</Label>
                  <Input
                    id="trial-days"
                    type="number"
                    value={settings.freeTrialDays}
                    onChange={(e) => updateSetting("freeTrialDays", parseInt(e.target.value))}
                    min="0"
                    max="30"
                  />
                </div>

                <div>
                  <Label htmlFor="cancellation-policy">Cancellation Policy</Label>
                  <Select 
                    value={settings.cancellationPolicy}
                    onValueChange={(value) => updateSetting("cancellationPolicy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="end-of-period">End of Billing Period</SelectItem>
                      <SelectItem value="30-days">30 Days Notice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Access
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password-length">Minimum Password Length</Label>
                  <Input
                    id="password-length"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => updateSetting("passwordMinLength", parseInt(e.target.value))}
                    min="6"
                    max="20"
                  />
                </div>

                <div>
                  <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value))}
                    min="1"
                    max="168"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="two-factor"
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => updateSetting("twoFactorAuth", checked)}
                  />
                  {settings.twoFactorAuth && <Badge variant="default">Enabled</Badge>}
                </div>
              </div>

              <div>
                <Label htmlFor="ip-whitelist">IP Whitelist (Admin Access)</Label>
                <Textarea
                  id="ip-whitelist"
                  placeholder="Enter IP addresses, one per line (optional)"
                  value={settings.ipWhitelist}
                  onChange={(e) => updateSetting("ipWhitelist", e.target.value)}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to allow access from any IP address
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save All Settings"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}