import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDot,
  Clock3,
  Link2,
  MessageSquareText,
  Search,
  ShieldCheck,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { inviteRepresentingAgent, requestAgentReferral, setDefaultRepresentation, unassignAgentFromExchange } from "@/features/representation/api";
import { useAgentContactRequests, useExchangeAssignments, useRepresentationInvites, useRepresentations } from "@/features/representation/hooks/useRepresentations";
import {
  investorContactRequestStatusLabel,
  representationStatusLabel,
  type AgentContactRequest,
  type ExchangeAssignment,
  type Representation,
  type RepresentationInvite,
} from "@/features/representation/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrustProfileCard } from "@/components/profile/TrustProfileCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ClientAgentConversation } from "@/features/representation/components/ClientAgentConversation";
import { InvitationManagementActions } from "@/features/representation/components/InvitationManagementActions";
import { resolveListingName } from "@/lib/listingDisplay";

interface ExchangeOption {
  id: string;
  status: string;
  created_at: string;
  relinquished_property_id: string | null;
  label: string;
}

type AgentProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "phone" | "brokerage_name" | "brokerage_address" | "license_state" | "license_number" |
  "verification_status" | "profile_photo_url" | "profile_headline" | "bio" | "years_experience" | "completed_1031_exchanges" |
  "career_transaction_volume" | "specializations" | "service_areas"
>;
type PropertySummary = Pick<
  Tables<"pledged_properties_secure">,
  "id" | "property_name" | "address" | "address_is_public" | "city" | "state" | "zip" | "asset_type"
>;

const EMPTY_REPRESENTATIONS: Representation[] = [];
const EMPTY_ASSIGNMENTS: ExchangeAssignment[] = [];
const EMPTY_INVITES: RepresentationInvite[] = [];
const EMPTY_CONTACT_REQUESTS: AgentContactRequest[] = [];

const contactRequestGuidance: Record<AgentContactRequest["status"], string> = {
  waiting_for_agent: "Choose an agent before the other side can be contacted.",
  requested: "Your agent has the match and will review the opportunity.",
  accepted: "Your agent is reviewing the match and planning the next step.",
  awaiting_counterparty_agent: "Your agent is ready. The other owner is assigning an agent.",
  contacted: "Both agents can now coordinate directly on your behalf.",
  declined: "Your agent decided not to move forward with this match.",
  closed: "This outreach request is complete.",
};

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";
}

