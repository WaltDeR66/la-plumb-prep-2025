import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Copy, Share2, TrendingUp, Info } from "lucide-react";
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
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
  });

  // Fetch commission preview
  const { data: preview, isLoading: previewLoading } = useQuery<CommissionPreview>({
    queryKey: ["/api/referrals/commission-preview"],
  });

  useEffect(() => {
    if (stats?.referralCode) {
      setReferralUrl(`${window.location.origin}?ref=${stats.referralCode}`);
    }
  }, [stats]);

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LA Plumb Prep - Louisiana Plumbing Certification",
          text: "Join me on LA Plumb Prep for Louisiana plumbing certification prep!",
          url: referralUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
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

  if (statsLoading || previewLoading) {
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
                    <Button onClick={shareReferralUrl} className="flex-1" data-testid="share-link">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
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