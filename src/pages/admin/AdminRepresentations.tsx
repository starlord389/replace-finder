import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Handshake, Loader2, Search, UserRoundCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { representationStatusLabel, type Representation } from "@/features/representation/types";
import { resolveListingName } from "@/lib/listingDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminProfile = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "brokerage_name" | "license_state">;
type Assignment = Tables<"exchange_agent_assignments">;
type Exchange = Tables<"exchanges">;
type Property = Tables<"pledged_properties">;
type QueueTab = "action" | "active" | "history";

const TERMINAL_STATUSES = new Set(["declined", "expired", "revoked"]);

export default function AdminRepresentations() {
  const [searchParams] = useSearchParams();
  const [representations, setRepresentations] = useState<Representation[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exchanges, setExchanges] = useState<Record<string, Exchange>>({});
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});
  const [agents, setAgents] = useState<AdminProfile[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AdminProfile>>({});
  const [selectedAgents, setSelectedAgents] = useState<Record<string, string>>({});
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [activeTab, setActiveTab] = useState<QueueTab>("action");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: reps, error: repError }, { data: roles }, { data: assignmentRows }] = await Promise.all([
      supabase.from("agent_representations").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id").eq("role", "agent"),
      supabase.from("exchange_agent_assignments").select("*").order("assigned_at", { ascending: false }),
    ]);
    if (repError) {
      toast.error(repError.message);
      setLoading(false);
      return;
    }
    const representationRows = (reps ?? []) as unknown as Representation[];
    const loadedAssignments = (assignmentRows ?? []) as Assignment[];
    const userIds = [...new Set([
      ...representationRows.flatMap((rep) => [rep.investor_id, rep.agent_id]),
      ...(roles ?? []).map((role) => role.user_id),
    ].filter((value): value is string => Boolean(value)))];
    const exchangeIds = [...new Set([
      ...representationRows.map((rep) => rep.requested_exchange_id),
      ...loadedAssignments.map((assignment) => assignment.exchange_id),
    ].filter((value): value is string => Boolean(value)))];
    const [{ data: profileRows }, { data: exchangeRows }] = await Promise.all([
      userIds.length ? supabase.from("profiles").select("id, full_name, email, brokerage_name, license_state").in("id", userIds) : Promise.resolve({ data: [] as AdminProfile[] }),
      exchangeIds.length ? supabase.from("exchanges").select("*").in("id", exchangeIds) : Promise.resolve({ data: [] as Exchange[] }),
    ]);
    const loadedExchanges = (exchangeRows ?? []) as Exchange[];
    const relinquishedIds = loadedExchanges.map((exchange) => exchange.relinquished_property_id).filter((value): value is string => Boolean(value));
    const propertyFilters = [
      exchangeIds.length ? `exchange_id.in.(${exchangeIds.join(",")})` : null,
      relinquishedIds.length ? `id.in.(${relinquishedIds.join(",")})` : null,
    ].filter((value): value is string => Boolean(value));
    const [{ data: propertyRows }, { data: matchRows }] = await Promise.all([
      propertyFilters.length ? supabase.from("pledged_properties").select("*").or(propertyFilters.join(",")) : Promise.resolve({ data: [] as Property[] }),
      exchangeIds.length ? supabase.from("matches").select("id, buyer_exchange_id").in("buyer_exchange_id", exchangeIds) : Promise.resolve({ data: [] as Array<{ id: string; buyer_exchange_id: string }> }),
    ]);
    const profileMap = Object.fromEntries((profileRows ?? []).map((profile) => [profile.id, profile]));
    const countMap: Record<string, number> = {};
    for (const match of matchRows ?? []) countMap[match.buyer_exchange_id] = (countMap[match.buyer_exchange_id] ?? 0) + 1;
    setProfiles(profileMap);
    setRepresentations(representationRows);
    setAssignments(loadedAssignments);
    setAgents((roles ?? []).map((role) => profileMap[role.user_id]).filter(Boolean));
    setExchanges(Object.fromEntries(loadedExchanges.map((exchange) => [exchange.id, exchange])));
    setProperties(Object.fromEntries(((propertyRows ?? []) as Property[]).map((property) => [property.id, property])));
    setMatchCounts(countMap);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { setSearch(searchParams.get("q") ?? ""); }, [searchParams]);

  const groupedCounts = useMemo(() => ({
    action: representations.filter((rep) => rep.status !== "active" && !TERMINAL_STATUSES.has(rep.status)).length,
    active: representations.filter((rep) => rep.status === "active").length,
    history: representations.filter((rep) => TERMINAL_STATUSES.has(rep.status)).length,
  }), [representations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return representations.filter((rep) => {
      const inTab = activeTab === "active" ? rep.status === "active" : activeTab === "history" ? TERMINAL_STATUSES.has(rep.status) : rep.status !== "active" && !TERMINAL_STATUSES.has(rep.status);
      if (!inTab) return false;
      const exchange = rep.requested_exchange_id ? exchanges[rep.requested_exchange_id] : null;
      const property = exchange ? resolveExchangeProperty(exchange, properties) : null;
      return !term || [rep.investor_email, rep.agent_email, profiles[rep.investor_id ?? ""]?.full_name, profiles[rep.agent_id ?? ""]?.full_name, rep.status, property ? resolveListingName(property, true) : null].some((value) => String(value ?? "").toLowerCase().includes(term));
    });
  }, [representations, activeTab, search, profiles, exchanges, properties]);

  async function assign(rep: Representation) {
    const agentId = selectedAgents[rep.id];
    if (!agentId) return toast.error("Choose an agent.");
    setBusy(rep.id);
    const { error } = await supabase.rpc("admin_assign_representation", { p_representation_id: rep.id, p_agent_id: agentId });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Referral sent to the selected agent.");
    await load();
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Representation Requests</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">A focused queue for connecting property owners with agents. Each record keeps the owner, requested exchange, current property, assigned agent, and next action together.</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Needs action" value={groupedCounts.action} detail="Waiting on an assignment or response" icon={UserRoundCheck} />
        <SummaryCard label="Active relationships" value={groupedCounts.active} detail="Owners currently represented" icon={Handshake} />
        <SummaryCard label="History" value={groupedCounts.history} detail="Declined, expired, or ended" icon={Users} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as QueueTab)}><TabsList><TabsTrigger value="action">Needs action ({groupedCounts.action})</TabsTrigger><TabsTrigger value="active">Active ({groupedCounts.active})</TabsTrigger><TabsTrigger value="history">History ({groupedCounts.history})</TabsTrigger></TabsList></Tabs>
        <div className="relative w-full lg:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search owner, agent, property, or status…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : <div className="space-y-3">
        {filtered.length === 0 && <Card className="border-dashed"><CardContent className="py-14 text-center"><Handshake className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="font-semibold">No records in this queue</p><p className="mt-1 text-sm text-muted-foreground">Try another status tab or search term.</p></CardContent></Card>}
        {filtered.map((rep) => <RepresentationQueueCard key={rep.id} rep={rep} profiles={profiles} assignments={assignments} exchanges={exchanges} properties={properties} matchCounts={matchCounts} agents={agents} selectedAgent={selectedAgents[rep.id] ?? ""} busy={busy === rep.id} onSelectAgent={(agentId) => setSelectedAgents((current) => ({ ...current, [rep.id]: agentId }))} onAssign={() => void assign(rep)} />)}
      </div>}
    </div>
  );
}

