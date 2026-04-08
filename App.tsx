import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TemplateProvider } from "@/contexts/TemplateContext";
import Index from "./pages/Index";
import Programs from "./pages/Programs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Alerts from "./pages/Alerts";
import CreateProgram from "./pages/CreateProgram";
import EditProgram from "./pages/EditProgram";
import CreateScholarship from "./pages/CreateScholarship";
import EditScholarship from "./pages/EditScholarship";
import ProgramDetail from "./pages/ProgramDetail";
import ScholarshipDetail from "./pages/ScholarshipDetail";
import Subscription from "./pages/Subscription";
import VisaHub from "./pages/VisaHub";
import CompanyInfo from "./pages/CompanyInfo";
import NotFound from "./pages/NotFound";
import ChatbotWidget from "./components/ChatbotWidget";
import UniversityPrograms from "./pages/dashboards/university/UniversityPrograms";
import OrgScholarships from "./pages/dashboards/org/OrgScholarships";
import DashboardApplications from "./pages/dashboards/DashboardApplications";
import ApplicationDetail from "./pages/dashboards/ApplicationDetail";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TemplateProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/scholarships/:id" element={<ScholarshipDetail />} />
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
              <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              {/* Admin sub-routes reuse the same Dashboard component and switch by role */}
              <Route path="/dashboard/users" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/institutions" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/subscriptions" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/blogs" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/dashboard/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
              <Route path="/dashboard/programs/create" element={<ProtectedRoute><CreateProgram /></ProtectedRoute>} />
              <Route path="/dashboard/programs/:id/edit" element={<ProtectedRoute><EditProgram /></ProtectedRoute>} />
              <Route path="/dashboard/scholarships/create" element={<ProtectedRoute><CreateScholarship /></ProtectedRoute>} />
              <Route path="/dashboard/scholarships/:id/edit" element={<ProtectedRoute><EditScholarship /></ProtectedRoute>} />
              <Route path="/dashboard/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/dashboard/applications" element={<ProtectedRoute><DashboardApplications /></ProtectedRoute>} />
              <Route path="/dashboard/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
              <Route path="/dashboard/programs" element={<ProtectedRoute><UniversityPrograms /></ProtectedRoute>} />
              <Route path="/dashboard/scholarships" element={<ProtectedRoute><OrgScholarships /></ProtectedRoute>} />
              <Route path="/dashboard/visa-hub" element={<ProtectedRoute><VisaHub /></ProtectedRoute>} />
              <Route path="/company" element={<CompanyInfo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChatbotWidget />
          </TemplateProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
