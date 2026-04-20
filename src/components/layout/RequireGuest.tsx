import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDefaultRouteForRole } from "@/app/routes/routeManifest";

export default function RequireGuest() {
  const { user, loading, profileRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F2EE]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={getDefaultRouteForRole(profileRole)} replace />;
  }

  return <Outlet />;
}
