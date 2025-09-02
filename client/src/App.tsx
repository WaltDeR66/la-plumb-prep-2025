import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Courses from "@/pages/courses";
import Tools from "@/pages/tools";
import Jobs from "@/pages/jobs";
import Pricing from "@/pages/pricing";
import Subscribe from "@/pages/subscribe";
import Dashboard from "@/pages/dashboard";
import CourseContent from "@/pages/course-content";
import Lesson from "@/pages/lesson";
import ContentView from "@/pages/content-view";
import PodcastView from "@/pages/podcast-view";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Store from "@/pages/store";
import ProductDetail from "@/pages/product-detail";
import AIToolsPricing from "@/pages/ai-tools-pricing";
import PayPerUseCheckout from "@/pages/pay-per-use-checkout";
import EmployerPortal from "@/pages/employer-portal";
import EmployerDashboard from "@/pages/employer-dashboard";
import JobApproval from "@/pages/admin/job-approval";
import JobAnalytics from "@/pages/employer/job-analytics";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Accessibility from "@/pages/accessibility";
import Help from "@/pages/help";
import Contact from "@/pages/contact";
import LouisianaBoard from "@/pages/louisiana-board";
import TechnicalSupport from "@/pages/technical-support";
import SystemStatus from "@/pages/system-status";
import Referrals from "@/pages/referrals";
import BulkEnrollment from "@/pages/bulk-enrollment";
import LeadMagnet from "@/pages/lead-magnet";
import StudentLeadMagnet from "@/pages/student-lead-magnet";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/courses" component={Courses} />
          <Route path="/tools" component={Tools} />
          <Route path="/tools/ai-pricing" component={AIToolsPricing} />
          <Route path="/pay-per-use" component={PayPerUseCheckout} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/store" component={Store} />
          <Route path="/store/product/:id" component={ProductDetail} />
          <Route path="/course/:courseId" component={CourseContent} />
          <Route path="/course/:courseId/lesson/:section" component={Lesson} />
          <Route path="/course/:courseId/content/:contentId" component={ContentView} />
          <Route path="/course/:courseId/podcast/:contentId" component={PodcastView} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/employer-portal" component={EmployerPortal} />
          <Route path="/employer/dashboard" component={EmployerDashboard} />
          <Route path="/employer/analytics" component={JobAnalytics} />
          <Route path="/admin/job-approval" component={JobApproval} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/accessibility" component={Accessibility} />
          <Route path="/help" component={Help} />
          <Route path="/contact" component={Contact} />
          <Route path="/louisiana-board" component={LouisianaBoard} />
          <Route path="/technical-support" component={TechnicalSupport} />
          <Route path="/system-status" component={SystemStatus} />
          <Route path="/referrals" component={Referrals} />
          <Route path="/bulk-enrollment" component={BulkEnrollment} />
          <Route path="/lead-magnet" component={LeadMagnet} />
          <Route path="/student-lead-magnet" component={StudentLeadMagnet} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
