import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ROUTES } from "@/app/routes/routeManifest";

import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import AgentLayout from "@/components/layout/AgentLayout";
import RequireGuest from "@/components/layout/RequireGuest";

const Index = lazy(() => import("@/pages/Index"));
const BookDemo = lazy(() => import("@/pages/BookDemo"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const SupportTickets = lazy(() => import("@/pages/admin/SupportTickets"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AgentDashboard = lazy(() => import("@/pages/agent/AgentDashboard"));
const AgentLaunchpad = lazy(() => import("@/pages/agent/AgentLaunchpad"));
const AgentClients = lazy(() => import("@/pages/agent/AgentClients"));
const AgentClientDetail = lazy(() => import("@/pages/agent/AgentClientDetail"));
const AgentClientOverview = lazy(() => import("@/pages/agent/AgentClientOverview"));
const NewExchange = lazy(() => import("@/pages/agent/NewExchange"));
const EditExchange = lazy(() => import("@/pages/agent/EditExchange"));
const AgentPipeline = lazy(() => import("@/pages/agent/AgentPipeline"));
const AgentWorkspace = lazy(() => import("@/pages/agent/AgentWorkspace"));
const AgentListings = lazy(() => import("@/pages/agent/AgentListings"));
const AgentMatches = lazy(() => import("@/pages/agent/AgentMatches"));
const MatchRedirect = lazy(() => import("@/pages/agent/MatchRedirect"));
const AgentConnectionDetail = lazy(() => import("@/pages/agent/AgentConnectionDetail"));
const AgentSettings = lazy(() => import("@/pages/agent/AgentSettings"));
const AgentHelp = lazy(() => import("@/pages/agent/AgentHelp"));
const AgentNotifications = lazy(() => import("@/pages/agent/AgentNotifications"));
const AcceptInvite = lazy(() => import("@/pages/auth/AcceptInvite"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

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
          <Suspense fallback={<RouteFallback />}>
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

              {/* My Clients */}
              <Route path="/agent/clients" element={<AgentClients />} />
              <Route path="/agent/clients/new" element={<AgentClientDetail />} />
              <Route path="/agent/clients/:clientId" element={<AgentClientOverview />} />
              <Route path="/agent/clients/:clientId/edit" element={<Navigate to=".." replace />} />

              {/* Pipeline (cross-client stage board) */}
              <Route path="/agent/pipeline" element={<AgentPipeline />} />

              {/* Listings & Matches */}
              <Route path="/agent/listings" element={<AgentListings />} />
              <Route path="/agent/matches" element={<AgentMatches />} />
              <Route path="/agent/workspace" element={<Navigate to="/agent/listings" replace />} />
              <Route path="/agent/workspace/:exchangeId" element={<AgentWorkspace />} />

              {/* Listing flows (creation/edit) */}
              <Route path="/agent/exchanges/new" element={<NewExchange />} />
              <Route path="/agent/exchanges/:id/edit" element={<EditExchange />} />

              {/* Legacy redirects — no dead-ends */}
              <Route path="/agent/exchanges" element={<Navigate to="/agent/pipeline" replace />} />
              <Route path="/agent/exchanges/:id" element={<ExchangeToWorkspaceRedirect />} />
              <Route path="/agent/properties" element={<Navigate to="/agent/pipeline" replace />} />
              <Route path="/agent/matches/:id" element={<MatchRedirect />} />
              <Route path="/agent/connections" element={<Navigate to="/agent/pipeline?filter=client_interested" replace />} />
              <Route path="/agent/connections/:id" element={<AgentConnectionDetail />} />
              <Route path="/agent/messages" element={<Navigate to="/agent/pipeline?filter=agent_connected" replace />} />

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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

function ExchangeToWorkspaceRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/agent/workspace/${id}`} replace />;
}
