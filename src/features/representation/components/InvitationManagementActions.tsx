import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Ban, Clipboard, Mail, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cancelRepresentationInvite, sendRepresentationInvite, updateRepresentationInvite } from "../api";
import type { Representation, RepresentationInvite } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  representation: Representation;
  invite?: RepresentationInvite;
  onChanged?: () => Promise<void> | void;
}

export function InvitationManagementActions({ representation, invite, onChanged }: Props) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<"resend" | "cancel" | "edit" | null>(null);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(invite?.email ?? representation.agent_email ?? representation.investor_email);
  const [name, setName] = useState(invite?.direction === "investor_to_agent" ? (representation.agent_name ?? "") : "");

  if (!invite || !["pending", "expired"].includes(invite.status)) return null;

  const expired = invite.status === "expired" || new Date(invite.expires_at) <= new Date();
  const baseUrl = window.location.hostname === "localhost" ? "https://1031exchangeup.com" : window.location.origin;
  const inviteUrl = `${baseUrl}/representation-invite?token=${encodeURIComponent(invite.token)}`;

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["representation-invites"] }),
      queryClient.invalidateQueries({ queryKey: ["representations"] }),
      onChanged?.(),
    ]);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Secure invitation link copied.");
    } catch {
      toast.error("Your browser blocked clipboard access.");
    }
  }

  async function resend() {
    setBusy("resend");
    try {
      await sendRepresentationInvite(representation.id);
      toast.success(expired ? "Invitation renewed for 14 days and sent." : "Invitation email resent.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend the invitation.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    if (!confirm(`Cancel the invitation to ${invite.email}? The existing link will stop working immediately.`)) return;
    setBusy("cancel");
    try {
      await cancelRepresentationInvite(representation.id);
      toast.success("Invitation cancelled.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel the invitation.");
    } finally {
      setBusy(null);
    }
  }

  async function saveEmail(event: React.FormEvent) {
    event.preventDefault();
    setBusy("edit");
    try {
      await updateRepresentationInvite({ representationId: representation.id, email, name });
      toast.success("Invitation corrected and sent with a new secure link.");
      setEditing(false);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the invitation.");
    } finally {
      setBusy(null);
    }
  }

  const deliveryLabel = invite.delivery_status === "failed"
    ? "Delivery failed"
    : invite.delivery_status === "sent"
      ? "Email sent"
      : invite.delivery_status === "sending"
        ? "Sending"
        : invite.delivery_status === "unknown"
          ? "Delivery not tracked"
          : "Not emailed";

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={invite.delivery_status === "failed" ? "destructive" : "outline"}>{deliveryLabel}</Badge>
        <span className="text-xs text-muted-foreground">
          {expired ? "Expired" : `Expires ${formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}`}
          {invite.send_count > 0 ? ` · ${invite.send_count} delivery attempt${invite.send_count === 1 ? "" : "s"}` : ""}
        </span>
        <Button size="sm" variant="outline" onClick={copyLink} disabled={expired}><Clipboard className="mr-1.5 h-3.5 w-3.5" />{expired ? "Renew before copying" : "Copy link"}</Button>
        <Button size="sm" variant="outline" onClick={resend} disabled={busy !== null}><Mail className="mr-1.5 h-3.5 w-3.5" />{expired ? "Renew and send" : "Resend"}</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={busy !== null}><Pencil className="mr-1.5 h-3.5 w-3.5" />Correct email</Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={cancel} disabled={busy !== null}><Ban className="mr-1.5 h-3.5 w-3.5" />Cancel</Button>
        {invite.delivery_status === "failed" && invite.delivery_error_code && <p className="w-full text-xs text-destructive">Delivery issue: {invite.delivery_error_code.replace(/_/g, " ")}. You can correct the address or resend.</p>}
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <form onSubmit={saveEmail} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Correct invitation</DialogTitle>
              <DialogDescription>The old link will be invalidated and a fresh 14-day invitation will be emailed.</DialogDescription>
            </DialogHeader>
            {invite.direction === "investor_to_agent" && <div className="space-y-2"><Label htmlFor={`invite-name-${representation.id}`}>Agent name</Label><Input id={`invite-name-${representation.id}`} value={name} onChange={(event) => setName(event.target.value)} /></div>}
            <div className="space-y-2"><Label htmlFor={`invite-email-${representation.id}`}>Email address</Label><Input id={`invite-email-${representation.id}`} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(false)}>Close</Button><Button disabled={busy === "edit"}>{busy === "edit" ? "Updating…" : "Update and send"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
