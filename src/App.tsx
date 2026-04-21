import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ROUTES } from "@/app/routes/routeManifest";

import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import AgentLayout from "@/components/layout/AgentLayout";
import RequireGuest from "@/components/layout/RequireGuest";

import Index from "@/pages/Index";
import BookDemo from "@/pages/BookDemo";
import HowItWorks from "@/pages/HowItWorks";
import Contact from "@/pages/Contact";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthCallback from "@/pages/auth/AuthCallback";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SupportTickets from "@/pages/admin/SupportTickets";
import AgentDashboard from "@/pages/agent/AgentDashboard";
import AgentLaunchpad from "@/pages/agent/AgentLaunchpad";
import AgentClients from "@/pages/agent/AgentClients";
import AgentClientDetail from "@/pages/agent/AgentClientDetail";
import AgentExchanges from "@/pages/agent/AgentExchanges";
import NewExchange from "@/pages/agent/NewExchange";
import EditExchange from "@/pages/agent/EditExchange";
import AgentExchangeDetail from "@/pages/agent/AgentExchangeDetail";
import AgentMatches from "@/pages/agent/AgentMatches";
import AgentMatchDetail from "@/pages/agent/AgentMatchDetail";
import AgentConnections from "@/pages/agent/AgentConnections";
import AgentConnectionDetail from "@/pages/agent/AgentConnectionDetail";
import AgentMessages from "@/pages/agent/AgentMessages";
import AgentSettings from "@/pages/agent/AgentSettings";
import AgentHelp from "@/pages/agent/AgentHelp";
import NotFound from "@/pages/NotFound";
import Unavailable from "@/pages/Unavailable";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public (marketing + auth entry) — signed-in users are redirected to their dashboard */}
            <Route element={<RequireGuest />}>
              <Route element={<PublicLayout />}>
                <Route path={ROUTES.home} element={<Index />} />
                <Route path={ROUTES.bookDemo} element={<BookDemo />} />
                <Route path={ROUTES.howItWorks} element={<HowItWorks />} />
                <Route path={ROUTES.contact} element={<Contact />} />
                <Route path={ROUTES.features} element={<Features />} />
                <Route path={ROUTES.pricing} element={<Pricing />} />
                <Route path={ROUTES.login} element={<Login />} />
                <Route path={ROUTES.signup} element={<Signup />} />
              </Route>
            </Route>

            {/* Recovery / informational routes — accessible whether signed in or not */}
            <Route element={<PublicLayout />}>
              <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
              <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
              <Route path={ROUTES.unavailable} element={<Unavailable />} />
            </Route>

            {/* Auth callback — handles email-confirmation redirect, routes to dashboard */}
            <Route path="/auth/callback" element={<AuthCallback />} />


            {/* Agent (agent role required) */}
            <Route element={<AgentLayout />}>
              <Route path="/agent" element={<AgentDashboard />} />
              <Route path="/agent/launchpad" element={<AgentLaunchpad />} />
              <Route path="/agent/clients" element={<AgentClients />} />
              <Route path="/agent/clients/new" element={<AgentClientDetail />} />
              <Route path="/agent/clients/:id" element={<AgentClientDetail />} />
              <Route path="/agent/exchanges" element={<AgentExchanges />} />
              <Route path="/agent/exchanges/new" element={<NewExchange />} />
              <Route path="/agent/exchanges/:id/edit" element={<EditExchange />} />
              <Route path="/agent/exchanges/:id" element={<AgentExchangeDetail />} />
              <Route path="/agent/matches" element={<AgentMatches />} />
              <Route path="/agent/matches/:id" element={<AgentMatchDetail />} />
              <Route path="/agent/connections" element={<AgentConnections />} />
              <Route path="/agent/connections/:id" element={<AgentConnectionDetail />} />
              <Route path="/agent/messages" element={<AgentMessages />} />
              <Route path="/agent/settings" element={<AgentSettings />} />
              <Route path="/agent/help" element={<AgentHelp />} />
            </Route>

            {/* Admin (admin role required) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/support" element={<SupportTickets />} />
            </Route>

            {/* Redirect old client routes */}
            <Route path="/dashboard/*" element={<Navigate to={ROUTES.unavailable} replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
