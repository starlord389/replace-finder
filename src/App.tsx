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
import Dashboard from "@/pages/client/Dashboard";
import NewRequest from "@/pages/client/NewRequest";
import RequestQueue from "@/pages/admin/RequestQueue";
import RequestDetail from "@/pages/admin/RequestDetail";
import InventoryList from "@/pages/admin/InventoryList";
import InventoryDetail from "@/pages/admin/InventoryDetail";
import MatchReview from "@/pages/admin/MatchReview";
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
            </Route>

            {/* Client (auth required) */}
            <Route element={<ClientLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/new-request" element={<NewRequest />} />
            </Route>

            {/* Admin (admin role required) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin/requests" element={<RequestQueue />} />
              <Route path="/admin/requests/:id" element={<RequestDetail />} />
              <Route path="/admin/inventory" element={<InventoryList />} />
              <Route path="/admin/inventory/:id" element={<InventoryDetail />} />
              <Route path="/admin/matches" element={<MatchReview />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
