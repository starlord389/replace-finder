import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getUnauthorizedRedirectPath } from "@/app/routes/routeGuards";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminLayout() {
  const { user, hasRole, loading, profileRole } = useAuth();
  const isUnauthorized = !loading && (!user || !hasRole("admin"));

  useEffect(() => {
    if (isUnauthorized) {
      toast({ title: "You don't have admin access.", variant: "destructive" });
    }
  }, [isUnauthorized]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isUnauthorized) {
    return <Navigate to={getUnauthorizedRedirectPath(profileRole)} replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
