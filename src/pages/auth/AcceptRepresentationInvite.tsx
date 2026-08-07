import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InvitePreview {
  direction: "agent_to_investor" | "investor_to_agent";
  email: string;
  status: string;
  expires_at: string;
  inviter_name: string | null;
  inviter_company: string | null;
}

export default function AcceptRepresentationInvite() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, agentVerificationStatus } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setError("This invitation link is incomplete."); setLoading(false); return; }
    (async () => {
      const { data, error: previewError } = await supabase.rpc("get_representation_invite" as any, { p_token: token });
      const row = (Array.isArray(data) ? data[0] : data) as InvitePreview | undefined;
      if (previewError || !row) setError("This invitation is invalid or has been removed.");
      else if (row.status !== "pending") setError("This invitation has already been used.");
      else if (new Date(row.expires_at) <= new Date()) setError("This invitation has expired. Ask the sender for a new invitation.");
      else setInvite(row);
      setLoading(false);
    })();
  }, [token]);

  async function accept() {
    if (!token || !invite) return;
    if (user?.email?.toLowerCase() !== invite.email.toLowerCase()) return toast.error(`Sign in as ${invite.email} to accept this invitation.`);
    setSubmitting(true);
    const { error: acceptError } = await supabase.rpc("accept_representation_invite" as any, { p_token: token });
    setSubmitting(false);
    if (acceptError) return toast.error(acceptError.message);
    toast.success("Representation connected successfully.");
    navigate(invite.direction === "investor_to_agent" ? "/agent/representation" : "/investor/representation");
  }

  async function signup(event: React.FormEvent) {
    event.preventDefault();
    if (!invite || !token) return;
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setSubmitting(true);
    const role = invite.direction === "investor_to_agent" ? "agent" : "investor";
    const { data, error: signupError } = await supabase.auth.signUp({
      email: invite.email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/representation-invite?token=${encodeURIComponent(token)}`,
        data: { full_name: fullName.trim(), role },
      },
    });
    setSubmitting(false);
    if (signupError) return toast.error(signupError.message);
    if (data.session) {
      toast.success("Account created. Accept the invitation to finish connecting.");
      window.location.reload();
    } else {
      toast.success("Check your email to confirm your account, then return to this invitation.");
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (error) return <div className="mx-auto flex min-h-screen max-w-md items-center p-6"><Card className="w-full"><CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive" />Invite unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><Link to="/">Go to homepage</Link></Button></CardContent></Card></div>;
  if (!invite) return null;

  const invitedAsAgent = invite.direction === "investor_to_agent";
  const inviter = [invite.inviter_name, invite.inviter_company].filter(Boolean).join(" · ") || (invitedAsAgent ? "An investor" : "An agent");

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <Card className="w-full">
        <CardHeader><div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10"><ShieldCheck className="h-5 w-5 text-primary" /></div><CardTitle>{invitedAsAgent ? "Represent an investor" : "Connect with your agent"}</CardTitle><CardDescription>{inviter} invited you to share an exchange workspace. Ownership stays with the investor, and counterparty conversations remain agent-to-agent.</CardDescription></CardHeader>
        <CardContent>
          {user ? <div className="space-y-4"><div className="rounded-lg border bg-muted/30 p-3 text-sm">Signed in as <strong>{user.email}</strong></div>{invitedAsAgent && agentVerificationStatus !== "verified" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Agent verification required.</strong> Complete your agent profile before accepting this representation.</div>}<Button className="w-full" onClick={accept} disabled={submitting || (invitedAsAgent && agentVerificationStatus !== "verified")}><CheckCircle2 className="mr-2 h-4 w-4" />{submitting ? "Connecting…" : "Accept and connect workspace"}</Button>{invitedAsAgent && agentVerificationStatus !== "verified" && <Button asChild variant="outline" className="w-full"><Link to="/agent/launchpad">Complete agent setup</Link></Button>}</div> : <form className="space-y-4" onSubmit={signup}><div className="space-y-2"><Label>Email</Label><Input value={invite.email} disabled /></div><div className="space-y-2"><Label htmlFor="invite-name">Full name</Label><Input id="invite-name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="invite-password">Create password</Label><Input id="invite-password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><p className="text-xs text-muted-foreground">At least 8 characters.</p></div><Button className="w-full" disabled={submitting}>{submitting ? "Creating account…" : `Create ${invitedAsAgent ? "agent" : "investor"} account`}</Button><p className="text-center text-xs text-muted-foreground">Already registered? <Link className="text-primary hover:underline" to={`/login?next=${encodeURIComponent(`/representation-invite?token=${token}`)}`}>Sign in</Link></p></form>}
        </CardContent>
      </Card>
    </div>
  );
}
