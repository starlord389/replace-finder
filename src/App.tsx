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
import InvestorLayout from "@/components/layout/InvestorLayout";
import RequireGuest from "@/components/layout/RequireGuest";

const Home = lazy(() => import("@/pages/Home"));
const ForAgents = lazy(() => import("@/pages/ForAgents"));
const ForInvestors = lazy(() => import("@/pages/ForInvestors"));
const ForLandlords = lazy(() => import("@/pages/ForLandlords"));
const BookDemo = lazy(() => import("@/pages/BookDemo"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Signup = lazy(() => import("@/pages/auth/Signup"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/legal/Terms"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const SupportTickets = lazy(() => import("@/pages/admin/SupportTickets"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminDeals = lazy(() => import("@/pages/admin/AdminDeals"));
const AdminExchangeDetail = lazy(() => import("@/pages/admin/AdminExchangeDetail"));
const AdminConnectionDetail = lazy(() => import("@/pages/admin/AdminConnectionDetail"));
const AdminDemos = lazy(() => import("@/pages/admin/AdminDemos"));
const AdminIntake = lazy(() => import("@/pages/admin/AdminIntake"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminSystem = lazy(() => import("@/pages/admin/AdminSystem"));
const AdminReports = lazy(() => import("@/pages/admin/AdminReports"));
const ArticleFeedback = lazy(() => import("@/pages/admin/ArticleFeedback"));
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
const NotificationSettingsRedirect = lazy(() => import("@/pages/NotificationSettingsRedirect"));
const AgentRepresentation = lazy(() => import("@/pages/agent/AgentRepresentation"));
const InvestorDashboard = lazy(() => import("@/pages/investor/InvestorDashboard"));
const InvestorLaunchpad = lazy(() => import("@/pages/investor/InvestorLaunchpad"));
const InvestorListings = lazy(() => import("@/pages/investor/InvestorListings"));
const InvestorSettings = lazy(() => import("@/pages/investor/InvestorSettings"));
const InvestorHelp = lazy(() => import("@/pages/investor/InvestorHelp"));
const InvestorRepresentation = lazy(() => import("@/pages/investor/InvestorRepresentation"));
const AcceptInvite = lazy(() => import("@/pages/auth/AcceptInvite"));
const AcceptRepresentationInvite = lazy(() => import("@/pages/auth/AcceptRepresentationInvite"));
const AdminRepresentations = lazy(() => import("@/pages/admin/AdminRepresentations"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
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
            {/* Public (marketing + auth entry) - signed-in users are redirected to their dashboard */}
            <Route element={<RequireGuest />}>
            <Route element={<PublicLayout />}>
              <Route path={ROUTES.home} element={<Home />} />
              <Route path={ROUTES.forAgents} element={<ForAgents />} />
              <Route path={ROUTES.forInvestors} element={<ForInvestors />} />
              <Route path={ROUTES.forLandlords} element={<ForLandlords />} />
              <Route path={ROUTES.bookDemo} element={<BookDemo />} />
              <Route path={ROUTES.login} element={<Login />} />
              <Route path={ROUTES.signup} element={<Signup />} />
            </Route>
            </Route>

            {/* Recovery / informational routes - accessible whether signed in or not */}
            <Route element={<PublicLayout />}>
              <Route path={ROUTES.forgotPassword} element={<ForgotPassword />} />
              <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
              <Route path={ROUTES.privacy} element={<PrivacyPolicy />} />
              <Route path={ROUTES.terms} element={<Terms />} />
            </Route>

            {/* Auth callback - handles email-confirmation redirect, routes to dashboard */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/accept-invite" element={<AcceptInvite />} />
            <Route path="/representation-invite" element={<AcceptRepresentationInvite />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/settings/notifications" element={<NotificationSettingsRedirect />} />



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

              {/* Legacy redirects - no dead-ends */}
              <Route path="/agent/exchanges" element={<Navigate to="/agent/pipeline" replace />} />
              <Route path="/agent/exchanges/:id" element={<ExchangeToWorkspaceRedirect />} />
              <Route path="/agent/properties" element={<Navigate to="/agent/pipeline" replace />} />
              <Route path="/agent/matches/:id" element={<MatchRedirect />} />
              <Route path="/agent/connections" element={<Navigate to="/agent/pipeline" replace />} />
              <Route path="/agent/connections/:id" element={<AgentConnectionDetail />} />
              <Route path="/agent/messages" element={<Navigate to="/agent/pipeline" replace />} />

              <Route path="/agent/notifications" element={<AgentNotifications />} />
              <Route path="/agent/investor-inquiries" element={<Navigate to="/agent/representation" replace />} />
              <Route path="/agent/representation" element={<AgentRepresentation />} />
              <Route path="/agent/profile" element={<Navigate to="/agent/settings" replace />} />
              <Route path="/agent/settings" element={<AgentSettings />} />
              <Route path="/agent/help" element={<AgentHelp />} />
            </Route>

            {/* Investor (investor role required) */}
            <Route element={<InvestorLayout />}>
              <Route path="/investor" element={<Navigate to="/investor/dashboard" replace />} />
              <Route path="/investor/launchpad" element={<InvestorLaunchpad />} />
              <Route path="/investor/dashboard" element={<InvestorDashboard />} />
              <Route path="/investor/listings" element={<InvestorListings />} />
              <Route path="/investor/pipeline" element={<AgentPipeline audience="investor" />} />
              <Route path="/investor/matches" element={<AgentMatches audience="investor" />} />
              <Route path="/investor/exchanges/new" element={<NewExchange ownerType="investor" />} />
              <Route path="/investor/exchanges/:id/edit" element={<EditExchange ownerType="investor" />} />
              <Route path="/investor/connections/:id" element={<Navigate to="/investor/representation" replace />} />
              <Route path="/investor/notifications" element={<AgentNotifications />} />
              <Route path="/investor/marketplace" element={<Navigate to="/investor/matches" replace />} />
              <Route path="/investor/properties/:propertyId" element={<Navigate to="/investor/matches" replace />} />
              <Route path="/investor/saved" element={<Navigate to="/investor/matches" replace />} />
              <Route path="/investor/inquiries" element={<Navigate to="/investor/pipeline" replace />} />
              <Route path="/investor/settings" element={<InvestorSettings />} />
              <Route path="/investor/representation" element={<InvestorRepresentation />} />
              <Route path="/investor/help" element={<InvestorHelp />} />
            </Route>

            {/* Admin (admin role required) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/deals" element={<AdminDeals />} />
              <Route path="/admin/deals/exchanges/:id" element={<AdminExchangeDetail />} />
              <Route path="/admin/deals/connections/:id" element={<AdminConnectionDetail />} />
              <Route path="/admin/demos" element={<AdminDemos />} />
              <Route path="/admin/intake" element={<AdminIntake />} />
              <Route path="/admin/representations" element={<AdminRepresentations />} />
              <Route path="/admin/support" element={<SupportTickets />} />
              <Route path="/admin/feedback" element={<ArticleFeedback />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/system" element={<AdminSystem />} />
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
