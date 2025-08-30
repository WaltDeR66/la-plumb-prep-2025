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
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Store from "@/pages/store";
import ProductDetail from "@/pages/product-detail";
import EmployerPortal from "@/pages/employer-portal";
import JobApproval from "@/pages/admin/job-approval";
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
          <Route path="/jobs" component={Jobs} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/store" component={Store} />
          <Route path="/store/product/:id" component={ProductDetail} />
          <Route path="/course/:courseId" component={CourseContent} />
          <Route path="/course/:courseId/lesson/:section" component={Lesson} />
          <Route path="/course/:courseId/content/:contentId" component={ContentView} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/employer-portal" component={EmployerPortal} />
          <Route path="/admin/job-approval" component={JobApproval} />
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
