import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Monitor, Smartphone, Wifi, RefreshCw, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";

export default function TechnicalSupport() {
  return (
    <div className="min-h-screen bg-background py-12" data-testid="technical-support-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="tech-support-title">
            Technical Support
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="tech-support-subtitle">
            Get help with technical issues and platform troubleshooting
          </p>
        </div>

        {/* Quick Fixes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Quick Fixes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  <span>Clear Cache & Refresh</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Solves most loading and display issues
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Chrome/Edge:</strong> Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)</p>
                  <p><strong>Firefox:</strong> Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)</p>
                  <p><strong>Safari:</strong> Cmd+Option+R</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-primary" />
                  <span>Check Internet Connection</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Ensure stable internet for best performance
                </p>
                <div className="space-y-2 text-sm">
                  <p>• Test with other websites</p>
                  <p>• Restart your router if needed</p>
                  <p>• Try switching to mobile data temporarily</p>
                  <p>• Contact your ISP if issues persist</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* System Requirements */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">System Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5 text-primary" />
                  <span>Desktop/Laptop</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Supported Browsers</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>• Chrome 90+ (Recommended)</li>
                      <li>• Firefox 88+</li>
                      <li>• Safari 14+</li>
                      <li>• Edge 90+</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Minimum Requirements</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>• 4GB RAM</li>
                      <li>• Stable internet connection</li>
                      <li>• JavaScript enabled</li>
                      <li>• Cookies enabled</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span>Mobile Devices</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">iOS</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>• iOS 14+ (Safari)</li>
                      <li>• Chrome for iOS</li>
                      <li>• iPhone 8+ recommended</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Android</h4>
                    <ul className="text-muted-foreground text-sm space-y-1">
                      <li>• Android 9+ (Chrome)</li>
                      <li>• Firefox for Android</li>
                      <li>• 3GB RAM recommended</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Common Issues */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Common Issues & Solutions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Videos Won't Load or Play</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Check your internet speed (minimum 5 Mbps recommended)</li>
                    <li>Clear browser cache and cookies</li>
                    <li>Disable browser extensions temporarily</li>
                    <li>Try a different browser or incognito/private mode</li>
                    <li>Update your browser to the latest version</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Login Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Verify your email and password are correct</li>
                    <li>Use "Forgot Password" to reset if needed</li>
                    <li>Clear browser data and try again</li>
                    <li>Check if Caps Lock is on</li>
                    <li>Try logging in from a different device or browser</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Payment or Subscription Issues</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Verify your payment method is valid and has sufficient funds</li>
                    <li>Check if your billing address matches your card</li>
                    <li>Try a different payment method</li>
                    <li>Contact your bank if the card is being declined</li>
                    <li>Email support@laplumbprep.com for billing assistance</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Slow Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Close other browser tabs and applications</li>
                    <li>Clear browser cache and restart browser</li>
                    <li>Check for browser updates</li>
                    <li>Restart your computer</li>
                    <li>Test internet speed (minimum 5 Mbps recommended)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Still Need Help */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              <span>Still Need Help?</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              If these solutions don't resolve your issue, our technical support team is here to help.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">When Contacting Support, Include:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Your browser and version</li>
                  <li>• Operating system (Windows, Mac, etc.)</li>
                  <li>• Description of the problem</li>
                  <li>• Steps you've already tried</li>
                  <li>• Screenshots if applicable</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> support@laplumbprep.com</p>
                  <p><strong>Response Time:</strong> 2 business days</p>
                  <p><strong>Priority:</strong> Technical issues receive high priority</p>
                </div>
                <Link href="/contact">
                  <Button className="mt-4" data-testid="contact-support-button">
                    Contact Technical Support
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}