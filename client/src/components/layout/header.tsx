import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Building2, ShoppingCart, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NotificationsBell } from "@/components/notifications-bell";
import type { User } from "@/../../shared/schema";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [guestCartCount, setGuestCartCount] = useState(0);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 30000, // 30 seconds
    enabled: true, // Always enabled but non-blocking
  });

  const { data: cartItems } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !!user,
    retry: false,
  });

  // Update guest cart count from localStorage
  useEffect(() => {
    const updateGuestCartCount = () => {
      const guestCart = JSON.parse(localStorage.getItem("guest-cart") || "[]");
      const totalItems = guestCart.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      setGuestCartCount(totalItems);
    };

    updateGuestCartCount();
    // Listen for storage changes (when cart is updated on other tabs)
    window.addEventListener('storage', updateGuestCartCount);
    // Listen for custom cart update events
    window.addEventListener('cartUpdated', updateGuestCartCount);

    return () => {
      window.removeEventListener('storage', updateGuestCartCount);
      window.removeEventListener('cartUpdated', updateGuestCartCount);
    };
  }, []);

  const totalCartItems = user 
    ? (cartItems?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0)
    : guestCartCount;

  const navigation = [
    { name: "Courses", href: "#" }, // Now handled as dropdown
    { name: "AI Tools", href: "/tools/ai-pricing" },
    { name: "Store", href: "#" }, // Now handled as dropdown
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
            {navigation.map((item) => {
              if (item.name === "Courses") {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1 text-sm font-medium">
                        <span>Courses</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/pricing?course=journeyman" className="cursor-pointer">
                          Journeyman Prep
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-default opacity-75">
                        <div className="flex items-center justify-between w-full">
                          <span>Backflow Prevention Prep</span>
                          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-default opacity-75">
                        <div className="flex items-center justify-between w-full">
                          <span>Natural Gas Prep</span>
                          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-default opacity-75">
                        <div className="flex items-center justify-between w-full">
                          <span>Medical Gas Prep</span>
                          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-default opacity-75">
                        <div className="flex items-center justify-between w-full">
                          <span>Master Plumber Prep</span>
                          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">Coming Soon</Badge>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              if (item.name === "Store") {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1 text-sm font-medium">
                        <span>Store</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/store" className="cursor-pointer">
                          LA Plumb Store
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/amazon-products" className="cursor-pointer">
                          Amazon Tools
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
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
              );
            })}
          </nav>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Icon */}
            <Link href="/cart">
              <Button variant="outline" size="sm" className="relative" data-testid="button-cart">
                <ShoppingCart className="h-4 w-4" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
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
              <Link href="/pricing">
                <Button data-testid="button-start-trial">
                  Get Started
                </Button>
              </Link>
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
                {navigation.map((item) => {
                  if (item.name === "Courses") {
                    return (
                      <div key={item.name} className="space-y-2">
                        <span className="text-lg font-medium text-foreground">Courses</span>
                        <div className="ml-4 space-y-2">
                          <Link href="/pricing?course=journeyman">
                            <span 
                              className="block text-sm font-medium transition-colors hover:text-primary cursor-pointer text-muted-foreground"
                              onClick={() => setIsOpen(false)}
                            >
                              Journeyman Prep
                            </span>
                          </Link>
                          <div className="flex items-center justify-between opacity-75">
                            <span className="block text-sm font-medium text-muted-foreground">
                              Backflow Prevention Prep
                            </span>
                            <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 text-xs">Coming Soon</Badge>
                          </div>
                          <div className="flex items-center justify-between opacity-75">
                            <span className="block text-sm font-medium text-muted-foreground">
                              Natural Gas Prep
                            </span>
                            <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 text-xs">Coming Soon</Badge>
                          </div>
                          <div className="flex items-center justify-between opacity-75">
                            <span className="block text-sm font-medium text-muted-foreground">
                              Medical Gas Prep
                            </span>
                            <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 text-xs">Coming Soon</Badge>
                          </div>
                          <div className="flex items-center justify-between opacity-75">
                            <span className="block text-sm font-medium text-muted-foreground">
                              Master Plumber Prep
                            </span>
                            <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 text-xs">Coming Soon</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  if (item.name === "Store") {
                    return (
                      <div key={item.name} className="space-y-2">
                        <span className="text-lg font-medium text-foreground">Store</span>
                        <div className="ml-4 space-y-2">
                          <Link href="/store">
                            <span 
                              className="block text-sm font-medium transition-colors hover:text-primary cursor-pointer text-muted-foreground"
                              onClick={() => setIsOpen(false)}
                            >
                              LA Plumb Store
                            </span>
                          </Link>
                          <Link href="/amazon-products">
                            <span 
                              className="block text-sm font-medium transition-colors hover:text-primary cursor-pointer text-muted-foreground"
                              onClick={() => setIsOpen(false)}
                            >
                              Amazon Tools
                            </span>
                          </Link>
                        </div>
                      </div>
                    );
                  }
                  return (
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
                  );
                })}
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
