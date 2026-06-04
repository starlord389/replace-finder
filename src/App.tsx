import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import AuthCallback from "@/pages/auth/AuthCallback";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import SupportTickets from "@/pages/admin/SupportTickets";
import AdminSettings from "@/pages/admin/AdminSettings";
import AgentDashboard from "@/pages/agent/AgentDashboard";
import AgentLaunchpad from "@/pages/agent/AgentLaunchpad";
import AgentClients from "@/pages/agent/AgentClients";
import AgentClientDetail from "@/pages/agent/AgentClientDetail";
import AgentExchanges from "@/pages/agent/AgentExchanges";
import NewExchange from "@/pages/agent/NewExchange";
import EditExchange from "@/pages/agent/EditExchange";
import AgentExchangeDetail from "@/pages/agent/AgentExchangeDetail";
import AgentMatchesHub from "@/pages/agent/AgentMatchesHub";
import AgentMatchDetail from "@/pages/agent/AgentMatchDetail";
import AgentConnectionDetail from "@/pages/agent/AgentConnectionDetail";
import AgentSettings from "@/pages/agent/AgentSettings";
import AgentHelp from "@/pages/agent/AgentHelp";
import AgentNotifications from "@/pages/agent/AgentNotifications";

import AcceptInvite from "@/pages/auth/AcceptInvite";
import NotFound from "@/pages/NotFound";

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
                <Route path={ROUTES.login} element={<Login />} />
                <Route path={ROUTES.signup} element={<Signup />} />
              </Route>
            </Route>

            {/* Recovery / informational routes — accessible whether signed in or not */}
            <Route element={<PublicLayout />}>
              <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
              <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
            </Route>

            {/* Auth callback — handles email-confirmation redirect, routes to dashboard */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/accept-invite" element={<AcceptInvite />} />

            {/* Agent (agent role required) */}
            <Route element={<AgentLayout />}>
              <Route path="/agent" element={<Navigate to="/agent/dashboard" replace />} />
              <Route path="/agent/launchpad" element={<AgentLaunchpad />} />
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/clients" element={<AgentClients />} />
              <Route path="/agent/clients/new" element={<AgentClientDetail />} />
              <Route path="/agent/clients/:id" element={<AgentClientDetail />} />
              <Route path="/agent/exchanges" element={<AgentExchanges />} />
              <Route path="/agent/exchanges/new" element={<NewExchange />} />
              <Route path="/agent/exchanges/:id/edit" element={<EditExchange />} />
              <Route path="/agent/exchanges/:id" element={<AgentExchangeDetail />} />
              <Route path="/agent/properties" element={<Navigate to="/agent/exchanges" replace />} />
              {/* Unified Matches hub (replaces Matches + Connections + Messages list pages) */}
              <Route path="/agent/matches" element={<AgentMatchesHub />} />
              <Route path="/agent/matches/:id" element={<AgentMatchDetail />} />
              <Route path="/agent/connections" element={<Navigate to="/agent/matches?stage=pending" replace />} />
              <Route path="/agent/connections/:id" element={<AgentConnectionDetail />} />
              <Route path="/agent/messages" element={<Navigate to="/agent/matches?stage=active" replace />} />
              <Route path="/agent/notifications" element={<AgentNotifications />} />
              <Route path="/agent/profile" element={<Navigate to="/agent/settings" replace />} />
              <Route path="/agent/settings" element={<AgentSettings />} />
              <Route path="/agent/help" element={<AgentHelp />} />
            </Route>

            {/* Admin (admin role required) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/support" element={<SupportTickets />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
