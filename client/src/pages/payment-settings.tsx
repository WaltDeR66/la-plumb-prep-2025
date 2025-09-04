import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, CreditCard, User, ArrowLeft, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface PaymentSettings {
  preferredPaymentMethod: "paypal" | "stripe_transfer" | "account_credit";
  paypalEmail?: string;
  accountBalance: number;
  minimumPayout: number;
}

interface PayoutRequest {
  id: string;
  amount: number;
  paymentMethod: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  failureReason?: string;
  transactionId?: string;
}

interface AccountTransaction {
  id: string;
  amount: number;
  type: "credit" | "debit" | "refund";
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function PaymentSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [payoutType, setPayoutType] = useState<"full" | "custom">("full");
  const [customAmount, setCustomAmount] = useState<string>("");

  // Fetch payment settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/payment/settings"],
    retry: false,
  });

  // Fetch payout requests
  const { data: payoutRequests, isLoading: payoutsLoading } = useQuery({
    queryKey: ["/api/payment/payouts"],
    retry: false,
  });

  // Fetch account transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/payment/transactions"],
    retry: false,
  });

  // Update payment preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/payment/settings", data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your payment preferences have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update payment settings",
        variant: "destructive",
      });
    },
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/payment/request-payout", data);
    },
    onSuccess: () => {
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted for processing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to request payout",
        variant: "destructive",
      });
    },
  });

  const handleUpdateSettings = (formData: FormData) => {
    const paymentMethod = formData.get("paymentMethod") as string;
    const paypalEmail = formData.get("paypalEmail") as string;
    const minimumPayout = parseFloat(formData.get("minimumPayout") as string);

    updatePreferencesMutation.mutate({
      paymentMethod,
      paypalEmail: paymentMethod === "paypal" ? paypalEmail : undefined,
      minimumPayout,
    });
  };

  const handleRequestPayout = () => {
    let requestAmount = settings?.unpaidEarnings || 0;
    
    if (payoutType === "custom") {
      requestAmount = parseFloat(customAmount);
      if (isNaN(requestAmount) || requestAmount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid payout amount",
          variant: "destructive",
        });
        return;
      }
      if (requestAmount > (settings?.unpaidEarnings || 0)) {
        toast({
          title: "Amount Too High",
          description: `Maximum available: $${settings?.unpaidEarnings?.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }
    }

    if (requestAmount < (settings?.minimumPayout || 25)) {
      toast({
        title: "Amount Too Low",
        description: `Minimum payout amount is $${settings?.minimumPayout || 25}`,
        variant: "destructive",
      });
      return;
    }

    requestPayoutMutation.mutate({
      paymentMethod: settings.preferredPaymentMethod,
      amount: requestAmount,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "processing":
        return "text-blue-600 bg-blue-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "cancelled":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-yellow-600 bg-yellow-50";
    }
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link href="/referrals">
              <Button variant="outline" className="mb-4" data-testid="back-to-referrals">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Referrals
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Payment Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your payment preferences and view payout history
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Settings */}
            <div className="space-y-6">
              {/* Account Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Account Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        ${settings?.accountBalance?.toFixed(2) || "0.00"}
                      </div>
                      <div className="text-sm text-muted-foreground">Available Balance</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-bold">${settings?.unpaidEarnings?.toFixed(2) || "0.00"}</div>
                        <div className="text-muted-foreground">Unpaid Earnings</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-bold">${settings?.minimumPayout?.toFixed(2) || "25.00"}</div>
                        <div className="text-muted-foreground">Min Payout</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={handleUpdateSettings} className="space-y-4">
                    <div>
                      <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                      <Select name="paymentMethod" defaultValue={settings?.preferredPaymentMethod || "paypal"}>
                        <SelectTrigger data-testid="payment-method-select">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="stripe_transfer">Bank Transfer (Stripe)</SelectItem>
                          <SelectItem value="account_credit">Account Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="paypalEmail">PayPal Email (if using PayPal)</Label>
                      <Input
                        id="paypalEmail"
                        name="paypalEmail"
                        type="email"
                        defaultValue={settings?.paypalEmail || ""}
                        placeholder="your-paypal@email.com"
                        data-testid="paypal-email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="minimumPayout">Minimum Payout Amount</Label>
                      <Input
                        id="minimumPayout"
                        name="minimumPayout"
                        type="number"
                        min="25"
                        step="0.01"
                        defaultValue={settings?.minimumPayout || 25}
                        data-testid="minimum-payout"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Minimum $25 for PayPal/Stripe, $10 for account credit
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={updatePreferencesMutation.isPending}
                      className="w-full"
                      data-testid="update-settings"
                    >
                      {updatePreferencesMutation.isPending ? "Updating..." : "Update Settings"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Request Payout */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">Request Payout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-green-700">
                      Available for payout: <strong>${settings?.unpaidEarnings?.toFixed(2) || "0.00"}</strong>
                    </div>

                    <RadioGroup value={payoutType} onValueChange={(value: "full" | "custom") => setPayoutType(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="full" id="full" />
                        <Label htmlFor="full" className="text-sm">
                          Request full amount (${settings?.unpaidEarnings?.toFixed(2) || "0.00"})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom" className="text-sm">
                          Custom amount
                        </Label>
                      </div>
                    </RadioGroup>

                    {payoutType === "custom" && (
                      <div>
                        <Label htmlFor="customAmount" className="text-sm">Custom Payout Amount</Label>
                        <Input
                          id="customAmount"
                          type="number"
                          min="0"
                          max={settings?.unpaidEarnings || 0}
                          step="0.01"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder={`Min: $${settings?.minimumPayout || 25}, Max: $${settings?.unpaidEarnings?.toFixed(2) || "0.00"}`}
                          className="mt-1"
                          data-testid="custom-payout-amount"
                        />
                      </div>
                    )}

                    <div className="text-xs text-green-600">
                      {payoutType === "full" 
                        ? "You'll receive the full available amount"
                        : "Specify how much you want to withdraw"
                      }
                    </div>

                    <Button
                      onClick={handleRequestPayout}
                      disabled={!settings?.unpaidEarnings || (settings?.unpaidEarnings < (settings?.minimumPayout || 25)) || requestPayoutMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                      data-testid="request-payout"
                    >
                      {requestPayoutMutation.isPending 
                        ? "Processing..." 
                        : `Request ${payoutType === "full" ? "Full" : "Custom"} Payout`
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - History */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payout Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Payout Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {payoutsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : payoutRequests && payoutRequests.length > 0 ? (
                    <div className="space-y-4">
                      {payoutRequests.map((payout: PayoutRequest) => (
                        <div key={payout.id} className="flex justify-between items-center p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">${payout.amount.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(payout.requestedAt).toLocaleDateString()} • {payout.paymentMethod}
                            </div>
                            {payout.failureReason && (
                              <div className="text-xs text-red-600 mt-1">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {payout.failureReason}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                              {getStatusIcon(payout.status)}
                              {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                            </div>
                            {payout.transactionId && (
                              <div className="text-xs text-muted-foreground mt-1">
                                ID: {payout.transactionId}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No payout requests yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.slice(0, 10).map((transaction: AccountTransaction) => (
                        <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                              {transaction.type === 'debit' ? '-' : '+'}${transaction.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Balance: ${transaction.balanceAfter.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}