function RepresentationQueueCard({ rep, profiles, assignments, exchanges, properties, matchCounts, agents, selectedAgent, busy, onSelectAgent, onAssign }: {
  rep: Representation;
  profiles: Record<string, AdminProfile>;
  assignments: Assignment[];
  exchanges: Record<string, Exchange>;
  properties: Record<string, Property>;
  matchCounts: Record<string, number>;
  agents: AdminProfile[];
  selectedAgent: string;
  busy: boolean;
  onSelectAgent: (id: string) => void;
  onAssign: () => void;
}) {
  const investor = profiles[rep.investor_id ?? ""];
  const agent = profiles[rep.agent_id ?? ""];
  const representationAssignments = assignments.filter((assignment) => assignment.representation_id === rep.id);
  const requestedExchange = rep.requested_exchange_id ? exchanges[rep.requested_exchange_id] : representationAssignments[0] ? exchanges[representationAssignments[0].exchange_id] : null;
  const property = requestedExchange ? resolveExchangeProperty(requestedExchange, properties) : null;
  const nextStep = representationNextStep(rep);
  return <Card className="overflow-hidden"><CardContent className="p-0"><div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,.85fr)_minmax(260px,.7fr)]">
    <div className="border-b p-5 lg:border-b-0 lg:border-r"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Property owner</p><div className="mt-2 flex items-start justify-between gap-3"><div>{rep.investor_id ? <Link to={`/admin/users/${rep.investor_id}`} className="text-base font-semibold hover:text-primary hover:underline">{investor?.full_name || rep.investor_email}</Link> : <p className="text-base font-semibold">{rep.investor_email}</p>}<p className="mt-1 text-xs text-muted-foreground">{rep.source.replace(/_/g, " ")} · Created {formatDistanceToNow(new Date(rep.created_at), { addSuffix: true })}</p></div><div className="flex flex-wrap justify-end gap-2"><Badge variant={rep.status === "active" ? "default" : rep.status === "awaiting_agent" ? "destructive" : "secondary"}>{representationStatusLabel[rep.status]}</Badge>{rep.is_demo && <Badge variant="outline">Demo</Badge>}</div></div><div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Next action</p><p className="mt-1 text-sm font-medium text-slate-900">{nextStep.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{nextStep.detail}</p></div></div>
    <div className="border-b p-5 lg:border-b-0 lg:border-r"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Requested exchange</p>{property ? <><Link to={`/admin/properties/${property.id}`} className="mt-2 block text-sm font-semibold text-slate-950 hover:text-primary hover:underline">{resolveListingName(property, true)}</Link><p className="mt-1 text-xs text-muted-foreground">{[property.city, property.state].filter(Boolean).join(", ") || "Location not provided"} · {property.asset_type?.replace(/_/g, " ") || "Asset type not provided"}</p><div className="mt-3 flex items-center gap-3 text-xs text-slate-500"><span>{matchCounts[requestedExchange?.id ?? ""] ?? 0} matched opportunities</span><span>·</span><span className="capitalize">{requestedExchange?.status.replace(/_/g, " ")}</span></div></> : <><p className="mt-2 text-sm font-medium text-slate-700">No exchange selected</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This relationship applies to future exchanges or was created without a specific property request.</p></>}{requestedExchange && <Button asChild variant="ghost" size="sm" className="mt-3 px-0"><Link to={`/admin/opportunities/exchanges/${requestedExchange.id}`}>Open exchange workspace<ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button>}</div>
    <div className="p-5"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Representing agent</p>{agent ? <div className="mt-2"><Link to={`/admin/users/${agent.id}`} className="text-sm font-semibold text-slate-950 hover:text-primary hover:underline">{agent.full_name || agent.email}</Link><p className="mt-1 text-xs text-muted-foreground">{agent.brokerage_name || "Brokerage not provided"}{agent.license_state ? ` · ${agent.license_state}` : ""}</p><div className="mt-3 flex items-center gap-2"><Badge variant="outline">{representationAssignments.length} exchange {representationAssignments.length === 1 ? "assignment" : "assignments"}</Badge>{rep.is_default && <Badge variant="outline">Preferred agent</Badge>}</div></div> : <p className="mt-2 text-sm text-muted-foreground">No agent assigned</p>}{rep.status === "awaiting_agent" && <div className="mt-4 space-y-2"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={selectedAgent} onChange={(event) => onSelectAgent(event.target.value)}><option value="">Select agent…</option>{agents.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.full_name || candidate.email}{candidate.license_state ? ` · ${candidate.license_state}` : ""}</option>)}</select><Button className="w-full" size="sm" onClick={onAssign} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRoundCheck className="mr-2 h-4 w-4" />}Assign agent</Button></div>}</div>
  </div></CardContent></Card>;
}

