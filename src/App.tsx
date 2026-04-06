import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import PublicLayout from "@/components/layout/PublicLayout";
import ClientLayout from "@/components/layout/ClientLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import AgentLayout from "@/components/layout/AgentLayout";

import Index from "@/pages/Index";
import HowItWorks from "@/pages/HowItWorks";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Launchpad from "@/pages/client/Launchpad";
import Overview from "@/pages/client/Overview";
import ExchangeList from "@/pages/client/ExchangeList";
import ExchangeDetail from "@/pages/client/ExchangeDetail";
import NewRequest from "@/pages/client/NewRequest";
import MatchList from "@/pages/client/MatchList";
import MatchDetail from "@/pages/client/MatchDetail";
import Profile from "@/pages/client/Profile";
import Help from "@/pages/client/Help";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import RequestQueue from "@/pages/admin/RequestQueue";
import RequestDetail from "@/pages/admin/RequestDetail";
import InventoryList from "@/pages/admin/InventoryList";
import InventoryDetail from "@/pages/admin/InventoryDetail";
import MatchReview from "@/pages/admin/MatchReview";
import MatchRunDetail from "@/pages/admin/MatchRunDetail";
import SupportTickets from "@/pages/admin/SupportTickets";
import ClientList from "@/pages/admin/ClientList";
import AgentDashboard from "@/pages/agent/AgentDashboard";
import AgentClients from "@/pages/agent/AgentClients";
import AgentClientDetail from "@/pages/agent/AgentClientDetail";
import AgentExchanges from "@/pages/agent/AgentExchanges";
import NewExchange from "@/pages/agent/NewExchange";
import AgentExchangeDetail from "@/pages/agent/AgentExchangeDetail";
import AgentMatches from "@/pages/agent/AgentMatches";
import AgentMatchDetail from "@/pages/agent/AgentMatchDetail";
import AgentConnections from "@/pages/agent/AgentConnections";
import AgentIdentifications from "@/pages/agent/AgentIdentifications";
import AgentMessages from "@/pages/agent/AgentMessages";
import AgentSettings from "@/pages/agent/AgentSettings";
import AgentHelp from "@/pages/agent/AgentHelp";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Agent (agent role required) */}
            <Route element={<AgentLayout />}>
              <Route path="/agent" element={<AgentDashboard />} />
              <Route path="/agent/clients" element={<AgentClients />} />
              <Route path="/agent/clients/new" element={<AgentClientDetail />} />
              <Route path="/agent/clients/:id" element={<AgentClientDetail />} />
              <Route path="/agent/exchanges" element={<AgentExchanges />} />
              <Route path="/agent/exchanges/new" element={<NewExchange />} />
              <Route path="/agent/exchanges/:id" element={<AgentExchangeDetail />} />
              <Route path="/agent/matches" element={<AgentMatches />} />
              <Route path="/agent/connections" element={<AgentConnections />} />
              <Route path="/agent/identifications" element={<AgentIdentifications />} />
              <Route path="/agent/messages" element={<AgentMessages />} />
              <Route path="/agent/settings" element={<AgentSettings />} />
              <Route path="/agent/help" element={<AgentHelp />} />
            </Route>

            {/* Client (auth required) */}
            <Route element={<ClientLayout />}>
              <Route path="/dashboard" element={<Launchpad />} />
              <Route path="/dashboard/overview" element={<Overview />} />
              <Route path="/dashboard/exchanges" element={<ExchangeList />} />
              <Route path="/dashboard/exchanges/new" element={<NewRequest />} />
              <Route path="/dashboard/exchanges/:id" element={<ExchangeDetail />} />
              <Route path="/dashboard/exchanges/:id/edit" element={<NewRequest />} />
              <Route path="/dashboard/matches" element={<MatchList />} />
              <Route path="/dashboard/matches/:id" element={<MatchDetail />} />
              <Route path="/dashboard/settings" element={<Profile />} />
              <Route path="/dashboard/help" element={<Help />} />
            </Route>

            {/* Admin (admin role required) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/requests" element={<RequestQueue />} />
              <Route path="/admin/requests/:id" element={<RequestDetail />} />
              <Route path="/admin/inventory" element={<InventoryList />} />
              <Route path="/admin/inventory/:id" element={<InventoryDetail />} />
              <Route path="/admin/matches" element={<MatchReview />} />
              <Route path="/admin/matches/:id" element={<MatchRunDetail />} />
              <Route path="/admin/support" element={<SupportTickets />} />
              <Route path="/admin/clients" element={<ClientList />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
