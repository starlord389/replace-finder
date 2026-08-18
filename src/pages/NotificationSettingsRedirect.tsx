import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * Stable, role-agnostic destination for "manage your email preferences" links
 * inside emails. Sends the user to the notification settings that match their role.
 */
export default function NotificationSettingsRedirect() {
  const { user, loading, isAgent } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login?redirect=/settings/notifications" replace />;
  return <Navigate to={isAgent ? "/agent/settings" : "/investor/settings#notifications"} replace />;
}
