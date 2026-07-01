import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getAgentPostLoginRoute, getDefaultRouteForRole } from "@/app/routes/routeManifest";
import { trackEvent } from "@/lib/telemetry";
import { isEmailConfirmationError } from "@/lib/agentVerification";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Stop the countdown interval if the user leaves the page mid-cooldown.
  useEffect(() => {
    return () => {
      if (cooldownTimer.current !== null) window.clearInterval(cooldownTimer.current);
    };
  }, []);

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    if (error) {
      toast({ title: "Couldn't resend email", description: error.message, variant: "destructive" });
      return;
    }
    setCooldown(60);
    if (cooldownTimer.current !== null) window.clearInterval(cooldownTimer.current);
    cooldownTimer.current = window.setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownTimer.current !== null) window.clearInterval(cooldownTimer.current);
          cooldownTimer.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    toast({ title: "Verification email sent", description: `We resent the confirmation link to ${email}.` });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirmation(false);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      trackEvent("auth_login_failure", { message: error.message });
      const unconfirmed = isEmailConfirmationError(error.message);
      if (unconfirmed) setNeedsConfirmation(true);
      toast({
        title: unconfirmed ? "Confirm your email first" : "Login failed",
        description: unconfirmed
          ? "Open the confirmation email we sent when you created your account, or resend it below."
          : error.message,
        variant: "destructive",
      });
      return;
    }

    // Route based on role (from user_roles) + profile flags
    let target = "/agent";
    if (data.user) {
      try {
        const [{ data: roleRows }, { data: profile }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", data.user.id),
          supabase
            .from("profiles")
            .select("launchpad_completed_at, verification_status")
            .eq("id", data.user.id)
            .maybeSingle(),
        ]);
        const roles = roleRows?.map((r) => r.role) ?? [];
        const primary = roles.includes("admin") ? "admin" : roles.includes("agent") ? "agent" : roles[0];
        target = primary === "agent"
          ? getAgentPostLoginRoute(profile?.launchpad_completed_at, profile?.verification_status)
          : getDefaultRouteForRole(primary);
      } catch (err) {
        console.error("[Login] post-login routing query failed", err);
      }
    }

    setLoading(false);
    trackEvent("auth_login_success", { target });
    navigate(target, { replace: true });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#f4f7fb] px-4 py-12">
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm">
          <Card className="border-[#e8edf3] bg-white/90 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to access your agent workspace.
                </p>
              </div>
              <form onSubmit={handleLogin} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="focus-visible:ring-[#43a047]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="focus-visible:ring-[#43a047]"
                  />
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#56657a] hover:text-[#16284a] hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#43a047] text-white hover:bg-[#3a8c3e]"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
              {needsConfirmation && (
                <div className="mt-4 rounded-xl border border-[#e8edf3] bg-[#43a047]/15 p-4 text-left">
                  <p className="text-sm font-medium text-foreground">
                    Your email isn't verified yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click the link in the confirmation email we sent to{" "}
                    <span className="font-medium text-foreground">{email || "your inbox"}</span>.
                    Check spam too. If you can't find it, resend below.
                  </p>
                  <Button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0 || !email}
                    className="mt-3 w-full bg-[#43a047] text-white hover:bg-[#3a8c3e]"
                  >
                    {resending
                      ? "Resending…"
                      : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : "Resend verification email"}
                  </Button>
                </div>
              )}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-medium text-[#16284a] hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
