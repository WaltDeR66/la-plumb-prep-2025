import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Copy, TrendingUp, Info, MessageSquare, Instagram, Facebook, Twitter, Settings, Mail } from "lucide-react";
import { SiLinkedin, SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";

interface ReferralStats {
  referralCode: string;
  planTier: "basic" | "professional" | "master";
  totalReferrals: number;
  earnings: {
    total: number;
    unpaid: number;
    paid: number;
  };
  recentReferrals: any[];
}

interface CommissionPreview {
  referrerTier: string;
  commissionPreviews: {
    basic: { eligibleTier: string; eligiblePrice: number; commissionAmount: number };
    professional: { eligibleTier: string; eligiblePrice: number; commissionAmount: number };
    master: { eligibleTier: string; eligiblePrice: number; commissionAmount: number };
  };
  note: string;
}

export default function Referrals() {
  const { toast } = useToast();
  const [referralUrl, setReferralUrl] = useState("");

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
    retry: (failureCount, error: any) => {
      // Retry 401 errors up to 5 times in case user just logged in
      if (error?.message?.includes('401') && failureCount < 5) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 0, // Always consider data stale to force refresh
    gcTime: 0, // Don't cache failed responses
  });

  // Fetch commission preview
  const { data: preview, isLoading: previewLoading, refetch: refetchPreview } = useQuery<CommissionPreview>({
    queryKey: ["/api/referrals/commission-preview"],
    retry: (failureCount, error: any) => {
      // Retry 401 errors up to 5 times in case user just logged in
      if (error?.message?.includes('401') && failureCount < 5) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 0, // Always consider data stale to force refresh
    gcTime: 0, // Don't cache failed responses
  });

  // Fetch monthly earnings summary
  const { data: monthlyEarnings, isLoading: monthlyLoading, refetch: refetchMonthly } = useQuery({
    queryKey: ["/api/referrals/monthly-earnings-summary"],
    retry: (failureCount, error: any) => {
      // Retry 401 errors up to 5 times in case user just logged in
      if (error?.message?.includes('401') && failureCount < 5) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 0, // Always consider data stale to force refresh
    gcTime: 0, // Don't cache failed responses
  });

  useEffect(() => {
    if (stats?.referralCode) {
      setReferralUrl(`${window.location.origin}?ref=${stats.referralCode}`);
    }
  }, [stats]);

  // Add a manual refresh function for when data is missing
  const refreshAllData = () => {
    refetchStats();
    refetchPreview();
    refetchMonthly();
  };

  const copyReferralUrl = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy referral link",
        variant: "destructive",
      });
    }
  };

  const shareReferralUrl = async () => {
    // Force use of the custom email template instead of Web Share API for email
    const template = {
      text: `🔧 Just passed my Louisiana plumbing exam with LA Plumb Prep! Their practice tests and AI mentor were game-changers. \n\nIf you're studying for your Louisiana plumbing certification, check them out: ${referralUrl} \n\n#LouisianaPlumber #PlumbingCertification #StudySuccess`
    };
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LA Plumb Prep - Louisiana Plumbing Certification",
          text: "Join me on LA Plumb Prep for Louisiana plumbing certification prep!",
          url: referralUrl,
        });
      } catch (error) {
        // User cancelled or error occurred, fallback to copy
        copyReferralUrl();
      }
    } else {
      copyReferralUrl();
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "basic":
        return "bg-blue-100 text-blue-800";
      case "professional":
        return "bg-purple-100 text-purple-800";
      case "master":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierDisplayName = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  // Social media post templates
  const getPostTemplates = (referralCode: string, referralUrl: string) => [
    {
      id: "success-story",
      title: "Success Story",
      platform: "General",
      icon: MessageSquare,
      text: `🔧 Just passed my Louisiana plumbing exam with LA Plumb Prep! Their practice tests and AI mentor were game-changers. \n\nIf you're studying for your Louisiana plumbing certification, check them out: ${referralUrl} \n\n#LouisianaPlumber #PlumbingCertification #StudySuccess`,
      hashtags: "#LouisianaPlumber #PlumbingCertification #StudySuccess"
    },
    {
      id: "professional-tip",
      title: "Professional Tip",
      platform: "LinkedIn",
      icon: MessageSquare,
      text: `💡 Pro tip for Louisiana plumbers: LA Plumb Prep's AI-powered tools have revolutionized how I prepare for certifications and handle code compliance on job sites.\n\nTheir platform covers everything from Journeyman prep to specialized certifications. Worth checking out: ${referralUrl}\n\n#PlumbingProfessional #LouisianaPlumbing #ContinuingEducation`,
      hashtags: "#PlumbingProfessional #LouisianaPlumbing #ContinuingEducation"
    },
    {
      id: "recommendation",
      title: "Colleague Recommendation",
      platform: "Facebook",
      icon: MessageSquare,
      text: `🚰 Fellow plumbers! I've been using LA Plumb Prep for my Louisiana certifications and it's been incredible. The practice tests mirror the real exams perfectly, and their AI mentor answers any code questions instantly.\n\nDefinitely recommend checking it out if you're serious about advancing your plumbing career: ${referralUrl}`,
      hashtags: ""
    },
    {
      id: "quick-tip",
      title: "Quick Study Tip",
      platform: "Twitter/X",
      icon: MessageSquare,
      text: `🔧 Louisiana plumbers: LA Plumb Prep's AI mentor is like having a master plumber available 24/7 for code questions! Game changer for exam prep 💯\n\n${referralUrl}\n\n#PlumbingLife #LouisianaPlumber #ExamPrep`,
      hashtags: "#PlumbingLife #LouisianaPlumber #ExamPrep"
    }
  ];

  const shareToSocialMedia = (template: any, platform: string) => {
    console.log('shareToSocialMedia called with:', { template, platform, referralUrl });
    const baseUrls = {
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=',
      twitter: 'https://twitter.com/intent/tweet?text=',
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=',
      whatsapp: 'https://wa.me/?text='
    };

    let shareUrl = '';
    
    switch (platform.toLowerCase()) {
      case 'facebook':
        shareUrl = `${baseUrls.facebook}${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(template.text)}`;
        break;
      case 'twitter':
        shareUrl = `${baseUrls.twitter}${encodeURIComponent(template.text)}`;
        break;
      case 'linkedin':
        shareUrl = `${baseUrls.linkedin}${encodeURIComponent(referralUrl)}&summary=${encodeURIComponent(template.text)}`;
        break;
      case 'whatsapp':
        shareUrl = `${baseUrls.whatsapp}${encodeURIComponent(template.text)}`;
        break;
      case 'email':
        const emailSubject = `Check out LA Plumb Prep - Louisiana Plumbing Certification`;
        const emailBody = `Hi there!

I wanted to share something that's been really helpful for my plumbing career:

${template.text}

LA Plumb Prep is Louisiana's premier plumbing certification platform with:
• Complete Louisiana Plumbing Code preparation courses
• AI-powered mentor and code checker  
• Practice exams that mirror the real tests
• Professional tools and calculators
• Job placement assistance

They're offering special beta pricing right now, so it's a great time to check it out!

Best regards,
[Your name]`;
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        console.log('Generated mailto URL:', mailtoUrl);
        
        // Try multiple methods to open email
        try {
          // Method 1: Direct window.location
          window.location.href = mailtoUrl;
          console.log('Method 1: window.location.href attempted');
        } catch (error) {
          console.error('Method 1 failed:', error);
          try {
            // Method 2: window.open
            window.open(mailtoUrl, '_blank');
            console.log('Method 2: window.open attempted');
          } catch (error2) {
            console.error('Method 2 failed:', error2);
            // Method 3: Copy to clipboard as fallback
            navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`);
            toast({
              title: "Email Content Copied",
              description: "Email couldn't open automatically. Content has been copied to your clipboard - paste it into your email app.",
            });
          }
        }
        return;
      default:
        // Copy to clipboard as fallback
        navigator.clipboard.writeText(template.text);
        toast({
          title: "Copied!",
          description: "Post template copied to clipboard",
        });
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyTemplate = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Post template copied to clipboard",
    });
  };

  if (statsLoading || previewLoading || monthlyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4" data-testid="referral-header">
              Referral Program
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Earn money by referring plumbers to LA Plumb Prep. Commission is capped at your plan tier or lower.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Stats Cards */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="total-earnings">
                          ${stats?.earnings.total.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="total-referrals">
                          {stats?.totalReferrals || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-muted-foreground">Unpaid</p>
                        <p className="text-2xl font-bold text-foreground" data-testid="unpaid-earnings">
                          ${stats?.earnings.unpaid.toFixed(2) || "0.00"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Commission Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Your Commission Rates
                    <Badge className={getTierBadgeColor(stats?.planTier || "basic")}>
                      {getTierDisplayName(stats?.planTier || "basic")} Plan
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                      {preview?.note}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {preview && Object.entries(preview.commissionPreviews).map(([tier, commission]) => (
                        <div key={tier} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{getTierDisplayName(tier)}</span>
                            <Badge variant="outline" className="text-xs">
                              ${commission.commissionAmount.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            10% of ${commission.eligiblePrice}/month
                          </div>
                          {commission.eligibleTier !== tier && (
                            <div className="text-xs text-orange-600 mt-1">
                              Capped at {getTierDisplayName(commission.eligibleTier)} tier
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Recurring Earnings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Monthly Recurring Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Total Monthly</div>
                        <div className="text-2xl font-bold text-green-600">
                          ${(monthlyEarnings as any)?.totalMonthlyEarnings?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="text-sm text-muted-foreground">Unpaid Monthly</div>
                        <div className="text-2xl font-bold text-orange-600">
                          ${(monthlyEarnings as any)?.unpaidMonthlyEarnings?.toFixed(2) || "0.00"}
                        </div>
                      </div>
                    </div>
                    
                    {(monthlyEarnings as any)?.monthlyBreakdown && (monthlyEarnings as any).monthlyBreakdown.length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">Monthly Breakdown:</div>
                        {(monthlyEarnings as any).monthlyBreakdown.slice(0, 6).map((month: any) => (
                          <div key={month.month} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">
                                {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long' 
                                })}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {month.count} commission{month.count !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                ${month.total.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {month.unpaid > 0 ? `$${month.unpaid.toFixed(2)} unpaid` : 'All paid'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <div className="text-sm">
                          🚀 <strong>Recurring Monthly Earnings!</strong>
                        </div>
                        <div className="text-xs mt-1">
                          When your referrals upgrade their plans, you earn monthly commissions based on your tier!
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Referrals */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.recentReferrals && stats.recentReferrals.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentReferrals.map((referral, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">
                              {getTierDisplayName(referral.referredPlanTier)} Plan Referral
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(referral.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              +${Number(referral.commissionAmount).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {referral.isPaid ? "Paid" : "Pending"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No referrals yet. Start sharing your link to earn commissions!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Share Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Share Your Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="referral-code">Your Referral Code</Label>
                    <Input
                      id="referral-code"
                      value={stats?.referralCode || ""}
                      readOnly
                      className="font-mono"
                      data-testid="referral-code"
                    />
                  </div>

                  <div>
                    <Label htmlFor="referral-url">Referral Link</Label>
                    <Input
                      id="referral-url"
                      value={referralUrl}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="referral-url"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={copyReferralUrl} variant="outline" className="flex-1" data-testid="copy-link">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button onClick={() => {
                      console.log('Email button clicked, referralUrl:', referralUrl);
                      shareToSocialMedia({
                        text: `🔧 Just passed my Louisiana plumbing exam with LA Plumb Prep! Their practice tests and AI mentor were game-changers. \n\nIf you're studying for your Louisiana plumbing certification, check them out: ${referralUrl} \n\n#LouisianaPlumber #PlumbingCertification #StudySuccess`
                      }, 'email');
                    }} className="flex-1" data-testid="email-link">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    {!stats?.referralCode && (
                      <Button
                        variant="secondary"
                        onClick={refreshAllData}
                        data-testid="refresh-data"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Load Data
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Post Templates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Social Media Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Ready-to-share posts with your referral link embedded. Click to share or copy!
                    </p>
                    
                    {getPostTemplates(stats?.referralCode || "DEMO123", referralUrl).map((template) => (
                      <div key={template.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-muted-foreground">{template.platform}</p>
                          </div>
                          <template.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded text-xs">
                          <div className="whitespace-pre-wrap line-clamp-4">{template.text}</div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => copyTemplate(template.text)}
                            className="flex-1"
                            data-testid={`copy-template-${template.id}`}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                          
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              onClick={() => shareToSocialMedia(template, 'email')}
                              className="px-2"
                              data-testid={`share-email-${template.id}`}
                              title="Share via Email"
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => shareToSocialMedia(template, 'facebook')}
                              className="px-2"
                              data-testid={`share-facebook-${template.id}`}
                            >
                              <Facebook className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => shareToSocialMedia(template, 'twitter')}
                              className="px-2"
                              data-testid={`share-twitter-${template.id}`}
                            >
                              <Twitter className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => shareToSocialMedia(template, 'linkedin')}
                              className="px-2"
                              data-testid={`share-linkedin-${template.id}`}
                            >
                              <SiLinkedin className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => shareToSocialMedia(template, 'whatsapp')}
                              className="px-2"
                              data-testid={`share-whatsapp-${template.id}`}
                            >
                              <SiWhatsapp className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Settings */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Payment Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-700 mb-4">
                    Configure your payment method, set minimum payout amounts, and manage your earnings.
                  </p>
                  <Link href="/payment-settings">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" data-testid="payment-settings">
                      Manage Payments
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Upgrade CTA */}
              {stats?.planTier === "basic" && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-purple-800">Increase Your Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-700 mb-4">
                      Upgrade to Professional or Master to earn higher commissions on referrals!
                    </p>
                    <Link href="/pricing">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700" data-testid="upgrade-plan">
                        Upgrade Plan
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* How It Works */}
              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                    <div>Share your referral link with other plumbers</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                    <div>They sign up using your link</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                    <div>Earn 10% commission (capped at your plan tier)</div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
                    <div>Get paid monthly via your preferred method</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}