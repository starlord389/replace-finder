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
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, launchpad_completed_at, verification_status")
        .eq("id", user.id)
        .single();

      const target =
        profile?.role === "agent"
          ? getAgentPostLoginRoute(
              profile.launchpad_completed_at,
              profile.verification_status,
            )
          : getDefaultRouteForRole(profile?.role);

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
