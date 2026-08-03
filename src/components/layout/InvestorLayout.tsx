import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import { Button } from "@/components/ui/button";
import InvestorTopNav from "./InvestorTopNav";

export default function InvestorLayout() {
  const { user, loading, profileRole, hasRole, agentVerificationStatus, signOut } = useAuth();
  const { isDemo, setMode } = useWorkspaceMode();

  useEffect(() => {
    if (!loading && !hasRole("admin") && isDemo) setMode("live");
  }, [hasRole, isDemo, loading, setMode]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole("investor")) return <Navigate to={getUnauthorizedRedirectPath(profileRole)} replace />;

  if (agentVerificationStatus === "suspended" && !hasRole("admin")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Account suspended</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your investor/property-owner workspace is temporarily unavailable. Contact support if you believe this is an error.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild><a href="mailto:support@1031exchangeup.com">Contact support</a></Button>
            <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <InvestorTopNav />
      {isDemo && hasRole("admin") && <div className="border-b bg-primary/10 px-4 py-1.5 text-center text-xs font-semibold text-primary">Investor / Owner Demo view — sample activity, fully separate from Live data.</div>}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8"><Outlet /></main>
    </div>
  );
}
