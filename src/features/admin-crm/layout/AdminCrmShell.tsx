import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import AdminCrmHeader from "./AdminCrmHeader";
import AdminCrmSidebar from "./AdminCrmSidebar";
import { AdminCrmScopeProvider, useAdminCrmScope } from "./AdminCrmScope";

export default function AdminCrmShell() {
  const { user, hasRole, loading, profileRole } = useAuth();
  const unauthorized = !loading && (!user || !hasRole("admin"));

  useEffect(() => {
    if (unauthorized) toast({ title: "You don't have admin access.", variant: "destructive" });
  }, [unauthorized]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (unauthorized) return <Navigate to={getUnauthorizedRedirectPath(profileRole)} replace />;

  return <AdminCrmScopeProvider><AdminCrmFrame /></AdminCrmScopeProvider>;
}

function AdminCrmFrame() {
  const { isDemo } = useAdminCrmScope();
  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 lg:block"><AdminCrmSidebar /></aside>
      <div className="min-w-0 lg:pl-64">
        <AdminCrmHeader />
        {isDemo && <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950 sm:px-6">Demo workspace · Sample records are isolated from live platform activity.</div>}
        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 xl:px-8"><Outlet /></main>
      </div>
    </div>
  );
}
