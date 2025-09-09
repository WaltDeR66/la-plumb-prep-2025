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
import Checkout from "@/pages/checkout";
import CheckoutSuccess from "@/pages/checkout/success";
import BetaFeedback from "@/pages/beta-feedback";
import Dashboard from "@/pages/dashboard";
import CourseContent from "@/pages/course-content";
import Lesson from "@/pages/lesson";
import ContentView from "@/pages/content-view";
import PodcastView from "@/pages/podcast-view";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Store from "@/pages/store";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import AIToolsPricing from "@/pages/ai-tools-pricing";
import PlanAnalysisTool from "@/pages/plan-analysis-tool";
import PayPerUseCheckout from "@/pages/pay-per-use-checkout";
import EmployerPortal from "@/pages/employer-portal";
import EmployerDashboard from "@/pages/employer-dashboard";
import JobApproval from "@/pages/admin/job-approval";
import BetaFeedbackDashboard from "@/pages/admin/beta-feedback-dashboard";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import ContentManagement from "@/pages/admin/content-management";
import BulkQuestionImport from "@/pages/admin/bulk-question-import";
import BulkFlashcardImport from "@/pages/admin/bulk-flashcard-import";
import BulkStudyNotesImport from "@/pages/admin/bulk-studynotes-import";
import BulkStudyPlanImport from "@/pages/admin/bulk-studyplan-import";
import BulkPodcastImport from "@/pages/admin/bulk-podcast-import";
import BulkAIChatImport from "@/pages/admin/bulk-ai-chat-import";
import StudyCompanion from "@/pages/study-companion";
import SystemAnalytics from "@/pages/admin/system-analytics";
import SystemSettings from "@/pages/admin/system-settings";
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
import PaymentSettings from "@/pages/payment-settings";
import BulkEnrollment from "@/pages/bulk-enrollment";
import LeadMagnet from "@/pages/lead-magnet";
import StudentLeadMagnet from "@/pages/student-lead-magnet";
import Competitions from "@/pages/competitions";
import CompetitionTest from "@/pages/competition-test";
import Achievements from "@/pages/achievements";
import Leaderboard from "@/pages/leaderboard";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import StudyPlans from "@/pages/study-plans";
import StudyPlanItem from "@/pages/study-plan-item";
import StoreManager from "@/pages/admin/store-manager";
import AIPhotoPricing from "@/pages/ai-photo-pricing";

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
          <Route path="/tools/plan-analysis" component={PlanAnalysisTool} />
          <Route path="/plan-analysis-tool" component={PlanAnalysisTool} />
          <Route path="/ai-photo-analysis" component={Tools} />
          <Route path="/ai-photo-pricing" component={AIPhotoPricing} />
          <Route path="/ai-tools-pricing" component={AIToolsPricing} />
          <Route path="/pay-per-use" component={PayPerUseCheckout} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/success" component={CheckoutSuccess} />
          <Route path="/beta-feedback" component={BetaFeedback} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/store" component={Store} />
          <Route path="/store/product/:id" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/admin/store-manager" component={StoreManager} />
          <Route path="/course/:courseId" component={CourseContent} />
          <Route path="/course/:courseId/lesson/:section" component={Lesson} />
          <Route path="/course/:courseId/content/:contentId" component={ContentView} />
          <Route path="/course/:courseId/podcast/:contentId" component={PodcastView} />
          <Route path="/study-companion" component={StudyCompanion} />
          <Route path="/study-plans/:courseId" component={StudyPlans} />
          <Route path="/study-plans/:courseId/:duration/:itemIndex" component={StudyPlanItem} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/apprentice-signup" component={Register} />
          <Route path="/auth/login" component={Login} />
          <Route path="/auth/register" component={Register} />
          <Route path="/employer-signup" component={EmployerPortal} />
          <Route path="/employer-portal" component={EmployerPortal} />
          <Route path="/employer/dashboard" component={EmployerDashboard} />
          <Route path="/employer/analytics" component={JobAnalytics} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/content" component={ContentManagement} />
          <Route path="/admin/bulk-import" component={BulkQuestionImport} />
          <Route path="/admin/flashcard-import" component={BulkFlashcardImport} />
          <Route path="/admin/study-notes-import" component={BulkStudyNotesImport} />
          <Route path="/admin/bulk-studyplan-import" component={BulkStudyPlanImport} />
          <Route path="/admin/study-plan-import" component={BulkStudyPlanImport} />
          <Route path="/admin/content-import" component={BulkAIChatImport} />
          <Route path="/admin/podcast-import" component={BulkPodcastImport} />
          <Route path="/admin/system-analytics" component={SystemAnalytics} />
          <Route path="/admin/system-settings" component={SystemSettings} />
          <Route path="/admin/job-approval" component={JobApproval} />
          <Route path="/admin/beta-feedback" component={BetaFeedbackDashboard} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/accessibility" component={Accessibility} />
          <Route path="/help" component={Help} />
          <Route path="/contact" component={Contact} />
          <Route path="/louisiana-board" component={LouisianaBoard} />
          <Route path="/technical-support" component={TechnicalSupport} />
          <Route path="/system-status" component={SystemStatus} />
          <Route path="/referrals" component={Referrals} />
          <Route path="/payment-settings" component={PaymentSettings} />
          <Route path="/bulk-enrollment" component={BulkEnrollment} />
          <Route path="/lead-magnet" component={LeadMagnet} />
          <Route path="/student-lead-magnet" component={StudentLeadMagnet} />
          <Route path="/competitions" component={Competitions} />
          <Route path="/competition/:competitionId/test" component={CompetitionTest} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/leaderboard" component={Leaderboard} />
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
