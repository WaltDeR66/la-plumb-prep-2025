import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, Zap, Star } from "lucide-react";
import { Link } from "wouter";

interface BetaBannerProps {
  className?: string;
  showCTA?: boolean;
}

export default function BetaBanner({ className = "", showCTA = true }: BetaBannerProps) {
  // Mock beta tester count - in real app this would come from API
  const [betaSignups, setBetaSignups] = useState(23); // Current beta signups
  const maxBetaSignups = 100;
  const remainingSpots = maxBetaSignups - betaSignups;

  // Timer for urgency effect (resets every 24 hours)
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 }; // Reset daily
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate occasional signup updates for demo
  useEffect(() => {
    const signupTimer = setInterval(() => {
      if (Math.random() < 0.1 && betaSignups < maxBetaSignups) { // 10% chance every 30 seconds
        setBetaSignups(prev => Math.min(prev + 1, maxBetaSignups));
      }
    }, 30000);

    return () => clearInterval(signupTimer);
  }, [betaSignups, maxBetaSignups]);

  if (betaSignups >= maxBetaSignups) {
    return null; // Hide banner when beta is full
  }

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 ${className}`} data-testid="beta-banner">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left side - Beta info */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1">
                <Star className="w-4 h-4 mr-1" />
                BETA EXCLUSIVE
              </Badge>
              <Badge variant="outline" className="border-orange-500 text-orange-600 font-semibold">
                <Users className="w-4 h-4 mr-1" />
                {remainingSpots} spots left
              </Badge>
            </div>
            
            <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-2" data-testid="beta-title">
              First 100 Beta Testers Get <span className="text-primary">Extra 25% Off</span>
            </h3>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-primary" />
                <span><strong>50% off first month</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-primary" />
                <span><strong>25% off for full year</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-primary" />
                <span><strong>Stacks with annual discount</strong></span>
              </div>
            </div>
          </div>

          {/* Middle - Progress & Timer */}
          <div className="flex flex-col items-center gap-3">
            {/* Progress bar */}
            <div className="w-48">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{betaSignups} signed up</span>
                <span>{maxBetaSignups} total</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(betaSignups / maxBetaSignups) * 100}%` }}
                  data-testid="beta-progress"
                />
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-2 bg-background/50 rounded-lg px-3 py-2" data-testid="beta-timer">
              <Clock className="w-4 h-4 text-primary" />
              <div className="flex gap-1 font-mono text-sm">
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </span>
                <span className="text-muted-foreground">:</span>
                <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Beta pricing expires soon
            </p>
          </div>

          {/* Right side - CTA */}
          {showCTA && (
            <div className="flex flex-col gap-2">
              <Link href="/pricing">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8" data-testid="beta-cta-button">
                  Claim Beta Discount
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground text-center">
                No commitment • Cancel anytime
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}