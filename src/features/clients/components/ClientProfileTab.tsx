import { useEffect, useState } from "react";
import { Copy, Check as CheckIcon, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ClientInvite {
  id: string;
  token: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
}

interface Props {
  clientId: string;
}

export function ClientProfileTab({ clientId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [invite, setInvite] = useState<ClientInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data }, { data: inviteRows }] = await Promise.all([
        supabase
          .from("agent_clients")
          .select("client_name, client_email, client_phone, client_company, notes, client_user_id")
          .eq("id", clientId)
          .single(),
        supabase
          .from("client_invites")
          .select("id, token, status, expires_at, accepted_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      if (cancelled) return;
      if (data) {
        setName(data.client_name ?? "");
        setEmail(data.client_email ?? "");
        setPhone(data.client_phone ?? "");
        setCompany(data.client_company ?? "");
        setNotes(data.notes ?? "");
        setClientUserId(data.client_user_id);
      }
      setInvite(inviteRows?.[0] ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    const { error } = await supabase.from("agent_clients").update({
      client_name: name.trim(),
      client_email: email.trim() || null,
      client_phone: phone.trim() || null,
      client_company: company.trim() || null,
    }).eq("id", clientId);
    setSavingInfo(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Contact info saved");
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    const { error } = await supabase.from("agent_clients").update({
      notes: notes.trim() || null,
    }).eq("id", clientId);
    setSavingNotes(false);
    if (error) { toast.error("Failed to save notes"); return; }
    toast.success("Notes saved");
  };

  const generateToken = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleCreateInvite = async () => {
    if (!email.trim()) {
      toast.error("Add an email for this client first.");
      return;
    }
    setCreatingInvite(true);
    const { data: userData } = await supabase.auth.getUser();
    const agentId = userData.user?.id;
    if (!agentId) { setCreatingInvite(false); return; }
    const token = generateToken();
    const { data, error } = await supabase
      .from("client_invites")
      .insert({
        client_id: clientId,
        agent_id: agentId,
        email: email.trim(),
        token,
        status: "pending",
      })
      .select("id, token, status, expires_at, accepted_at")
      .single();
    setCreatingInvite(false);
    if (error || !data) { toast.error("Failed to create invite"); return; }
    setInvite(data);
    toast.success("Invite link generated");
  };

  const inviteUrl = invite
    ? `${window.location.origin}/auth/accept-invite?token=${invite.token}`
    : "";

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
          <CardDescription>The basics for reaching this client.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveInfo} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={savingInfo || !name.trim()}>
              {savingInfo ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
          <CardDescription>Private notes about exchange goals, timeline, preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="e.g. Targeting $5M multifamily in Texas. 45-day deadline approaching in October."
          />
          <Button onClick={saveNotes} disabled={savingNotes}>
            {savingNotes ? "Saving…" : "Save Notes"}
          </Button>
        </CardContent>
      </Card>

      {!clientUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Access</CardTitle>
            <CardDescription>
              Invite {name || "this client"} to create an account and view their exchange progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invite && invite.status === "pending" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input readOnly value={inviteUrl} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyInvite}>
                    {copied ? <CheckIcon className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(invite.expires_at).toLocaleDateString()}.
                </p>
                <Button variant="ghost" size="sm" onClick={handleCreateInvite} disabled={creatingInvite}>
                  {creatingInvite ? "Generating…" : "Regenerate link"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={handleCreateInvite} disabled={creatingInvite || !email.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {creatingInvite ? "Generating…" : "Generate invite link"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {clientUserId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Access</CardTitle>
            <CardDescription>This client has accepted their invite and has account access.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
