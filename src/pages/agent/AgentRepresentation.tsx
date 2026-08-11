import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock3, Handshake, MessageSquareText, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useRepresentations, useExchangeAssignments, useAgentContactRequests, useRepresentationInvites } from "@/features/representation/hooks/useRepresentations";
import {
  contactRequestStatusLabel,
  representationStatusLabel,
  type AgentContactRequest,
  type ExchangeAssignment,
  type Representation,
  type RepresentationInvite,
} from "@/features/representation/types";
import { startAgentConnection } from "@/features/representation/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientAgentConversation } from "@/features/representation/components/ClientAgentConversation";
import { InvitationManagementActions } from "@/features/representation/components/InvitationManagementActions";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { resolveListingName } from "@/lib/listingDisplay";

type InvestorProfile = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "phone" | "company">;
type PropertySummary = Pick<
  Tables<"pledged_properties_secure">,
  "id" | "property_name" | "address" | "address_is_public" | "city" | "state" | "zip" | "asset_type"
>;

const EMPTY_REPRESENTATIONS: Representation[] = [];
const EMPTY_ASSIGNMENTS: ExchangeAssignment[] = [];
const EMPTY_CONTACT_REQUESTS: AgentContactRequest[] = [];
const EMPTY_INVITES: RepresentationInvite[] = [];
const EMPTY_RELATIONSHIPS: Relationship[] = [];

