import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Handshake,
  MailPlus,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { inviteExistingInvestorClient } from "@/features/representation/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// This route creates the internal client record needed for listings and matches.
// Giving that client a login remains a separate, optional choice in this flow or
// later from their saved client profile.
export default function AgentClientDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [inviteToPlatform, setInviteToPlatform] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !name.trim()) return;
    if (inviteToPlatform && !email.trim()) {
      toast.error("Enter an email address to send the client a workspace invitation.");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("agent_clients")
      .insert({
        agent_id: user.id,
        client_name: name.trim(),
        client_email: email.trim() || null,
        client_phone: phone.trim() || null,
        notes: notes.trim() || null,
        is_demo: isDemo,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSaving(false);
      toast.error(error?.message ?? "Failed to add client");
      return;
    }

    if (inviteToPlatform) {
      try {
        const result = await inviteExistingInvestorClient(data.id);
        if (result.emailWarning) {
          toast.warning("Client added, but invitation delivery needs attention in Client Requests.");
        } else {
          toast.success("Client added and workspace invitation sent.");
        }
      } catch (inviteError) {
        toast.warning(
          inviteError instanceof Error
            ? `Client added, but the invitation was not sent: ${inviteError.message}`
            : "Client added, but the workspace invitation was not sent.",
        );
      }
    } else {
      toast.success("Client added. You can now create their listing.");
    }

    setSaving(false);
    navigate(`/agent/clients/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/agent/clients">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Client</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create the client record you need to add listings and manage their exchange.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client information</CardTitle>
            <CardDescription>
              Only the client name is required. Contact information can be added now or later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Client name <span className="text-muted-foreground">(required)</span>
              </Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-describedby="client-email-help"
              />
              <p id="client-email-help" className="text-xs leading-relaxed text-muted-foreground">
                Add an email to send matching properties directly to this client from ExchangeUp. You can
                always add it later.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Any notes about this client's exchange goals, timeline, etc."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-primary/20 bg-primary/[0.025]">
          <button
            type="button"
            className="flex w-full items-start gap-3 p-5 text-left transition-colors hover:bg-primary/[0.035]"
            onClick={() => setInvitePanelOpen((open) => !open)}
            aria-expanded={invitePanelOpen}
          >
            <div className="rounded-lg bg-primary/10 p-2">
              <MailPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">Want to invite this client to the platform?</p>
                <Badge variant="secondary">Optional</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Give them their own investor workspace while you remain the agent representing them.
              </p>
            </div>
            {invitePanelOpen ? (
              <ChevronUp className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
            )}
          </button>

          {invitePanelOpen ? (
            <CardContent className="space-y-4 border-t bg-background/70 p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <InviteBenefit
                  icon={Building2}
                  title="Add their properties"
                  description="Your client can create and manage their own exchange listings."
                />
                <InviteBenefit
                  icon={Search}
                  title="Review their matches"
                  description="They can evaluate opportunities and ask you to move a match forward."
                />
                <InviteBenefit
                  icon={Handshake}
                  title="Stay their preferred agent"
                  description="Once accepted, you are connected as their default agent for agent-to-agent deal communication."
                />
              </div>

              <label
                htmlFor="invite-client-workspace"
                className="flex cursor-pointer items-start gap-3 rounded-lg border bg-background p-4"
              >
                <Checkbox
                  id="invite-client-workspace"
                  checked={inviteToPlatform}
                  onCheckedChange={(checked) => setInviteToPlatform(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">
                    Send a workspace invitation after adding this client
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    They will receive an email invitation. Nothing is shared until they accept.
                  </span>
                </span>
              </label>

              {inviteToPlatform && !email.trim() ? (
                <p className="text-xs font-medium text-amber-700">
                  Add the client’s email above so we know where to send the invitation.
                </p>
              ) : null}
            </CardContent>
          ) : null}
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving || !name.trim() || (inviteToPlatform && !email.trim())}>
            {saving
              ? inviteToPlatform ? "Adding client and sending invitation…" : "Adding client…"
              : inviteToPlatform ? "Add Client & Send Invitation" : "Add Client"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {inviteToPlatform ? "The client record is created first, then the invitation is sent." : "No account or email invitation will be created."}
          </p>
        </div>
      </form>
    </div>
  );
}

function InviteBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
