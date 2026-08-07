import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock3, Handshake, MessageSquareText, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRepresentations, useExchangeAssignments, useAgentContactRequests } from "@/features/representation/hooks/useRepresentations";
import { contactRequestStatusLabel, representationStatusLabel, type Representation } from "@/features/representation/types";
import { startAgentConnection } from "@/features/representation/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientAgentConversation } from "@/features/representation/components/ClientAgentConversation";

export default function AgentRepresentation() {
  const queryClient = useQueryClient();
  const { data: representations = [], isLoading } = useRepresentations("agent");
  const { data: assignments = [] } = useExchangeAssignments("agent");
  const { data: requests = [] } = useAgentContactRequests("agent");
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [propertyLabels, setPropertyLabels] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  useEffect(() => {
    const investorIds = [...new Set(representations.map((representation) => representation.investor_id).filter(Boolean))] as string[];
    if (!investorIds.length) return setProfiles({});
    supabase.from("profiles").select("id, full_name, email, phone, company").in("id", investorIds)
      .then(({ data }) => setProfiles(Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]))));
  }, [representations]);

  useEffect(() => {
    const propertyIds = [...new Set(requests.map((request) => request.property_id))];
    if (!propertyIds.length) return setPropertyLabels({});
    supabase.from("pledged_properties_secure").select("id, property_name, city, state").in("id", propertyIds)
      .then(({ data }) => setPropertyLabels(Object.fromEntries((data ?? []).map((property) => [property.id, property.property_name || [property.city, property.state].filter(Boolean).join(", ") || "Matched property"]))));
  }, [requests]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["representations"] }),
      queryClient.invalidateQueries({ queryKey: ["exchange-agent-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["agent-contact-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["unified-relationships"] }),
    ]);
  }

  async function respondToAssignment(representation: Representation, accept: boolean) {
    setBusy(representation.id);
    const { error } = await supabase.rpc("respond_to_representation_assignment" as any, {
      p_representation_id: representation.id,
      p_accept: accept,
      p_reason: accept ? null : "Agent declined the assignment",
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(accept ? (representation.source === "platform_referral" ? "Accepted. The investor will confirm next." : "Client relationship activated.") : "Assignment declined.");
    await refresh();
  }

  async function contactOtherAgent(request: (typeof requests)[number]) {
    setBusy(request.id);
    try {
      const connectionId = await startAgentConnection(request.match_id, request.id);
      if (connectionId) toast.success("Connection request sent to the other agent.");
      else toast.info("The other property owner is assigning an agent. This request was saved.");
      await refresh();
    } catch (error: any) {
      toast.error(error.message ?? "Unable to start the connection.");
    } finally {
      setBusy(null);
    }
  }

  async function declineRequest(request: (typeof requests)[number]) {
    const reason = prompt("Add a short explanation for your client (optional):") ?? "";
    setBusy(request.id);
    const { error } = await supabase.rpc("decline_agent_contact_request" as any, {
      p_request_id: request.id,
      p_note: reason || null,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Your client was notified.");
    await refresh();
  }

  async function endRepresentation(representation: Representation) {
    if (!confirm("End this representation? Your exchange access and active counterparty work for this client will be removed.")) return;
    setBusy(representation.id);
    const { error } = await supabase.rpc("revoke_representation" as any, {
      p_representation_id: representation.id,
      p_reason: "Ended by agent",
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Representation ended and the client was notified.");
    if (selectedClientId === representation.id) setSelectedClientId(null);
    await refresh();
  }

  const pendingAssignments = representations.filter((representation) =>
    representation.source !== "agent_invite" && ["awaiting_acceptance", "pending_verification"].includes(representation.status),
  );
  const outgoingInvites = representations.filter((representation) =>
    representation.source === "agent_invite" && ["pending_signup", "awaiting_acceptance"].includes(representation.status),
  );
  const activeRepresentations = representations.filter((representation) => representation.status === "active");
  const actionableRequests = requests.filter((request) => ["requested", "accepted", "awaiting_counterparty_agent"].includes(request.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Client Representation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accept client relationships, act on client requests, and carry agent-to-agent conversations forward.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active clients</p><p className="mt-1 text-2xl font-bold">{activeRepresentations.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client requests</p><p className="mt-1 text-2xl font-bold">{actionableRequests.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned exchanges</p><p className="mt-1 text-2xl font-bold">{assignments.length}</p></CardContent></Card>
      </div>

      {pendingAssignments.map((representation) => {
        const investor = representation.investor_id ? profiles[representation.investor_id] : null;
        return <Card key={representation.id} className="border-amber-200 bg-amber-50/40"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="flex items-start gap-3"><div className="rounded-full bg-amber-100 p-2"><Clock3 className="h-5 w-5 text-amber-700" /></div><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{investor?.full_name || representation.investor_email}</p><Badge variant="outline">{representation.source.replace(/_/g, " ")}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{representationStatusLabel[representation.status]}</p></div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => respondToAssignment(representation, false)} disabled={busy === representation.id}><XCircle className="mr-1.5 h-4 w-4" />Decline</Button><Button size="sm" onClick={() => respondToAssignment(representation, true)} disabled={busy === representation.id}><UserRoundCheck className="mr-1.5 h-4 w-4" />Accept client</Button></div></CardContent></Card>;
      })}

      {outgoingInvites.map((representation) => (
        <Card key={representation.id} className="border-blue-200 bg-blue-50/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2"><Clock3 className="h-5 w-5 text-blue-700" /></div>
              <div>
                <p className="font-semibold">Invitation sent to {representation.investor_email}</p>
                <p className="mt-1 text-sm text-muted-foreground">They will appear as an active represented client after accepting the invitation.</p>
              </div>
            </div>
            <Badge variant="outline">Awaiting investor</Badge>
          </CardContent>
        </Card>
      ))}

      <Tabs defaultValue="requests">
        <TabsList><TabsTrigger value="requests">Client requests{actionableRequests.length ? ` (${actionableRequests.length})` : ""}</TabsTrigger><TabsTrigger value="clients">Represented clients</TabsTrigger></TabsList>
        <TabsContent value="requests" className="space-y-3">
          {requests.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center py-14 text-center"><Handshake className="mb-3 h-10 w-10 text-muted-foreground/40" /><h2 className="font-semibold">No client contact requests</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">When a represented investor asks you to contact the other side, the match and financial context will appear here.</p></CardContent></Card> : requests.map((request) => {
            const representation = representations.find((item) => item.investor_id === request.investor_id && item.status === "active");
            const investor = profiles[request.investor_id];
            return <Card key={request.id}><CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{propertyLabels[request.property_id] || "Matched property"}</p><Badge variant={request.status === "contacted" ? "default" : "secondary"}>{contactRequestStatusLabel[request.status]}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Requested by {investor?.full_name || investor?.email || "your client"} · {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}</p>{request.investor_note && <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><span className="font-medium">Client note:</span> {request.investor_note}</div>}{request.agent_note && <p className="mt-2 text-xs text-muted-foreground">Your note: {request.agent_note}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link to={`/agent/matches?match=${request.match_id}`}><MessageSquareText className="mr-1.5 h-4 w-4" />Review match</Link></Button>{["requested", "accepted", "awaiting_counterparty_agent"].includes(request.status) && <><Button size="sm" variant="outline" onClick={() => declineRequest(request)} disabled={busy === request.id}>Pass</Button><Button size="sm" onClick={() => contactOtherAgent(request)} disabled={busy === request.id || !representation}><ShieldCheck className="mr-1.5 h-4 w-4" />Contact listing agent</Button></>}</div></CardContent></Card>;
          })}
        </TabsContent>
        <TabsContent value="clients" className="grid gap-3">
          {!isLoading && activeRepresentations.length === 0 ? <Card className="border-dashed"><CardContent className="py-12 text-center"><p className="font-semibold">No represented investors yet</p><p className="mt-1 text-sm text-muted-foreground">Invite a client from My Clients or accept a referral here.</p><Button asChild className="mt-4"><Link to="/agent/clients/new">Invite a client</Link></Button></CardContent></Card> : activeRepresentations.map((representation) => {
            const investor = representation.investor_id ? profiles[representation.investor_id] : null;
            const count = assignments.filter((assignment) => assignment.representation_id === representation.id).length;
            return <Card key={representation.id}><CardContent className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><CheckCircle2 className="h-5 w-5 text-primary" /></div><div><p className="font-semibold">{investor?.full_name || representation.investor_email}</p><p className="text-xs text-muted-foreground">{investor?.company || representation.investor_email}</p></div></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-sm font-semibold">{count} exchange{count === 1 ? "" : "s"}</p><p className="text-xs text-muted-foreground">Active representation</p></div><Button size="sm" variant="outline" onClick={() => setSelectedClientId(selectedClientId === representation.id ? null : representation.id)}>{selectedClientId === representation.id ? "Close chat" : "Message client"}</Button><Button size="sm" variant="ghost" onClick={() => endRepresentation(representation)} disabled={busy === representation.id}>End</Button></div></CardContent>{selectedClientId === representation.id && <div className="border-t p-4"><ClientAgentConversation representation={representation} counterpartName={investor?.full_name || "your client"} /></div>}</Card>;
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
