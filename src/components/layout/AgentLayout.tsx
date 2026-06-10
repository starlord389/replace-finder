import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import AgentTopNav from "./AgentTopNav";

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
    <div className="flex h-screen min-h-0 flex-col bg-[#F4F2EE]">
      <AgentTopNav />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
