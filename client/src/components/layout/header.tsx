import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Building2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NotificationsBell } from "@/components/notifications-bell";
import type { User } from "@/../../shared/schema";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30000, // 30 seconds
    enabled: true, // Always enabled but non-blocking
  });

  const navigation = [
    { name: "Courses", href: "/courses" },
    { name: "Study Companion", href: "/study-companion" },
    { name: "Competitions", href: "/competitions" },
    { name: "Tools", href: "/tools/ai-pricing" },
    { name: "Store", href: "/store" },
    { name: "Amazon Tools", href: "/amazon-products" },
    { name: "Jobs", href: "/jobs" },
  ];

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback to redirect even if logout fails
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-4 cursor-pointer" data-testid="logo">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-shrink-0">
                  <h1 className="text-xl font-bold text-primary whitespace-nowrap" data-testid="brand-name">
                    LA Plumb Prep
                  </h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap" data-testid="brand-tagline">
                    Official State Prep Course
                  </p>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 mr-8" data-testid="desktop-nav">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span 
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    location === item.href ? 'text-primary' : 'text-foreground'
                  }`}
                  data-testid={`nav-link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/bulk-enrollment">
              <Button variant="outline" size="sm" data-testid="button-bulk-enrollment" className="flex flex-col h-auto py-1 px-3">
                <span className="text-xs leading-tight">Bulk</span>
                <span className="text-xs leading-tight">Enrollment</span>
              </Button>
            </Link>
            <Link href="/employer-portal">
              <Button variant="outline" size="sm" data-testid="button-employer-portal">
                Post a Job
              </Button>
            </Link>
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="ghost" data-testid="button-dashboard">
                    Dashboard
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground" data-testid="user-email">
                  {user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-sign-in">
                    Sign In
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button data-testid="button-start-trial">
                    Get 50% Off First Month
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-button">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4 mt-6" data-testid="mobile-nav">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span 
                      className={`text-lg font-medium transition-colors hover:text-primary cursor-pointer ${
                        location === item.href ? 'text-primary' : 'text-foreground'
                      }`}
                      onClick={() => setIsOpen(false)}
                      data-testid={`mobile-nav-link-${item.name.toLowerCase()}`}
                    >
                      {item.name}
                    </span>
                  </Link>
                ))}
                <div className="border-t pt-4 mt-4">
                  {user ? (
                    <div className="space-y-3">
                      <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)} data-testid="mobile-button-dashboard">
                          Dashboard
                        </Button>
                      </Link>
                      <p className="text-sm text-muted-foreground" data-testid="mobile-user-email">
                        {user.email}
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                        data-testid="mobile-button-logout"
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/login">
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)} data-testid="mobile-button-sign-in">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/pricing">
                        <Button className="w-full" onClick={() => setIsOpen(false)} data-testid="mobile-button-start-trial">
                          Get 50% Off First Month
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">For Employers</p>
                  <Link href="/employer-portal">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setIsOpen(false)} data-testid="mobile-button-employer-portal">
                      Post a Job
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
