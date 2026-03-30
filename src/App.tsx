import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

import PublicLayout from "@/components/layout/PublicLayout";
import ClientLayout from "@/components/layout/ClientLayout";
import AdminLayout from "@/components/layout/AdminLayout";

import Index from "@/pages/Index";
import HowItWorks from "@/pages/HowItWorks";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Dashboard from "@/pages/client/Dashboard";
import NewRequest from "@/pages/client/NewRequest";
import MatchDetail from "@/pages/client/MatchDetail";
import Profile from "@/pages/client/Profile";
import RequestQueue from "@/pages/admin/RequestQueue";
import RequestDetail from "@/pages/admin/RequestDetail";
import InventoryList from "@/pages/admin/InventoryList";
import InventoryDetail from "@/pages/admin/InventoryDetail";
import MatchReview from "@/pages/admin/MatchReview";
import MatchRunDetail from "@/pages/admin/MatchRunDetail";
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

            {/* Client (auth required) */}
            <Route element={<ClientLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/new-request" element={<NewRequest />} />
              <Route path="/dashboard/match/:id" element={<MatchDetail />} />
              <Route path="/dashboard/profile" element={<Profile />} />
            </Route>

            {/* Admin (admin role required) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/requests" element={<RequestQueue />} />
              <Route path="/admin/requests/:id" element={<RequestDetail />} />
              <Route path="/admin/inventory" element={<InventoryList />} />
              <Route path="/admin/inventory/:id" element={<InventoryDetail />} />
              <Route path="/admin/matches" element={<MatchReview />} />
              <Route path="/admin/matches/:id" element={<MatchRunDetail />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
