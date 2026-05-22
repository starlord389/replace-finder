import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getAgentPostLoginRoute,
  getDefaultRouteForRole,
} from "@/app/routes/routeManifest";
import { trackEvent } from "@/lib/telemetry";

export default function AuthCallback() {
  const { loading, user } = useAuth();
  const navigate = useNavigate();
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (resolvedRef.current) return;
    if (loading) return;

    if (!user) {
      resolvedRef.current = true;
      navigate("/login", { replace: true });
      return;
    }

    resolvedRef.current = true;

    (async () => {
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("launchpad_completed_at, verification_status")
          .eq("id", user.id)
          .single(),
      ]);
      const roles = roleRows?.map((r) => r.role) ?? [];
      const primary = roles.includes("admin") ? "admin" : roles.includes("agent") ? "agent" : roles[0];

      const target =
        primary === "agent"
          ? getAgentPostLoginRoute(
              profile?.launchpad_completed_at,
              profile?.verification_status,
            )
          : getDefaultRouteForRole(primary);

      trackEvent("auth_callback_redirect", { target });
      navigate(target, { replace: true });
    })();
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F4F2EE]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