export default function AgentRepresentation() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: representations = EMPTY_REPRESENTATIONS, isLoading } = useRepresentations("agent");
  const { data: assignments = EMPTY_ASSIGNMENTS } = useExchangeAssignments("agent");
  const { data: requests = EMPTY_CONTACT_REQUESTS } = useAgentContactRequests("agent");
  const { data: invites = EMPTY_INVITES } = useRepresentationInvites();
  const { data: relationships = EMPTY_RELATIONSHIPS, isLoading: relationshipsLoading } = useUnifiedRelationships("agent");
  const [profiles, setProfiles] = useState<Record<string, InvestorProfile>>({});
  const [propertyLabels, setPropertyLabels] = useState<Record<string, string>>({});
  const [exchangeLabels, setExchangeLabels] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequestTab, setSelectedRequestTab] = useState("overview");

  useEffect(() => {
    const requestId = searchParams.get("request");
    if (requestId && requests.some((request) => request.id === requestId)) {
      setSelectedRequestId(requestId);
    }
  }, [requests, searchParams]);

  function setRequestDialog(requestId: string | null) {
    setSelectedRequestId(requestId);
    setSelectedRequestTab("overview");
    const next = new URLSearchParams(searchParams);
    if (requestId) next.set("request", requestId);
    else next.delete("request");
    setSearchParams(next, { replace: true });
  }

  useEffect(() => {
    const investorIds = [...new Set(representations.map((representation) => representation.investor_id).filter(Boolean))] as string[];
    if (!investorIds.length) return setProfiles({});
    supabase.from("profiles").select("id, full_name, email, phone, company").in("id", investorIds)
      .then(({ data }) => setProfiles(Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]))));
  }, [representations]);

  useEffect(() => {
    const propertyIds = [...new Set(requests.map((request) => request.property_id))];
    if (!propertyIds.length) return setPropertyLabels({});
    supabase.from("pledged_properties_secure").select("id, property_name, address, address_is_public, city, state, zip, asset_type").in("id", propertyIds)
      .then(({ data }) => setPropertyLabels(Object.fromEntries((data ?? []).map((property) => [property.id, resolveListingName(property, false)]))));
  }, [requests]);

  useEffect(() => {
    const exchangeIds = [...new Set(assignments.map((assignment) => assignment.exchange_id))];
    if (!exchangeIds.length) return setExchangeLabels({});
    (async () => {
      const { data: exchangeRows } = await supabase.from("exchanges").select("id, relinquished_property_id").in("id", exchangeIds);
      const propertyIds = (exchangeRows ?? []).map((exchange) => exchange.relinquished_property_id).filter(Boolean) as string[];
      const { data: properties } = propertyIds.length
        ? await supabase.from("pledged_properties_secure").select("id, property_name, address, address_is_public, city, state, zip, asset_type").in("id", propertyIds)
        : { data: [] as PropertySummary[] };
      const propertyMap = new Map((properties ?? []).map((property) => [property.id, property]));
      setExchangeLabels(Object.fromEntries((exchangeRows ?? []).map((exchange) => {
        const property = exchange.relinquished_property_id ? propertyMap.get(exchange.relinquished_property_id) : null;
        return [exchange.id, property ? resolveListingName(property, false) : `Exchange ${exchange.id.slice(0, 8)}`];
      })));
    })();
  }, [assignments]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["representations"] }),
      queryClient.invalidateQueries({ queryKey: ["exchange-agent-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["agent-contact-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["unified-relationships"] }),
      queryClient.invalidateQueries({ queryKey: ["representation-invites"] }),
    ]);
  }

  async function respondToAssignment(representation: Representation, accept: boolean) {
    setBusy(representation.id);
    const { error } = await supabase.rpc("respond_to_representation_assignment", {
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
      if (connectionId) {
        toast.success("Conversation ready. You can message the listing agent now.");
        setSelectedRequestId(request.id);
        setSelectedRequestTab("conversation");
        const next = new URLSearchParams(searchParams);
        next.set("request", request.id);
        setSearchParams(next, { replace: true });
      }
      else toast.info("The other property owner is assigning an agent. This request was saved.");
      await refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to start the connection.");
    } finally {
      setBusy(null);
    }
  }

  async function declineRequest(request: (typeof requests)[number]) {
    const reason = prompt("Add a short explanation for your client (optional):");
    if (reason === null) return;
    setBusy(request.id);
    const { error } = await supabase.rpc("decline_agent_contact_request", {
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
    const { error } = await supabase.rpc("revoke_representation", {
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
  const inviteByRepresentation = useMemo(() => new Map(invites.map((invite) => [invite.representation_id, invite])), [invites]);
  const activeRepresentations = representations.filter((representation) => representation.status === "active");
  const actionableRequests = requests.filter((request) => ["requested", "accepted", "awaiting_counterparty_agent"].includes(request.status));
  const selectedRequest = selectedRequestId
    ? requests.find((request) => request.id === selectedRequestId) ?? null
    : null;
  const selectedRequestRel = selectedRequest
    ? relationships.find((relationship) => relationship.matchId === selectedRequest.match_id) ?? null
    : null;

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
                <InvitationManagementActions representation={representation} invite={inviteByRepresentation.get(representation.id)} onChanged={refresh} />
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
            return <Card key={request.id}><CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{propertyLabels[request.property_id] || "Matched property"}</p><Badge variant={request.status === "contacted" ? "default" : "secondary"}>{contactRequestStatusLabel[request.status]}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Requested by {investor?.full_name || investor?.email || "your client"} · {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}</p>{request.investor_note && <div className="mt-3 rounded-lg bg-muted p-3 text-sm"><span className="font-medium">Client note:</span> {request.investor_note}</div>}{request.agent_note && <p className="mt-2 text-xs text-muted-foreground">Your note: {request.agent_note}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setRequestDialog(request.id)}><MessageSquareText className="mr-1.5 h-4 w-4" />Review match</Button>{["requested", "accepted", "awaiting_counterparty_agent"].includes(request.status) && <><Button size="sm" variant="outline" onClick={() => declineRequest(request)} disabled={busy === request.id}>Pass</Button><Button size="sm" onClick={() => contactOtherAgent(request)} disabled={busy === request.id || !representation}><ShieldCheck className="mr-1.5 h-4 w-4" />Contact listing agent</Button></>}</div></CardContent></Card>;
          })}
        </TabsContent>
        <TabsContent value="clients" className="grid gap-3">
          {!isLoading && activeRepresentations.length === 0 ? <Card className="border-dashed"><CardContent className="py-12 text-center"><p className="font-semibold">No represented investors yet</p><p className="mt-1 text-sm text-muted-foreground">Open a saved client’s profile to invite them to a workspace, or accept a referral here.</p><Button asChild className="mt-4"><Link to="/agent/clients">Open My Clients</Link></Button></CardContent></Card> : activeRepresentations.map((representation) => {
            const investor = representation.investor_id ? profiles[representation.investor_id] : null;
            const clientAssignments = assignments.filter((assignment) => assignment.representation_id === representation.id);
            const count = clientAssignments.length;
            return <Card key={representation.id}><CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><div className="rounded-full bg-primary/10 p-2"><CheckCircle2 className="h-5 w-5 text-primary" /></div><div><p className="font-semibold">{investor?.full_name || representation.investor_email}</p><p className="text-xs text-muted-foreground">{investor?.company || representation.investor_email}</p>{clientAssignments.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{clientAssignments.map((assignment) => <Badge key={assignment.id} variant="outline">{exchangeLabels[assignment.exchange_id] || `Exchange ${assignment.exchange_id.slice(0, 8)}`}</Badge>)}</div>}</div></div><div className="flex flex-wrap items-center gap-3"><div className="text-right"><p className="text-sm font-semibold">{count} exchange{count === 1 ? "" : "s"}</p><p className="text-xs text-muted-foreground">Active representation</p></div><Button size="sm" variant="outline" onClick={() => setSelectedClientId(selectedClientId === representation.id ? null : representation.id)}>{selectedClientId === representation.id ? "Close chat" : "Message client"}</Button><Button size="sm" variant="ghost" onClick={() => endRepresentation(representation)} disabled={busy === representation.id}>End</Button></div></CardContent>{selectedClientId === representation.id && <div className="border-t p-4"><ClientAgentConversation representation={representation} counterpartName={investor?.full_name || "your client"} /></div>}</Card>;
          })}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequestId} onOpenChange={(open) => !open && setRequestDialog(null)}>
        <DialogContent className="max-w-6xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">
            Review client-requested match
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the property your client selected and continue the agent-to-agent workflow.
          </DialogDescription>
          {selectedRequest && (
            <div className="border-b border-border bg-primary/5 px-5 py-3">
              <p className="text-sm font-semibold text-foreground">
                Requested by {profiles[selectedRequest.investor_id]?.full_name || profiles[selectedRequest.investor_id]?.email || "your client"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your client has already reviewed this match. Review their request, then contact the listing agent if it is a fit.
              </p>
              {selectedRequest.investor_note && (
                <p className="mt-2 rounded-lg bg-background px-3 py-2 text-sm text-foreground">
                  <span className="font-medium">Client note:</span> {selectedRequest.investor_note}
                </p>
              )}
            </div>
          )}
          <div className="max-h-[84vh] overflow-y-auto p-3 sm:p-4">
            {selectedRequestRel ? (
              <PropertyReviewPanel
                key={`${selectedRequestRel.matchId}-${selectedRequestTab}`}
                rel={selectedRequestRel}
                initialTab={selectedRequestTab}
              />
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed p-8 text-center">
                <div>
                  <p className="font-semibold text-foreground">
                    {relationshipsLoading ? "Loading match…" : "Match unavailable"}
                  </p>
                  {!relationshipsLoading && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      This match may no longer be active or assigned to you.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
