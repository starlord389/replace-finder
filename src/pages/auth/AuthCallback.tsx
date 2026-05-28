import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getAgentPostLoginRoute,
  getDefaultRouteForRole,
} from "@/app/routes/routeManifest";
import { trackEvent } from "@/lib/telemetry";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type CallbackState = "loading" | "routing" | "error";

export default function AuthCallback() {
  const { loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const resolvedRef = useRef(false);
  const [state, setState] = useState<CallbackState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const resolveRoute = async () => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setState("routing");
    setErrorMessage("");

    try {
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("profiles")
          .select("launchpad_completed_at, verification_status")
          .eq("id", user.id)
          .maybeSingle(),
      ]);

      const roles = roleRows?.map((r) => r.role) ?? [];
      const primary = roles.includes("admin")
        ? "admin"
        : roles.includes("agent")
          ? "agent"
          : roles[0];

      const target =
        primary === "agent"
          ? getAgentPostLoginRoute(
              profile?.launchpad_completed_at,
              profile?.verification_status,
            )
          : getDefaultRouteForRole(primary);

      trackEvent("auth_callback_redirect", { target });
      navigate(target, { replace: true });
    } catch (err: any) {
      console.error("[AuthCallback] post-confirmation routing failed", err);
      setState("error");
      setErrorMessage(
        err?.message ?? "Something went wrong while setting up your account.",
      );
    }
  };

  useEffect(() => {
    if (resolvedRef.current) return;
    if (authLoading) return;

    resolvedRef.current = true;
    resolveRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleRetry = () => {
    resolvedRef.current = false;
    resolveRoute();
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  if (state === "error") {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-foreground">
            We hit a snag
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your account is verified, but we couldn't finish setting up your
            dashboard. This is usually temporary.
          </p>
          {errorMessage && (
            <p className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              {errorMessage}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={handleRetry} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full gap-2"
            >
              <Home className="h-4 w-4" />
              Go to homepage
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Still stuck?{" "}
            <a
              href="mailto:support@1031exchangeup.com"
              className="underline hover:text-foreground"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">
          {state === "routing" ? "Finishing setup…" : "Confirming your account…"}
        </p>
      </div>
    </div>
  );
}
