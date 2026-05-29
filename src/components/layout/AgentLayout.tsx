import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import AgentSidebar from "./AgentSidebar";
import AgentHeader from "./AgentHeader";

export default function AgentLayout() {
  const { user, loading, profileRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F2EE]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profileRole !== "agent") {
    return <Navigate to={getUnauthorizedRedirectPath(profileRole)} replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AgentSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <AgentHeader />
          <main className="flex-1 min-w-0 overflow-x-hidden bg-[#F4F2EE] px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
