import { useState } from "react";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      trackEvent("auth_login_failure", { message: error.message });
      toast({
        title: isEmailConfirmationError(error.message) ? "Confirm your email first" : "Login failed",
        description: isEmailConfirmationError(error.message)
          ? "Open the confirmation email we sent when you created your account, then sign in to access your agent workspace."
          : error.message,
        variant: "destructive",
      });
      return;
    }

    // Route based on profile role
    let target = "/agent";
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, launchpad_completed_at, verification_status")
        .eq("id", data.user.id)
        .single();
      target = profile?.role === "agent"
        ? getAgentPostLoginRoute(profile.launchpad_completed_at, profile.verification_status)
        : getDefaultRouteForRole(profile?.role);
    }

    setLoading(false);
    trackEvent("auth_login_success", { target });
    navigate(target);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#F4F2EE] px-4 py-12">
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-sm">
          <Card className="border-[#d7c9b1] bg-white/90 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to access your self-certified agent workspace.
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
                    className="focus-visible:ring-[#39484d]"
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
                    className="focus-visible:ring-[#39484d]"
                  />
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#5d5d5d] hover:text-[#1d1d1d] hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#1d1d1d] text-white hover:bg-[#39484d]"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign In"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="font-medium text-[#1d1d1d] hover:underline">
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