export default function InvestorRepresentation() {
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const queryClient = useQueryClient();
  const { data: representations = EMPTY_REPRESENTATIONS, isLoading } = useRepresentations("investor");
  const { data: assignments = EMPTY_ASSIGNMENTS } = useExchangeAssignments("investor");
  const { data: contactRequests = EMPTY_CONTACT_REQUESTS } = useAgentContactRequests("investor");
  const { data: invites = EMPTY_INVITES } = useRepresentationInvites();
  const [exchanges, setExchanges] = useState<ExchangeOption[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AgentProfile>>({});
  const [requestPropertyLabels, setRequestPropertyLabels] = useState<Record<string, string>>({});
  const [agentForm, setAgentForm] = useState({ name: "", email: "", assignFuture: true });
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [referralForm, setReferralForm] = useState({ exchangeId: "", location: "", propertyType: "", timing: "", notes: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [assignmentSelections, setAssignmentSelections] = useState<Record<string, string>>({});
  const [defaultRepresentationId, setDefaultRepresentationId] = useState("");
  const [assignFuture, setAssignFuture] = useState(true);
  const [activeView, setActiveView] = useState("overview");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: exchangeRows } = await supabase
        .from("exchanges")
        .select("id, status, created_at, relinquished_property_id")
        .eq("agent_id", user.id)
        .eq("owner_type", "investor")
        .eq("is_demo", isDemo)
        .order("created_at", { ascending: false });
      const propertyIds = (exchangeRows ?? []).map((row) => row.relinquished_property_id).filter(Boolean) as string[];
      const { data: properties } = propertyIds.length
        ? await supabase.from("pledged_properties_secure").select("id, property_name, address, address_is_public, city, state, zip, asset_type").in("id", propertyIds)
        : { data: [] as PropertySummary[] };
      const byId = new Map((properties ?? []).map((property) => [property.id, property]));
      setExchanges((exchangeRows ?? []).map((row) => {
        const property = row.relinquished_property_id ? byId.get(row.relinquished_property_id) : null;
        return {
          ...row,
          label: property ? resolveListingName(property, true) : `Exchange ${row.id.slice(0, 8)}`,
        };
      }));
    })();
  }, [user, isDemo]);

  useEffect(() => {
    const agentIds = [...new Set(representations.map((representation) => representation.agent_id).filter(Boolean))] as string[];
    if (!agentIds.length) return setProfiles({});
    supabase.from("profiles").select("id, full_name, email, phone, brokerage_name, brokerage_address, license_state, license_number, verification_status, profile_photo_url, profile_headline, bio, years_experience, completed_1031_exchanges, career_transaction_volume, specializations, service_areas").in("id", agentIds)
      .then(({ data }) => setProfiles(Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]))));
  }, [representations]);

  useEffect(() => {
    const propertyIds = [...new Set(contactRequests.map((request) => request.property_id))];
    if (!propertyIds.length) return setRequestPropertyLabels({});
    supabase.from("pledged_properties_secure").select("id, property_name, address, address_is_public, city, state, zip, asset_type").in("id", propertyIds)
      .then(({ data }) => setRequestPropertyLabels(Object.fromEntries((data ?? []).map((property) => [
        property.id,
        resolveListingName(property, false),
      ]))));
  }, [contactRequests]);

  const active = representations.find((representation) => representation.status === "active" && representation.is_default)
    ?? representations.find((representation) => representation.status === "active");
  const activeRepresentations = useMemo(() => representations.filter((representation) => representation.status === "active" && representation.agent_id), [representations]);
  const openRepresentations = useMemo(
    () => representations.filter((representation) => !["revoked", "declined", "expired"].includes(representation.status)),
    [representations],
  );
  const assignmentByExchange = useMemo(() => new Map(assignments.map((assignment) => [assignment.exchange_id, assignment])), [assignments]);
  const representationById = useMemo(() => new Map(representations.map((representation) => [representation.id, representation])), [representations]);
  const inviteByRepresentation = useMemo(() => new Map(invites.map((invite) => [invite.representation_id, invite])), [invites]);
  const pendingRepresentations = useMemo(
    () => openRepresentations.filter((representation) => representation.status !== "active"),
    [openRepresentations],
  );
  const activeContactRequests = useMemo(
    () => contactRequests.filter((request) => !["closed", "declined"].includes(request.status)),
    [contactRequests],
  );
  const activeAgentName = active
    ? profiles[active.agent_id!]?.full_name || active.agent_name || active.agent_email || "Your agent"
    : "Your agent";
  const activeAgentProfile = active?.agent_id ? profiles[active.agent_id] : undefined;
  const activeAgentAssignments = active
    ? assignments.filter((assignment) => assignment.representation_id === active.id).length
    : 0;
  const unassignedExchanges = useMemo(
    () => exchanges.filter((exchange) => !assignmentByExchange.has(exchange.id)),
    [assignmentByExchange, exchanges],
  );
  const actionRequiredCount = useMemo(() => {
    const confirmations = pendingRepresentations.filter((representation) => representation.status === "awaiting_investor_confirmation").length;
    const failedInvitations = pendingRepresentations.filter((representation) => inviteByRepresentation.get(representation.id)?.delivery_status === "failed").length;
    const requestsNeedingAgent = contactRequests.filter((request) => request.status === "waiting_for_agent").length;
    return confirmations + failedInvitations + (active ? unassignedExchanges.length : 0) + requestsNeedingAgent;
  }, [active, contactRequests, inviteByRepresentation, pendingRepresentations, unassignedExchanges.length]);

  useEffect(() => {
    const selectedDefault = representations.find((representation) => representation.status === "active" && representation.is_default);
    if (selectedDefault) {
      setDefaultRepresentationId(selectedDefault.id);
      setAssignFuture(selectedDefault.assign_future_exchanges);
    } else if (activeRepresentations[0] && !defaultRepresentationId) {
      setDefaultRepresentationId(activeRepresentations[0].id);
      setAssignFuture(activeRepresentations[0].assign_future_exchanges);
    }
  }, [representations, activeRepresentations, defaultRepresentationId]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["representations"] }),
      queryClient.invalidateQueries({ queryKey: ["exchange-agent-assignments"] }),
      queryClient.invalidateQueries({ queryKey: ["agent-contact-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["representation-invites"] }),
    ]);
  }

  async function sendInvite(event: React.FormEvent) {
    event.preventDefault();
    setBusy("invite");
    try {
      const result = await inviteRepresentingAgent({
        email: agentForm.email,
        name: agentForm.name,
        exchangeIds: selectedExchanges,
        assignFuture: agentForm.assignFuture,
        isDemo,
      });
      toast.success(result.emailWarning ? "Invitation created. Email delivery needs attention." : "Agent invitation sent.");
      setAgentForm({ name: "", email: "", assignFuture: true });
      setSelectedExchanges([]);
      await refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to invite this agent.");
    } finally {
      setBusy(null);
    }
  }

  async function requestReferral(event: React.FormEvent) {
    event.preventDefault();
    setBusy("referral");
    try {
      await requestAgentReferral({ ...referralForm, isDemo });
      toast.success("Your request is with our team. You can keep working while we find your agent.");
      setReferralForm({ exchangeId: "", location: "", propertyType: "", timing: "", notes: "" });
      await refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to request an agent.");
    } finally {
      setBusy(null);
    }
  }

  async function assignExchange(exchangeId: string, representationId: string) {
    const representation = representationById.get(representationId);
    if (!representation) return toast.error("Choose an active agent.");
    setBusy(exchangeId);
    const { error } = await supabase.rpc("assign_agent_to_exchange", {
      p_representation_id: representation.id,
      p_exchange_id: exchangeId,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(assignmentByExchange.has(exchangeId) ? "Exchange reassigned to the selected agent." : "Agent assigned to the exchange.");
    await refresh();
  }

  async function removeExchangeAgent(exchangeId: string) {
    if (!confirm("Remove this agent from the exchange? Active counterparty work for this exchange will be cancelled, while history remains available.")) return;
    setBusy(exchangeId);
    try {
      await unassignAgentFromExchange(exchangeId, "Removed from this exchange by investor");
      toast.success("Agent access removed from this exchange.");
      setAssignmentSelections((current) => ({ ...current, [exchangeId]: "" }));
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove this assignment.");
    } finally {
      setBusy(null);
    }
  }

  async function saveDefaultAgent() {
    if (!defaultRepresentationId) return toast.error("Choose an active agent.");
    setBusy("default-agent");
    try {
      await setDefaultRepresentation(defaultRepresentationId, assignFuture);
      toast.success(assignFuture ? "Default agent saved for future exchanges." : "Preferred agent saved without automatic assignment.");
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the default agent.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmReferral(representation: Representation, accept: boolean) {
    setBusy(representation.id);
    const { error } = await supabase.rpc("confirm_referred_agent", {
      p_representation_id: representation.id,
      p_accept: accept,
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(accept ? "Your agent is now connected." : "We'll continue looking for another agent.");
    await refresh();
  }

  async function endRepresentation(representation: Representation) {
    const assignedCount = assignments.filter((assignment) => assignment.representation_id === representation.id).length;
    const assignmentWarning = assignedCount
      ? ` They will be removed from ${assignedCount} exchange${assignedCount === 1 ? "" : "s"}, and active counterparty work on those exchanges may stop.`
      : " They currently have no exchange assignments.";
    const defaultWarning = representation.is_default && activeRepresentations.length > 1
      ? " You will also need to choose a new default agent."
      : "";
    if (!confirm(`End this agent relationship?${assignmentWarning}${defaultWarning} Historical activity will remain available.`)) return;
    setBusy(representation.id);
    const { error } = await supabase.rpc("revoke_representation", {
      p_representation_id: representation.id,
      p_reason: "Ended by investor",
    });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Representation ended. Historical activity was preserved.");
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Agent</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Work with your agent, follow match outreach, and control who can act on each exchange.</p>
      </div>

      {active ? (
        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-background to-background">
          <CardContent className="grid p-0 lg:grid-cols-[1fr_360px]">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border border-emerald-200 shadow-sm">{activeAgentProfile?.profile_photo_url ? <AvatarImage src={activeAgentProfile.profile_photo_url} alt={activeAgentName} /> : null}<AvatarFallback className="bg-emerald-100 font-semibold text-emerald-800">{initials(activeAgentName)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{activeAgentName}</h2>
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">{active.is_default ? "Default agent" : "Active agent"}</Badge>
                    {activeAgentProfile?.verification_status === "verified" && <Badge variant="outline" className="border-emerald-200 bg-background/70 text-emerald-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" />Verified</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{activeAgentProfile?.brokerage_name || active.agent_email}{activeAgentProfile?.license_state ? " · Licensed in " + activeAgentProfile.license_state : ""}</p>
                  <p className="mt-2 text-sm text-foreground/80">{activeAgentName} is your primary contact and can communicate with other agents for assigned exchanges.</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { setActiveView("messages"); window.setTimeout(() => document.getElementById("agent-conversation")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }}><MessageSquareText className="mr-2 h-4 w-4" />Message agent</Button>
                <Button size="sm" variant="outline" onClick={() => setActiveView("agents")}><ShieldCheck className="mr-2 h-4 w-4" />Agent details</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 border-t bg-background/60 lg:border-l lg:border-t-0">
              <div className="flex flex-col justify-center border-r p-4 text-center"><span className="text-xl font-semibold">{activeAgentAssignments}</span><span className="mt-1 text-xs text-muted-foreground">Exchange{activeAgentAssignments === 1 ? "" : "s"} covered</span></div>
              <div className="flex flex-col justify-center border-r p-4 text-center"><span className="text-xl font-semibold">{activeContactRequests.length}</span><span className="mt-1 text-xs text-muted-foreground">Open request{activeContactRequests.length === 1 ? "" : "s"}</span></div>
              <div className="flex flex-col justify-center p-4 text-center"><span className="text-xl font-semibold">{actionRequiredCount}</span><span className="mt-1 text-xs text-muted-foreground">Need{actionRequiredCount === 1 ? "s" : ""} attention</span></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert className="border-amber-200 bg-amber-50/50">
          <Link2 className="h-4 w-4 text-amber-700" />
          <AlertTitle>You do not need an agent until you are ready to contact a match</AlertTitle>
          <AlertDescription className="mt-1">Keep building exchanges and reviewing matches. When you are ready, invite your agent or ask us to help you find one.<Button size="sm" className="mt-3 block" onClick={() => setActiveView("agents")}>Connect an agent</Button></AlertDescription>
        </Alert>
      )}

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className={active ? "grid h-auto w-full grid-cols-2 rounded-xl p-1 sm:grid-cols-4" : "grid h-auto w-full grid-cols-2 rounded-xl p-1"}>
          <TabsTrigger value="overview" className="gap-2 py-2.5"><CircleDot className="h-4 w-4" />Overview{actionRequiredCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-800">{actionRequiredCount}</span>}</TabsTrigger>
          {active && <TabsTrigger value="messages" className="gap-2 py-2.5"><MessageSquareText className="h-4 w-4" />Messages</TabsTrigger>}
          {active && <TabsTrigger value="exchanges" className="gap-2 py-2.5"><Building2 className="h-4 w-4" />Exchange coverage</TabsTrigger>}
          <TabsTrigger value="agents" className="gap-2 py-2.5"><UsersRound className="h-4 w-4" />{active ? "Agent details" : "Connect an agent"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
      {actionRequiredCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Clock3 className="h-5 w-5 text-amber-700" />Needs your attention</CardTitle>
            <CardDescription>These items need a decision before your agent workflow can move forward.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {active && unassignedExchanges.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{unassignedExchanges.length} exchange{unassignedExchanges.length === 1 ? " needs" : "s need"} an agent</p><p className="mt-1 text-sm text-muted-foreground">Assign representation before asking an agent to contact a match.</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveView("exchanges")}>Review coverage</Button>
              </div>
            )}
            {pendingRepresentations.some((representation) => representation.status === "awaiting_investor_confirmation") && (
              <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">A referred agent is waiting for approval</p><p className="mt-1 text-sm text-muted-foreground">Confirm the relationship before the agent receives access.</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveView("agents")}>Review agent</Button>
              </div>
            )}
            {pendingRepresentations.some((representation) => inviteByRepresentation.get(representation.id)?.delivery_status === "failed") && (
              <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">An agent invitation was not delivered</p><p className="mt-1 text-sm text-muted-foreground">Correct the email or resend the invitation.</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveView("agents")}>Fix invitation</Button>
              </div>
            )}
            {contactRequests.some((request) => request.status === "waiting_for_agent") && (
              <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">A match request is waiting for representation</p><p className="mt-1 text-sm text-muted-foreground">Connect or assign an agent so outreach can begin.</p></div>
                <Button size="sm" variant="outline" onClick={() => setActiveView(active ? "exchanges" : "agents")}>Resolve request</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {contactRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquareText className="h-5 w-5" /> Match outreach
            </CardTitle>
            <CardDescription>
              See what is happening after you ask an agent to contact a match.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contactRequests.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">
                      {requestPropertyLabels[request.property_id] || "Matched property"}
                    </p>
                    <Badge variant={["declined", "closed"].includes(request.status) ? "outline" : "secondary"}>
                      {investorContactRequestStatusLabel[request.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{contactRequestGuidance[request.status]}</p>
                  {request.agent_note && <p className="mt-2 rounded-md bg-muted/70 px-3 py-2 text-sm"><span className="font-medium">Agent update:</span> {request.agent_note}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">Requested {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/investor/matches?match=${request.match_id}`}>View match</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {contactRequests.length === 0 && (
        <Card>
          <CardContent className="rounded-xl px-5 py-10 text-center">
            <MessageSquareText className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 font-medium">No match outreach yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">When you ask your agent to pursue a match, its progress will appear here.</p>
            <Button asChild size="sm" variant="outline" className="mt-4"><Link to="/investor/matches">Review matches</Link></Button>
          </CardContent>
        </Card>
      )}

      {pendingRepresentations.length > 0 && (
        <div className="space-y-3">
          <div><h2 className="text-lg font-semibold">Representation setup</h2><p className="mt-1 text-sm text-muted-foreground">Track invitations and referral requests that are still in progress.</p></div>
          <div className="grid gap-3">
          {pendingRepresentations.map((representation) => (
            <Card key={representation.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-5 w-5 text-amber-600" /><div><p className="text-sm font-semibold">{profiles[representation.agent_id ?? ""]?.full_name || representation.agent_name || representation.agent_email || "Agent referral request"}</p><p className="text-xs text-muted-foreground">{representationStatusLabel[representation.status]} · {representation.source.replace(/_/g, " ")}</p><InvitationManagementActions representation={representation} invite={inviteByRepresentation.get(representation.id)} onChanged={refresh} /></div></div>
                {representation.status === "awaiting_investor_confirmation" && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => confirmReferral(representation, false)} disabled={busy === representation.id}>Request someone else</Button><Button size="sm" onClick={() => confirmReferral(representation, true)} disabled={busy === representation.id}><CheckCircle2 className="mr-1.5 h-4 w-4" />Confirm agent</Button></div>}
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}
        </TabsContent>

        <TabsContent value="exchanges" className="mt-5 space-y-5">
      {activeRepresentations.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Agent for new exchanges</CardTitle><CardDescription>Choose who should be suggested when you create an exchange. Current assignments stay unchanged.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2"><Label htmlFor="default-agent">Default agent</Label><select id="default-agent" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={defaultRepresentationId} onChange={(event) => { const next = activeRepresentations.find((item) => item.id === event.target.value); setDefaultRepresentationId(event.target.value); setAssignFuture(next?.assign_future_exchanges ?? true); }}>{activeRepresentations.map((representation) => <option key={representation.id} value={representation.id}>{profiles[representation.agent_id ?? ""]?.full_name || representation.agent_name || representation.agent_email}</option>)}</select></div>
              <Button onClick={saveDefaultAgent} disabled={busy === "default-agent"}>{busy === "default-agent" ? "Saving…" : "Save default"}</Button>
            </div>
            <label className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm"><Checkbox checked={assignFuture} onCheckedChange={(checked) => setAssignFuture(checked === true)} /><span><strong>Automatically cover new exchanges</strong><span className="block text-xs text-muted-foreground">Your default agent will be assigned when a new exchange is created.</span></span></label>
          </CardContent>
        </Card>
      )}

      {exchanges.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Exchange assignments</CardTitle><CardDescription>Only the assigned agent can contact the other side for that exchange.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {exchanges.map((exchange) => {
              const assignment = assignmentByExchange.get(exchange.id);
              const assignedRepresentation = assignment ? representationById.get(assignment.representation_id) : undefined;
              const selectedId = assignmentSelections[exchange.id] ?? assignedRepresentation?.id ?? defaultRepresentationId;
              const assignedName = assignedRepresentation ? (profiles[assignedRepresentation.agent_id ?? ""]?.full_name || assignedRepresentation.agent_name || assignedRepresentation.agent_email) : null;
              const onlyRepresentation = activeRepresentations.length === 1 ? activeRepresentations[0] : null;
              return (
                <div key={exchange.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{exchange.label}</p><Badge variant={assignment ? "default" : "secondary"}>{assignment ? "Covered" : "Needs an agent"}</Badge></div>
                      <p className="mt-1 text-sm text-muted-foreground">{assignedName ? assignedName + " can contact matches for this exchange." : "Assign representation before requesting outreach on a match."}</p>
                    </div>
                    {activeRepresentations.length > 1 ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select aria-label={`Agent for ${exchange.label}`} className="h-9 min-w-[220px] rounded-md border bg-background px-3 text-sm" value={selectedId} onChange={(event) => setAssignmentSelections((current) => ({ ...current, [exchange.id]: event.target.value }))}><option value="">Choose an active agent</option>{activeRepresentations.map((representation) => <option key={representation.id} value={representation.id}>{profiles[representation.agent_id ?? ""]?.full_name || representation.agent_name || representation.agent_email}</option>)}</select>
                        <Button size="sm" variant="outline" onClick={() => assignExchange(exchange.id, selectedId)} disabled={busy === exchange.id || !selectedId || selectedId === assignedRepresentation?.id}>{assignment ? "Change agent" : "Assign"}</Button>
                        {assignment && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeExchangeAgent(exchange.id)} disabled={busy === exchange.id}>Remove coverage</Button>}
                      </div>
                    ) : onlyRepresentation ? (
                      assignment
                        ? <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeExchangeAgent(exchange.id)} disabled={busy === exchange.id}>Remove coverage</Button>
                        : <Button size="sm" variant="outline" onClick={() => assignExchange(exchange.id, onlyRepresentation.id)} disabled={busy === exchange.id}>Assign {profiles[onlyRepresentation.agent_id ?? ""]?.full_name || onlyRepresentation.agent_name || "my agent"}</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setActiveView("agents")}>Connect an agent</Button>
                    )}
                  </div>
                </div>
              );
            })}
            {!activeRepresentations.length && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Invite an agent or request a referral before assigning exchange access.</p>}
          </CardContent>
        </Card>
      )}

      {exchanges.length === 0 && (
        <Card>
          <CardContent className="px-5 py-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground/60" />
            <p className="mt-3 font-medium">No exchanges need coverage yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Create an exchange first. You can then decide which agent represents it.</p>
            <Button asChild size="sm" variant="outline" className="mt-4"><Link to="/investor/listings">Go to My Exchanges</Link></Button>
          </CardContent>
        </Card>
      )}

        </TabsContent>

        <TabsContent value="messages" className="mt-5" id="agent-conversation">
          {active ? <ClientAgentConversation representation={active} counterpartName={activeAgentName} /> : <Card><CardHeader><CardTitle className="text-lg">Messages with your agent</CardTitle><CardDescription>Your private conversation will appear here after an agent is connected.</CardDescription></CardHeader><CardContent><Button size="sm" onClick={() => setActiveView("agents")}>Connect an agent</Button></CardContent></Card>}
        </TabsContent>

        <TabsContent value="agents" className="mt-5 space-y-5">
          {activeRepresentations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{activeRepresentations.length === 1 ? "Your agent" : "Your agents"}</CardTitle>
                <CardDescription>
                  {activeRepresentations.length === 1
                    ? "This agent can represent you on assigned exchanges and communicate with the other side."
                    : "Each agent only receives access to the exchanges assigned to them."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeRepresentations.map((representation) => {
                  const assignmentCount = assignments.filter((assignment) => assignment.representation_id === representation.id).length;
                  return (
                    <div key={representation.id} className="rounded-xl border p-4">
                      <TrustProfileCard profile={profiles[representation.agent_id ?? ""]} roleLabel={representation.is_default ? "Default agent" : "Representing agent"} showContact />
                      <p className="mt-3 text-xs text-muted-foreground">Covers {assignmentCount} exchange{assignmentCount === 1 ? "" : "s"}</p>
                      <div className="flex flex-wrap gap-2">
                        {representation.id === active?.id && <Button size="sm" variant="outline" onClick={() => setActiveView("messages")}><MessageSquareText className="mr-1.5 h-4 w-4" />Message</Button>}
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => endRepresentation(representation)} disabled={busy === representation.id}>End relationship</Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Accordion type="single" collapsible defaultValue={active ? undefined : "connect-agent"}>
            <AccordionItem value="connect-agent" className="rounded-xl border px-5">
              <AccordionTrigger className="text-left hover:no-underline">
                <span><span className="block font-semibold">{active ? "Change or add representation" : "Connect an agent"}</span><span className="mt-1 block text-sm font-normal text-muted-foreground">{active ? "Only needed when replacing your agent or using different representation for another exchange." : "Invite your agent or ask the platform to help find one."}</span></span>
              </AccordionTrigger>
              <AccordionContent>
                {active && <Alert className="mb-5"><ShieldCheck className="h-4 w-4" /><AlertTitle>Most investors only need one agent</AlertTitle><AlertDescription>Add another only when a separate exchange requires different representation, or end the current relationship before replacing your agent.</AlertDescription></Alert>}
      <Tabs defaultValue="invite">
        <TabsList className="grid w-full max-w-lg grid-cols-2"><TabsTrigger value="invite"><UserRoundPlus className="mr-2 h-4 w-4" />Invite my agent</TabsTrigger><TabsTrigger value="referral"><Search className="mr-2 h-4 w-4" />Help me find an agent</TabsTrigger></TabsList>
        <TabsContent value="invite">
          <Card><CardHeader><CardTitle>Invite an agent you already work with</CardTitle><CardDescription>They will verify their agent account and explicitly accept before receiving access.</CardDescription></CardHeader><CardContent>
            <form className="space-y-5" onSubmit={sendInvite}>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="agent-name">Agent name</Label><Input id="agent-name" value={agentForm.name} onChange={(event) => setAgentForm((form) => ({ ...form, name: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="agent-email">Agent email *</Label><Input id="agent-email" type="email" required value={agentForm.email} onChange={(event) => setAgentForm((form) => ({ ...form, email: event.target.value }))} /></div></div>
              {exchanges.length > 0 && <div className="space-y-2"><Label>Exchange access</Label><div className="grid gap-2 rounded-lg border p-3">{exchanges.map((exchange) => <label key={exchange.id} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={selectedExchanges.includes(exchange.id)} onCheckedChange={(checked) => setSelectedExchanges((ids) => checked ? [...ids, exchange.id] : ids.filter((id) => id !== exchange.id))} />{exchange.label}</label>)}</div></div>}
              <label className="flex items-start gap-2 text-sm"><Checkbox checked={agentForm.assignFuture} onCheckedChange={(checked) => setAgentForm((form) => ({ ...form, assignFuture: checked === true }))} /><span><strong>Use as my default agent</strong><span className="block text-xs text-muted-foreground">Automatically assign this agent to new exchanges. You can change the assignment later.</span></span></label>
              <Button disabled={busy === "invite"}>{busy === "invite" ? "Sending invitation…" : "Send secure invitation"}</Button>
            </form>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="referral">
          <Card><CardHeader><CardTitle>Request an agent referral</CardTitle><CardDescription>Our team will review the exchange and introduce a verified agent. You approve the relationship before access begins.</CardDescription></CardHeader><CardContent>
            <form className="space-y-4" onSubmit={requestReferral}>
              <div className="space-y-2"><Label htmlFor="ref-exchange">Exchange</Label><select id="ref-exchange" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={referralForm.exchangeId} onChange={(event) => setReferralForm((form) => ({ ...form, exchangeId: event.target.value }))}><option value="">General representation request</option>{exchanges.map((exchange) => <option key={exchange.id} value={exchange.id}>{exchange.label}</option>)}</select></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="ref-location">Property state or market</Label><Input id="ref-location" value={referralForm.location} onChange={(event) => setReferralForm((form) => ({ ...form, location: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="ref-type">Property type</Label><Input id="ref-type" value={referralForm.propertyType} onChange={(event) => setReferralForm((form) => ({ ...form, propertyType: event.target.value }))} /></div></div>
              <div className="space-y-2"><Label htmlFor="ref-timing">Exchange timing</Label><Input id="ref-timing" placeholder="For example: planning to sell in 60 days" value={referralForm.timing} onChange={(event) => setReferralForm((form) => ({ ...form, timing: event.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="ref-notes">Anything our team should know</Label><Textarea id="ref-notes" rows={3} value={referralForm.notes} onChange={(event) => setReferralForm((form) => ({ ...form, notes: event.target.value }))} /></div>
              <Button disabled={busy === "referral"}><BriefcaseBusiness className="mr-2 h-4 w-4" />{busy === "referral" ? "Submitting…" : "Request an agent"}</Button>
            </form>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

      {!isLoading && representations.filter((representation) => ["revoked", "declined", "expired"].includes(representation.status)).length > 0 && <p className="text-xs text-muted-foreground">Previous relationships remain in the audit history. The most recent was updated {formatDistanceToNow(new Date(representations.at(-1)!.created_at), { addSuffix: true })}.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
