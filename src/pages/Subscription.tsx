import { useEffect, useState } from "react";
import { Check, X, CreditCard, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { subscriptionPlans } from "@/data/phase3Data";
import { api } from "@/lib/api";

const Subscription = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const isPro = user?.studentTier === "pro" && user?.subscriptionStatus === "active";
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    const sessionId = searchParams.get("session_id");

    const verifyAndRefresh = async () => {
      if (status === "success" && sessionId) {
        try {
          await api.get(`/payments/verify-session/${sessionId}`);
          toast({ title: "Payment Successful! 🎉", description: "Your account has been upgraded to Pro." });
          await refreshUser();
        } catch (err) {
          console.error("Verification failed", err);
          toast({ title: "Verification Pending", description: "Your payment is processing. Please refresh in a moment.", variant: "destructive" });
        }
      } else if (status === "success") {
        toast({ title: "Payment Successful! 🎉", description: "Your account is being upgraded." });
        refreshUser();
      } else if (status === "cancel") {
        toast({ title: "Payment Cancelled", description: "You can try again whenever you're ready.", variant: "destructive" });
      }
    };

    verifyAndRefresh();
  }, [searchParams]);

  const handleUpgrade = async () => {
    try {
      setIsRedirecting(true);
      const res = await api.post("/payments/create-checkout-session");
      if (res.data.url) {
        window.location.href = res.data.url; // Redirect to Stripe
      } else {
        setIsRedirecting(false);
      }
    } catch (err: any) {
      setIsRedirecting(false);
      toast({
        title: "Upgrade failed",
        description: err.response?.data?.message || "Could not start payment process.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    toast({ title: "Coming Soon", description: "Self-service cancellation is coming soon. Please contact support." });
  };

  return (
    <DashboardLayout>
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium">Redirecting to Stripe secure payment...</p>
        </div>
      )}
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="font-display text-xl font-bold">Subscription</h2>
            <p className="text-sm text-muted-foreground">Manage your plan and billing</p>
          </div>
        </div>

        {/* Current Plan Status */}
        <Card className="border-primary/20">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isPro ? "bg-accent/10" : "bg-muted"}`}>
                {isPro ? <Crown className="h-6 w-6 text-accent" /> : <CreditCard className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{isPro ? "Pro Plan" : "Basic Plan"}</h3>
                  <Badge variant={isPro ? "default" : "secondary"}>{isPro ? "Active" : "Free"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPro ? "Billed monthly · Next billing date: March 1, 2026" : "Upgrade to unlock all features"}
                </p>
              </div>
            </div>
            {isPro && (
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel Plan
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Plan Comparison */}
        <div className="grid gap-6 md:grid-cols-2">
          {subscriptionPlans.map((plan) => {
            const isCurrent = (plan.id === "pro" && isPro) || (plan.id === "basic" && !isPro);
            return (
              <Card key={plan.id} className={`relative ${plan.id === "pro" ? "border-accent shadow-lg" : ""}`}>
                {plan.id === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground font-semibold">Recommended</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button disabled className="w-full">Current Plan</Button>
                  ) : plan.id === "pro" ? (
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" onClick={handleUpgrade}>
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={handleCancel}>
                      Downgrade
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
