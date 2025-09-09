import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Building2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    { name: "Courses", href: "#" }, // Now handled as dropdown
    { name: "AI Tools", href: "#" }, // Now handled as dropdown
    { name: "Store", href: "#" }, // Now handled as dropdown
    { name: "For Companies", href: "#" }, // Now handled as dropdown
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
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
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
                        <Link href="/course/louisiana-journeyman-prep" className="cursor-pointer">
                          Louisiana Journeyman Prep
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/course/master-plumber-prep" className="cursor-pointer">
                          Master Plumber Prep
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/course/backflow-prevention" className="cursor-pointer">
                          Backflow Prevention Training
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/course/natural-gas-certification" className="cursor-pointer">
                          Natural Gas Certification
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/course/medical-gas-installer" className="cursor-pointer">
                          Medical Gas Installer Certification
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              if (item.name === "AI Tools") {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1 text-sm font-medium">
                        <span>AI Tools</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/ai-photo-analysis" className="cursor-pointer">
                          AI Photo Analysis
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/plan-analysis-tool" className="cursor-pointer">
                          Plan Analysis Tool
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/ai-tools-pricing" className="cursor-pointer">
                          Pipe Sizing Calculator
                        </Link>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              if (item.name === "For Companies") {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1 text-sm font-medium">
                        <span>For Companies</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href="/employer-signup" className="cursor-pointer">
                          Post Job Openings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/pricing" className="cursor-pointer">
                          Register Apprentices
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/plan-analysis-tool" className="cursor-pointer">
                          Plan Analysis Tool
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/ai-photo-analysis" className="cursor-pointer">
                          Photo Code Analysis
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
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="ghost" data-testid="button-dashboard">
                    Dashboard
                  </Button>
                </Link>
                <NotificationsBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="user-menu-trigger">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="hidden lg:inline">
                          {user?.firstName || 'User'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" data-testid="profile-link">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/billing" data-testid="billing-link">
                        Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" data-testid="settings-link">
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer"
                      data-testid="logout-button"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" data-testid="button-login">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button data-testid="button-register">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Menu</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Mobile Courses */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Courses</h3>
                      <div className="pl-4 space-y-2">
                        <Link href="/course/louisiana-journeyman-prep" className="block text-gray-600 dark:text-gray-300">
                          Louisiana Journeyman Prep
                        </Link>
                        <Link href="/course/master-plumber-prep" className="block text-gray-600 dark:text-gray-300">
                          Master Plumber Prep
                        </Link>
                        <Link href="/course/backflow-prevention" className="block text-gray-600 dark:text-gray-300">
                          Backflow Prevention Training
                        </Link>
                        <Link href="/course/natural-gas-certification" className="block text-gray-600 dark:text-gray-300">
                          Natural Gas Certification
                        </Link>
                        <Link href="/course/medical-gas-installer" className="block text-gray-600 dark:text-gray-300">
                          Medical Gas Installer Certification
                        </Link>
                      </div>
                    </div>
                    
                    {/* Mobile AI Tools */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">AI Tools</h3>
                      <div className="pl-4 space-y-2">
                        <Link href="/ai-photo-analysis" className="block text-gray-600 dark:text-gray-300">
                          AI Photo Analysis
                        </Link>
                        <Link href="/plan-analysis-tool" className="block text-gray-600 dark:text-gray-300">
                          Plan Analysis Tool
                        </Link>
                        <Link href="/ai-tools-pricing" className="block text-gray-600 dark:text-gray-300">
                          Pipe Sizing Calculator
                        </Link>
                      </div>
                    </div>
                    
                    {/* Mobile Store */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">Store</h3>
                      <div className="pl-4 space-y-2">
                        <Link href="/store" className="block text-gray-600 dark:text-gray-300">
                          LA Plumb Store
                        </Link>
                      </div>
                    </div>
                    
                    {/* Mobile For Companies */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">For Companies</h3>
                      <div className="pl-4 space-y-2">
                        <Link href="/employer-signup" className="block text-gray-600 dark:text-gray-300">
                          Post Job Openings
                        </Link>
                        <Link href="/pricing" className="block text-gray-600 dark:text-gray-300">
                          Register Apprentices
                        </Link>
                        <Link href="/plan-analysis-tool" className="block text-gray-600 dark:text-gray-300">
                          Plan Analysis Tool
                        </Link>
                        <Link href="/ai-photo-analysis" className="block text-gray-600 dark:text-gray-300">
                          Photo Code Analysis
                        </Link>
                      </div>
                    </div>
                    
                    <Link href="/jobs" className="block text-gray-600 dark:text-gray-300">
                      Jobs
                    </Link>
                    
                    {user ? (
                      <>
                        <Link href="/dashboard" className="block text-gray-600 dark:text-gray-300">
                          Dashboard
                        </Link>
                        <Link href="/profile" className="block text-gray-600 dark:text-gray-300">
                          Profile
                        </Link>
                        <Link href="/billing" className="block text-gray-600 dark:text-gray-300">
                          Billing
                        </Link>
                        <Link href="/settings" className="block text-gray-600 dark:text-gray-300">
                          Settings
                        </Link>
                        <Button
                          onClick={handleLogout}
                          variant="outline"
                          className="w-full text-red-600 border-red-600"
                          data-testid="mobile-logout-button"
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="block">
                          <Button variant="outline" className="w-full" data-testid="mobile-button-login">
                            Log in
                          </Button>
                        </Link>
                        <Link href="/register" className="block">
                          <Button className="w-full" data-testid="mobile-button-register">
                            Get Started
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}