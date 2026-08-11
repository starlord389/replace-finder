import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock3, MailPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inviteExistingInvestorClient } from "@/features/representation/api";
import { useRepresentationInvites } from "@/features/representation/hooks/useRepresentations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  clientId: string;
  clientUserId: string | null;
  onSaved?: (info: { client_name: string; client_email: string | null; client_phone: string | null }) => void;
}

export function ClientProfileTab({ clientId, clientUserId, onSaved }: Props) {
  const queryClient = useQueryClient();
  const { data: invitations = [], refetch: refetchInvitations } = useRepresentationInvites();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const workspaceInvite = invitations.find((invitation) =>
    invitation.direction === "agent_to_investor" && invitation.metadata?.client_id === clientId,
  );
  const workspaceConnected = Boolean(clientUserId) || workspaceInvite?.status === "accepted";
  const workspaceInvitePending = workspaceInvite?.status === "pending";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("agent_clients")
        .select("client_name, client_email, client_phone, notes")
        .eq("id", clientId)
        .single();
      if (cancelled) return;
      if (data) {
        setName(data.client_name ?? "");
        setEmail(data.client_email ?? "");
        setSavedEmail(data.client_email ?? "");
        setPhone(data.client_phone ?? "");
        setNotes(data.notes ?? "");
      }
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
    }).eq("id", clientId);
    setSavingInfo(false);
    if (error) { toast.error("Failed to save"); return; }
    const info = {
      client_name: name.trim(),
      client_email: email.trim() || null,
      client_phone: phone.trim() || null,
    };
    setSavedEmail(info.client_email ?? "");
    onSaved?.(info);
    // The client's name shows on listings, matches, and the pipeline - refresh them.
    for (const key of ["unified-relationships", "agent-listings", "agent-exchanges", "agent-pipeline"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
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

  const sendWorkspaceInvite = async () => {
    if (!email.trim()) {
      toast.error("Add and save the client’s email before sending a workspace invitation.");
      return;
    }
    if (email.trim().toLowerCase() !== savedEmail.trim().toLowerCase()) {
      toast.error("Save the updated email before sending the invitation.");
      return;
    }
    setSendingInvite(true);
    try {
      const result = await inviteExistingInvestorClient(clientId);
      await Promise.all([
        refetchInvitations(),
        queryClient.invalidateQueries({ queryKey: ["representations"] }),
      ]);
      if (result.emailWarning) {
        toast.warning("Invitation created, but email delivery needs attention. Manage it from Client Requests.");
      } else {
        toast.success("Workspace invitation sent.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send workspace invitation");
    } finally {
      setSendingInvite(false);
    }
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
            </div>
            <Button type="submit" disabled={savingInfo || !name.trim()}>
              {savingInfo ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              {workspaceConnected ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : workspaceInvitePending ? (
                <Clock3 className="h-5 w-5 text-primary" />
              ) : (
                <MailPlus className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">
                {workspaceConnected
                  ? "Client workspace connected"
                  : workspaceInvitePending
                    ? "Workspace invitation pending"
                    : "Invite this client to their own workspace"}
              </CardTitle>
              <CardDescription className="mt-1">
                {workspaceConnected
                  ? "You and your client can collaborate while you remain the agent handling counterparty communication."
                  : workspaceInvitePending
                    ? `An invitation was sent to ${workspaceInvite.email}. You can resend it, correct the email, or copy the link from Client Requests.`
                    : "Optional: your client can review their exchanges and matches in an investor workspace while you continue managing listings and agent-to-agent communication."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 pt-0">
          {workspaceConnected || workspaceInvitePending ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/agent/representation">Manage in Client Requests</Link>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={sendWorkspaceInvite}
              disabled={sendingInvite || !email.trim() || email.trim().toLowerCase() !== savedEmail.trim().toLowerCase()}
            >
              <MailPlus className="mr-2 h-4 w-4" />
              {sendingInvite ? "Sending invitation…" : "Send Workspace Invitation"}
            </Button>
          )}
          {!workspaceConnected && !workspaceInvitePending && !email.trim() ? (
            <p className="self-center text-xs text-muted-foreground">Save an email address first.</p>
          ) : !workspaceConnected && !workspaceInvitePending && email.trim().toLowerCase() !== savedEmail.trim().toLowerCase() ? (
            <p className="self-center text-xs text-muted-foreground">Save the email change before inviting.</p>
          ) : null}
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
            placeholder="e.g. Targeting $5M stabilized multifamily in Texas. Prefers assumable debt."
          />
          <Button onClick={saveNotes} disabled={savingNotes}>
            {savingNotes ? "Saving…" : "Save Notes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
