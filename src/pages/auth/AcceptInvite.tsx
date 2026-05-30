import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [agentName, setAgentName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }
    (async () => {
      const { data: inv } = await supabase
        .from("client_invites")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (!inv) {
        setError("This invite is invalid or has been removed.");
        setLoading(false);
        return;
      }
      if (inv.status !== "pending") {
        setError("This invite has already been used.");
        setLoading(false);
        return;
      }
      if (new Date(inv.expires_at) < new Date()) {
        setError("This invite has expired. Ask your agent to send a new one.");
        setLoading(false);
        return;
      }

      setInvite(inv);

      const { data: agent } = await supabase
        .from("profiles")
        .select("full_name, brokerage_name")
        .eq("id", inv.agent_id)
        .maybeSingle();
      if (agent) {
        setAgentName([agent.full_name, agent.brokerage_name].filter(Boolean).join(" · "));
      }

      setLoading(false);
    })();
  }, [token]);

  // If user is already signed in, just link the invite to their account
  const handleLinkExistingAccount = async () => {
    if (!user || !invite) return;
    setSubmitting(true);

    const updates = await Promise.all([
      supabase
        .from("agent_clients")
        .update({ client_user_id: user.id })
        .eq("id", invite.client_id),
      supabase
        .from("client_invites")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_user_id: user.id,
        })
        .eq("id", invite.id),
    ]);

    setSubmitting(false);
    if (updates.some((r) => r.error)) {
      toast.error("Failed to accept invite. Please try again.");
      return;
    }
    toast.success("Invite accepted!");
    navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName.trim(), role: "client" },
      },
    });

    if (signUpErr || !signUpData.user) {
      setSubmitting(false);
      toast.error(signUpErr?.message ?? "Failed to create account");
      return;
    }

    // Link invite + client record
    await Promise.all([
      supabase
        .from("agent_clients")
        .update({ client_user_id: signUpData.user.id })
        .eq("id", invite.client_id),
      supabase
        .from("client_invites")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_user_id: signUpData.user.id,
        })
        .eq("id", invite.id),
    ]);

    setSubmitting(false);
    toast.success("Account created! Check your email to confirm and then sign in.");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Invite unavailable</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Go to homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <CardTitle>You've been invited</CardTitle>
          </div>
          <CardDescription>
            {agentName ? <strong>{agentName}</strong> : "Your agent"} invited you to view your 1031
            exchange progress on 1031ExchangeUp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You're already signed in as <strong>{user.email}</strong>. Link this invite to your
                account?
              </p>
              <Button onClick={handleLinkExistingAccount} disabled={submitting} className="w-full">
                {submitting ? "Linking…" : "Accept invite"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={invite.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Choose a Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Creating account…" : "Create account & accept invite"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
