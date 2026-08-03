import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import InvestorTopNav from "./InvestorTopNav";

export default function InvestorLayout() {
  const { user, loading, profileRole, hasRole } = useAuth();
  const { isDemo, setMode } = useWorkspaceMode();

  useEffect(() => {
    if (!loading && !hasRole("admin") && isDemo) setMode("live");
  }, [hasRole, isDemo, loading, setMode]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole("investor")) return <Navigate to={getUnauthorizedRedirectPath(profileRole)} replace />;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <InvestorTopNav />
      {isDemo && hasRole("admin") && <div className="bg-[#16284a] px-4 py-1.5 text-center text-xs font-semibold text-white">Investor Demo view — sample activity, fully separate from Live data.</div>}
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8"><Outlet /></main>
    </div>
  );
}