function resolveExchangeProperty(exchange: Exchange, properties: Record<string, Property>) {
  return (exchange.relinquished_property_id ? properties[exchange.relinquished_property_id] : null) ?? Object.values(properties).find((property) => property.exchange_id === exchange.id) ?? null;
}

function representationNextStep(rep: Representation) {
  if (rep.status === "awaiting_agent") return { title: "Assign an agent", detail: "Choose an appropriate agent so the property owner can move forward with this exchange." };
  if (rep.status === "awaiting_acceptance") return { title: "Waiting for the agent", detail: "The selected agent must accept the representation before they can manage the exchange." };
  if (rep.status === "awaiting_investor_confirmation") return { title: "Waiting for the property owner", detail: "The owner needs to confirm the relationship before the exchange assignment becomes active." };
  if (rep.status === "pending_signup") return { title: "Waiting for account creation", detail: "The invited person must create and confirm their ExchangeUp account." };
  if (rep.status === "pending_verification") return { title: "Waiting for email confirmation", detail: "The invited agent must confirm their email address before the relationship can activate." };
  if (rep.status === "active") return { title: "Relationship active", detail: "The agent can manage assigned exchanges and communicate with listing-side agents." };
  return { title: "Relationship closed", detail: rep.ended_reason || "This representation is retained as relationship history." };
}

function SummaryCard({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Users }) {
  return <Card><CardContent className="flex items-start justify-between gap-3 p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><span className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700"><Icon className="h-4 w-4" /></span></CardContent></Card>;
}
