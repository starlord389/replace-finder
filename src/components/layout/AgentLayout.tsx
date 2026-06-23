import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import AgentTopNav from "./AgentTopNav";

export default function AgentLayout() {
  const { user, loading, profileRole, hasRole } = useAuth();
  const { isDemo } = useWorkspaceMode();

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

  // Anyone holding the agent role can use the agent area — including admins who
  // also have an agent role, so they can switch back and forth between views.
  if (!hasRole("agent")) {
    return <Navigate to={getUnauthorizedRedirectPath(profileRole)} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F2EE]">
      <AgentTopNav />
      {isDemo && (
        <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-semibold text-white">
          Demo workspace — sample data, kept completely separate from your live account.
        </div>
      )}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
