import { Navigate, Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import { getAgentVerificationUiState } from "@/lib/agentVerification";
import { Button } from "@/components/ui/button";
import AgentTopNav from "./AgentTopNav";

export default function AgentLayout() {
  const { user, loading, profileRole, hasRole, isSuspendedAgent, agentVerificationStatus, signOut } = useAuth();
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

  // A suspended agent is locked out of all agent functionality (not just shown a
  // banner). Admins are exempt — they keep agent-view access and aren't suspendable.
  if (isSuspendedAgent && !hasRole("admin")) {
    const ui = getAgentVerificationUiState(agentVerificationStatus);
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F2EE] px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{ui.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{ui.description}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild>
              <a href="mailto:support@1031exchangeup.com">Contact support</a>
            </Button>
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
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
