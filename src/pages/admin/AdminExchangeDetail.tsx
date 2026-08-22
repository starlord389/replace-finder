import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { STAGE_DEFS, type StageKey } from "@/features/pipeline/lib/pipelineStages";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Handshake,
  ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { recordAdminAction } from "@/features/admin/hooks/useAdminOperations";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import {
  exchangeManagedForLabel,
  exchangeOwnerTypeLabel,
  isInvestorOwned,
} from "@/features/admin/lib/accountTypes";
import { getListingLocationLabel, resolveListingName } from "@/lib/listingDisplay";
import { useAdminCrmScope } from "@/features/admin-crm/layout/AdminCrmScope";

interface DiagRow {
  direction: "buyer" | "seller";
  candidate_property_id: string;
  candidate_exchange_id: string | null;
  candidate_label: string;
  status: "matched" | "skipped";
  reason: string;
  total?: number;
  roe_improvement_pp?: number | null;
}
interface DiagResult {
  matches_for_exchange: number;
  matches_from_property: number;
  total_new_matches: number;
  total_archived_matches: number;
  total_active_matches: number;
  dry_run: boolean;
  top_matches: Array<{ property_id: string; exchange_id: string; direction: string; score: number; roe_improvement_pp?: number | null }>;
  diagnostics: DiagRow[] | null;
}

type Profile = Tables<"profiles">;
type Property = Tables<"pledged_properties">;
type Financials = Tables<"property_financials">;
type PropertyImage = Tables<"property_images">;
type PropertyDocument = Tables<"property_documents">;

function byId<T extends { id: string }>(rows: T[]) {
  return Object.fromEntries(rows.map((row) => [row.id, row])) as Record<string, T>;
}

function byProperty<T extends { property_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((grouped, row) => {
    (grouped[row.property_id] ??= []).push(row);
    return grouped;
  }, {});
}

function uniqueById<T extends { id: string }>(rows: T[]) {
  return [...new Map(rows.map((row) => [row.id, row])).values()];
}

const EXCHANGE_STATUSES = ["draft", "active", "in_identification", "in_closing", "completed", "failed", "cancelled"];

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  connected: "bg-green-100 text-green-800 border-green-200",
  contacted: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  awaiting_representation: "bg-amber-100 text-amber-800 border-amber-200",
  awaiting_counterparty_agent: "bg-amber-100 text-amber-800 border-amber-200",
  in_identification: "bg-amber-100 text-amber-800 border-amber-200",
  in_closing: "bg-blue-100 text-blue-800 border-blue-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
  revoked: "bg-slate-100 text-slate-700 border-slate-200",
};

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : "-";
}
function fmtDateTime(d: string | null | undefined) {
  return d ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "-";
}
function money(n: number | null | undefined) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : "-";
}
function pretty(s: string | null | undefined) {
  return s ? s.replace(/_/g, " ") : "-";
}
function percent(n: number | null | undefined, scale = 1) {
  return n != null ? `${(n * scale).toFixed(2)}%` : "-";
}
function eligibilityReasons(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (value && typeof value === "object") {
    return Object.values(value).flatMap((item) => {
      if (typeof item === "string") return [item];
      if (Array.isArray(item)) return item.filter((entry): entry is string => typeof entry === "string");
      return [];
    });
  }
  return [];
}

export default function AdminExchangeDetail() {
  const { scope, isDemo } = useAdminCrmScope();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exchange, setExchange] = useState<Tables<"exchanges"> | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Tables<"agent_clients"> | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [criteria, setCriteria] = useState<Tables<"replacement_criteria"> | null>(null);
  const [matches, setMatches] = useState<Tables<"matches">[]>([]);
  const [connections, setConnections] = useState<Tables<"exchange_connections">[]>([]);
  const [timeline, setTimeline] = useState<Tables<"exchange_timeline">[]>([]);
  const [financialsByProperty, setFinancialsByProperty] = useState<Record<string, Financials>>({});
  const [imagesByProperty, setImagesByProperty] = useState<Record<string, PropertyImage[]>>({});
  const [documentsByProperty, setDocumentsByProperty] = useState<Record<string, PropertyDocument[]>>({});
  const [propertiesById, setPropertiesById] = useState<Record<string, Property>>({});
  const [relatedExchangesById, setRelatedExchangesById] = useState<Record<string, Tables<"exchanges">>>({});
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [assignments, setAssignments] = useState<Tables<"exchange_agent_assignments">[]>([]);
  const [representations, setRepresentations] = useState<Tables<"agent_representations">[]>([]);
  const [contactRequests, setContactRequests] = useState<Tables<"agent_contact_requests">[]>([]);
  const [connectionIntents, setConnectionIntents] = useState<Tables<"agent_connection_intents">[]>([]);
  const [dataWarnings, setDataWarnings] = useState<string[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [runningMatch, setRunningMatch] = useState(false);
  const [matchResult, setMatchResult] = useState<DiagResult | null>(null);
  const loadRequestRef = useRef(0);

  const load = useCallback(async (exchangeId: string) => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setLoadError(null);
    setExchange(null);
    setDataWarnings([]);
    const { data: ex, error } = await supabase.from("exchanges").select("*").eq("id", exchangeId).maybeSingle();
    if (requestId !== loadRequestRef.current) return;
    if (error) {
      setLoadError(error.message || "The exchange record could not be loaded.");
      toast({ title: "Couldn't load this exchange.", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!ex) {
      setLoadError("This exchange does not exist or is no longer available.");
      setLoading(false);
      return;
    }
    if (ex.is_demo !== isDemo) {
      setLoadError(`This exchange belongs to the ${ex.is_demo ? "Demo" : "Live"} workspace. Switch workspace mode to open it.`);
      setLoading(false);
      return;
    }
    setExchange(ex);
    const [ownerResult, clientResult, propertyResult, criteriaResult, connectionsResult, timelineResult, assignmentsResult, contactResult, intentResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", ex.agent_id).maybeSingle(),
      ex.client_id
        ? supabase.from("agent_clients").select("*").eq("id", ex.client_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      ex.relinquished_property_id
        ? supabase.from("pledged_properties").select("*").eq("id", ex.relinquished_property_id).maybeSingle()
        : supabase.from("pledged_properties").select("*").eq("exchange_id", exchangeId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("replacement_criteria").select("*").eq("exchange_id", exchangeId).limit(1).maybeSingle(),
      supabase.from("exchange_connections").select("*").or(`buyer_exchange_id.eq.${exchangeId},seller_exchange_id.eq.${exchangeId}`),
      supabase.from("exchange_timeline").select("*").eq("exchange_id", exchangeId).order("created_at", { ascending: false }),
      supabase.from("exchange_agent_assignments").select("*").eq("exchange_id", exchangeId).order("assigned_at", { ascending: false }),
      supabase.from("agent_contact_requests").select("*").eq("exchange_id", exchangeId).order("requested_at", { ascending: false }),
      supabase.from("agent_connection_intents").select("*").or(`buyer_exchange_id.eq.${exchangeId},seller_exchange_id.eq.${exchangeId},waiting_exchange_id.eq.${exchangeId}`).order("created_at", { ascending: false }),
    ]);

    const currentProperty = propertyResult.data ?? null;
    const matchFilter = currentProperty
      ? `buyer_exchange_id.eq.${exchangeId},seller_property_id.eq.${currentProperty.id}`
      : `buyer_exchange_id.eq.${exchangeId}`;
    const matchQuery = await supabase.from("matches").select("*").or(matchFilter).order("total_score", { ascending: false });
    const matchRows = matchQuery.data ?? [];
    const matchIds = matchRows.map((match) => match.id);

    const [matchConnectionsResult, matchContactsResult, matchIntentsResult] = matchIds.length
      ? await Promise.all([
          supabase.from("exchange_connections").select("*").in("match_id", matchIds),
          supabase.from("agent_contact_requests").select("*").in("match_id", matchIds),
          supabase.from("agent_connection_intents").select("*").in("match_id", matchIds),
        ])
      : [
          { data: [] as Tables<"exchange_connections">[], error: null },
          { data: [] as Tables<"agent_contact_requests">[], error: null },
          { data: [] as Tables<"agent_connection_intents">[], error: null },
        ];

    const allConnections = uniqueById([...(connectionsResult.data ?? []), ...(matchConnectionsResult.data ?? [])]);
    const allContactRequests = uniqueById([...(contactResult.data ?? []), ...(matchContactsResult.data ?? [])]);
    const allIntents = uniqueById([...(intentResult.data ?? []), ...(matchIntentsResult.data ?? [])]);
    const propertyIds = [...new Set([
      currentProperty?.id,
      ...matchRows.map((match) => match.seller_property_id),
      ...matchRows.map((match) => match.relinquished_property_id),
    ].filter((value): value is string => Boolean(value)))];

    const [propertiesResult, financialsResult, imagesResult, documentsResult] = propertyIds.length
      ? await Promise.all([
          supabase.from("pledged_properties").select("*").in("id", propertyIds),
          supabase.from("property_financials").select("*").in("property_id", propertyIds),
          supabase.from("property_images").select("*").in("property_id", propertyIds).order("sort_order", { ascending: true }),
          supabase.from("property_documents").select("*").in("property_id", propertyIds).order("created_at", { ascending: false }),
        ])
      : [
          { data: [] as Property[], error: null },
          { data: [] as Financials[], error: null },
          { data: [] as PropertyImage[], error: null },
          { data: [] as PropertyDocument[], error: null },
        ];

    const propertyRows = uniqueById([
      ...(propertiesResult.data ?? []),
      ...(currentProperty ? [currentProperty] : []),
    ]);
    const relatedExchangeIds = [...new Set(propertyRows.map((row) => row.exchange_id).filter((value): value is string => Boolean(value)))];
    const relatedExchangeResult = relatedExchangeIds.length
      ? await supabase.from("exchanges").select("*").in("id", relatedExchangeIds)
      : { data: [] as Tables<"exchanges">[], error: null };

    const representationIds = [...new Set((assignmentsResult.data ?? []).map((assignment) => assignment.representation_id))];
    const [requestedRepresentationsResult, assignedRepresentationsResult, accountRepresentationsResult] = await Promise.all([
      supabase.from("agent_representations").select("*").eq("requested_exchange_id", exchangeId),
      representationIds.length
        ? supabase.from("agent_representations").select("*").in("id", representationIds)
        : Promise.resolve({ data: [] as Tables<"agent_representations">[], error: null }),
      isInvestorOwned(ex.owner_type)
        ? supabase.from("agent_representations").select("*").eq("investor_id", ex.agent_id)
        : clientResult.data?.client_user_id
          ? supabase.from("agent_representations").select("*").eq("agent_id", ex.agent_id).eq("investor_id", clientResult.data.client_user_id)
          : Promise.resolve({ data: [] as Tables<"agent_representations">[], error: null }),
    ]);
    const representationRows = uniqueById([
      ...(requestedRepresentationsResult.data ?? []),
      ...(assignedRepresentationsResult.data ?? []),
      ...(accountRepresentationsResult.data ?? []),
    ]);

    const profileIds = [...new Set([
      ex.agent_id,
      clientResult.data?.client_user_id,
      ...matchRows.flatMap((match) => [match.buyer_agent_id, match.seller_agent_id]),
      ...allConnections.flatMap((connection) => [connection.buyer_agent_id, connection.seller_agent_id]),
      ...(assignmentsResult.data ?? []).flatMap((assignment) => [assignment.agent_id, assignment.investor_id]),
      ...allContactRequests.flatMap((request) => [request.investor_id, request.representing_agent_id]),
      ...allIntents.flatMap((intent) => [intent.initiating_agent_id, intent.waiting_owner_id]),
      ...representationRows.flatMap((representation) => [representation.agent_id, representation.investor_id, representation.invited_by]),
      ...propertyRows.map((row) => row.agent_id),
      ...(relatedExchangeResult.data ?? []).map((row) => row.agent_id),
    ].filter((value): value is string => Boolean(value)))];
    const profilesResult = profileIds.length
      ? await supabase.from("profiles").select("*").in("id", profileIds)
      : { data: [] as Profile[], error: null };

    const warnings = [
      ownerResult.error,
      clientResult.error,
      propertyResult.error,
      criteriaResult.error,
      connectionsResult.error,
      timelineResult.error,
      assignmentsResult.error,
      contactResult.error,
      intentResult.error,
      matchQuery.error,
      matchConnectionsResult.error,
      matchContactsResult.error,
      matchIntentsResult.error,
      propertiesResult.error,
      financialsResult.error,
      imagesResult.error,
      documentsResult.error,
      relatedExchangeResult.error,
      requestedRepresentationsResult.error,
      assignedRepresentationsResult.error,
      accountRepresentationsResult.error,
      profilesResult.error,
    ].filter((item): item is { message: string } => Boolean(item));

    const profileRows = uniqueById([
      ...(profilesResult.data ?? []),
      ...(ownerResult.data ? [ownerResult.data] : []),
    ]);
    if (requestId !== loadRequestRef.current) return;
    const propertyMap = byId(propertyRows);
    setOwnerProfile(profileRows.find((profile) => profile.id === ex.agent_id) ?? null);
    setClient(clientResult.data ?? null);
    setProperty(currentProperty ?? (ex.relinquished_property_id ? propertyMap[ex.relinquished_property_id] ?? null : null));
    setCriteria(criteriaResult.data ?? null);
    setMatches(matchRows);
    setConnections(allConnections);
    setTimeline(timelineResult.data ?? []);
    setAssignments(assignmentsResult.data ?? []);
    setRepresentations(representationRows);
    setContactRequests(allContactRequests);
    setConnectionIntents(allIntents);
    setPropertiesById(propertyMap);
    setFinancialsByProperty(Object.fromEntries((financialsResult.data ?? []).map((row) => [row.property_id, row])));
    setImagesByProperty(byProperty(imagesResult.data ?? []));
    setDocumentsByProperty(byProperty(documentsResult.data ?? []));
    setRelatedExchangesById(byId(uniqueById([ex, ...(relatedExchangeResult.data ?? [])])));
    setProfilesById(byId(profileRows));
    setDataWarnings([...new Set(warnings.map((item) => item.message))]);
    setLoading(false);
  }, [isDemo]);

  useEffect(() => {
    if (id) void load(id);
    return () => { loadRequestRef.current += 1; };
  }, [id, load, scope]);

  async function logEvent(description: string) {
    if (!exchange) return;
    // Both callers log a status/stage override, so use 'status_change' - the
    // fitting value in exchange_timeline_event_check (there is no
    // 'admin_action'). The admin origin stays in the description + actor_id.
    const { error } = await supabase.from("exchange_timeline").insert({
      exchange_id: exchange.id,
      event_type: "status_change",
      description,
      actor_id: user?.id ?? null,
    });
    if (error) {
      console.error("Failed to write admin timeline entry:", error);
      toast({
        title: "Action saved, but the timeline entry could not be logged.",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function changeStatus(status: string) {
    if (!exchange) return;
    const previousStatus = exchange.status;
    setSavingStatus(true);
    const { error } = await supabase.from("exchanges").update({ status: status as Tables<"exchanges">["status"] }).eq("id", exchange.id);
    if (error) {
      setSavingStatus(false);
      toast({ title: "Failed to update status.", description: error.message, variant: "destructive" });
      return;
    }
    await logEvent(`Admin changed exchange status to "${pretty(status)}".`);
    await recordAdminAction({
      action: "exchange.status_changed",
      entityType: "exchange",
      entityId: exchange.id,
      summary: `Changed exchange status from ${pretty(previousStatus)} to ${pretty(status)}`,
      metadata: { previous_status: previousStatus, new_status: status },
    });
    setExchange({ ...exchange, status: status as Tables<"exchanges">["status"] });
    setSavingStatus(false);
    toast({ title: "Status updated." });
    load(exchange.id);
  }

  async function changeStage(value: string) {
    if (!exchange) return;
    const stage = value === "__auto__" ? null : (value as StageKey);
    const previousStage = exchange.pipeline_stage_override;
    setSavingStage(true);
    const { error } = await supabase.from("exchanges").update({ pipeline_stage_override: stage }).eq("id", exchange.id);
    if (error) {
      setSavingStage(false);
      toast({ title: "Failed to update stage.", description: error.message, variant: "destructive" });
      return;
    }
    await logEvent(stage ? `Admin overrode pipeline stage to "${stage}".` : "Admin cleared the pipeline stage override.");
    await recordAdminAction({
      action: stage ? "exchange.stage_overridden" : "exchange.stage_override_cleared",
      entityType: "exchange",
      entityId: exchange.id,
      summary: stage ? `Overrode exchange pipeline stage to ${pretty(stage)}` : "Cleared exchange pipeline stage override",
      metadata: { previous_stage: previousStage, new_stage: stage },
    });
    setExchange({ ...exchange, pipeline_stage_override: stage });
    setSavingStage(false);
    toast({ title: "Stage updated." });
    load(exchange.id);
  }

  async function runMatching(dryRun: boolean) {
    const propertyId = exchange?.relinquished_property_id ?? property?.id;
    if (!exchange || !propertyId) {
      toast({ title: "Cannot run matching", description: "This exchange has no relinquished property linked.", variant: "destructive" });
      return;
    }
    setRunningMatch(true);
    setMatchResult(null);
    const { data, error } = await supabase.functions.invoke("run-auto-matching", {
      body: {
        exchange_id: exchange.id,
        property_id: propertyId,
        explain: true,
        dry_run: dryRun,
      },
    });
    setRunningMatch(false);
    if (error) {
      toast({ title: "Matching run failed", description: error.message, variant: "destructive" });
      return;
    }
    const result = data as DiagResult;
    setMatchResult(result);
    if (!dryRun) {
      await recordAdminAction({
        action: "matching.run",
        entityType: "exchange",
        entityId: exchange.id,
        summary: `Ran matching: ${result.total_new_matches} new, ${result.total_archived_matches ?? 0} archived`,
        metadata: {
          total_new_matches: result.total_new_matches,
          total_archived_matches: result.total_archived_matches ?? 0,
          total_active_matches: result.total_active_matches,
        },
      });
      load(exchange.id);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!exchange) {
    return (
      <div>
        <BackLink />
        <Card><CardContent className="p-8 text-center">
          <p className="text-sm font-medium">{loadError ?? "Exchange not found."}</p>
          <p className="mt-1 text-xs text-muted-foreground">No other exchange record is being shown in its place.</p>
          {id && <Button variant="outline" size="sm" className="mt-4" onClick={() => load(id)}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>}
        </CardContent></Card>
      </div>
    );
  }

  const ownerTypeLabel = exchangeOwnerTypeLabel(exchange.owner_type);
  const managedForLabel = exchangeManagedForLabel(exchange.owner_type, client?.client_name);
  const selfManagedInvestor = isInvestorOwned(exchange.owner_type);
  const ownerName = ownerProfile?.full_name || ownerProfile?.email || "Unknown account owner";
  const currentFinancials = property ? financialsByProperty[property.id] : null;
  const currentImages = property ? imagesByProperty[property.id] ?? [] : [];
  const currentDocuments = property ? documentsByProperty[property.id] ?? [] : [];
  const primaryAssignment = assignments.find((assignment) => assignment.status === "active" && assignment.is_primary)
    ?? assignments.find((assignment) => assignment.status === "active")
    ?? null;

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchange</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <span>{ownerTypeLabel}</span><span>·</span>
            <Link to={`/admin/users/${exchange.agent_id}`} className="font-medium text-foreground hover:text-primary hover:underline">{ownerName}</Link>
            <span>·</span><span>{managedForLabel}</span><span>·</span><span>created {fmtDate(exchange.created_at)}</span>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${statusColor[exchange.status] || "bg-muted text-muted-foreground"}`}>
          {pretty(exchange.status)}
        </span>
      </div>

      {dataWarnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Some related admin data could not be loaded.</p>
          <p className="mt-1 text-xs">{dataWarnings.join(" · ")}</p>
        </div>
      )}

      {/* Admin actions */}
      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-base">Admin actions</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Exchange status</label>
            <div className="flex items-center gap-2">
              <Select value={exchange.status} onValueChange={changeStatus}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXCHANGE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{pretty(s)}</SelectItem>)}
                </SelectContent>
              </Select>
              {savingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Pipeline stage override</label>
            <div className="flex items-center gap-2">
              <Select value={exchange.pipeline_stage_override ?? "__auto__"} onValueChange={changeStage}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__auto__">Auto (no override)</SelectItem>
                  {STAGE_DEFS.map((s) => <SelectItem key={s.key} value={s.key}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {savingStage && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matching QA */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Matching QA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => runMatching(true)} disabled={runningMatch}>
              {runningMatch && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Dry-run with diagnostics
            </Button>
            <Button size="sm" onClick={() => runMatching(false)} disabled={runningMatch}>
              {runningMatch && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Re-run &amp; persist matches
            </Button>
            <p className="text-xs text-muted-foreground">
              Dry-run shows why each candidate did or didn't match without writing to the database.
            </p>
          </div>

          <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Ownership safety is enabled.</span>{" "}
            Agents can match different clients inside their own book of business. Self-managed
            investors are never matched to another property in their own account.
          </p>



          {matchResult && (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3 text-sm">
              <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-2.5 text-xs text-green-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <span className="font-medium">Exchange IQ™ completed successfully.</span>{" "}
                  {matchResult.matches_for_exchange + matchResult.matches_from_property === 0
                    ? "Zero eligible matches is a valid result: the table below shows which rule rejected each available candidate."
                    : "The eligible recommendations and every rejected candidate are shown below."}
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div><span className="font-medium">{matchResult.matches_for_exchange}</span> buyer-side eligible</div>
                <div><span className="font-medium">{matchResult.matches_from_property}</span> seller-side eligible</div>
                {!matchResult.dry_run && (
                  <div><span className="font-medium">{matchResult.total_new_matches}</span> new matches persisted</div>
                )}
                {!matchResult.dry_run && (
                  <div><span className="font-medium">{matchResult.total_archived_matches ?? 0}</span> stale matches archived</div>
                )}
                {matchResult.dry_run && <Badge variant="secondary">dry run</Badge>}
              </div>

              {matchResult.diagnostics && matchResult.diagnostics.length > 0 ? (
                <div className="max-h-96 overflow-auto rounded border bg-background">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted/60 text-left">
                      <tr>
                        <th className="p-2 font-medium">Side</th>
                        <th className="p-2 font-medium">Candidate</th>
                        <th className="p-2 font-medium">Result</th>
                        <th className="p-2 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchResult.diagnostics.map((d, i) => (
                        <tr key={i} className="border-t align-top">
                          <td className="p-2 capitalize text-muted-foreground">{d.direction}</td>
                          <td className="p-2">{d.candidate_label}</td>
                          <td className="p-2">
                            {d.status === "matched" ? (
                              <span className="inline-flex items-center gap-1 text-green-700">
                                <CheckCircle2 className="h-3.5 w-3.5" /> matched
                                {d.total != null && <span className="text-muted-foreground">· score {d.total}</span>}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <XCircle className="h-3.5 w-3.5" /> skipped
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">{d.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No candidates evaluated.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AccountContextCard
          exchange={exchange}
          ownerProfile={ownerProfile}
          client={client}
          primaryAssignment={primaryAssignment}
          profilesById={profilesById}
        />
        <ExchangeSummaryCard exchange={exchange} />
      </div>

      <PropertyDetailCard
        property={property}
        financials={currentFinancials}
        images={currentImages}
        documents={currentDocuments}
        recordOwnerProfile={property ? profilesById[property.agent_id] ?? ownerProfile : ownerProfile}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <CriteriaCard criteria={criteria} selfManagedInvestor={selfManagedInvestor} />
        <RepresentationContextCard
          exchange={exchange}
          assignments={assignments}
          representations={representations}
          contactRequests={contactRequests}
          connectionIntents={connectionIntents}
          profilesById={profilesById}
        />
      </div>

      <MatchesSection
        exchange={exchange}
        matches={matches}
        propertiesById={propertiesById}
        financialsByProperty={financialsByProperty}
        imagesByProperty={imagesByProperty}
        documentsByProperty={documentsByProperty}
        relatedExchangesById={relatedExchangesById}
        profilesById={profilesById}
        connections={connections}
        contactRequests={contactRequests}
        connectionIntents={connectionIntents}
      />

      <ConnectionsCard connections={connections} profilesById={profilesById} />

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Timeline</CardTitle></CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((t) => (
                <li key={t.id} className="flex gap-3 text-sm">
                  <span className="w-36 shrink-0 text-xs text-muted-foreground">{fmtDateTime(t.created_at)}</span>
                  <span>{t.description}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/opportunities" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back to Opportunities
    </Link>
  );
}

function UserLink({ id, profile, fallback = "Unknown user" }: { id: string | null | undefined; profile?: Profile | null; fallback?: string }) {
  const label = profile?.full_name || profile?.email || fallback;
  if (!id) return <span>{label}</span>;
  return <Link to={`/admin/users/${id}`} className="font-medium text-foreground hover:text-primary hover:underline">{label}</Link>;
}

function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`capitalize ${statusColor[status] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>
      {pretty(status)}
    </Badge>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </div>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function AccountContextCard({
  exchange,
  ownerProfile,
  client,
  primaryAssignment,
  profilesById,
}: {
  exchange: Tables<"exchanges">;
  ownerProfile: Profile | null;
  client: Tables<"agent_clients"> | null;
  primaryAssignment: Tables<"exchange_agent_assignments"> | null;
  profilesById: Record<string, Profile>;
}) {
  const investorOwned = isInvestorOwned(exchange.owner_type);
  const assignmentAgent = primaryAssignment ? profilesById[primaryAssignment.agent_id] : null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" /> Account and management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Info label="Workspace type">{exchangeOwnerTypeLabel(exchange.owner_type)}</Info>
          <Info label={investorOwned ? "Property owner account" : "Managing agent"}>
            <UserLink id={exchange.agent_id} profile={ownerProfile} />
          </Info>
          <Info label="Management model">{investorOwned ? (primaryAssignment ? "Investor-owned with assigned agent" : "Self-managed investor") : "Agent-managed client exchange"}</Info>
          <Info label="Demo status">{exchange.is_demo ? "Demo workspace data" : "Live account data"}</Info>
        </dl>

        {!investorOwned && (
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client record</p>
            {client ? (
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="text-muted-foreground">Name:</span> {client.client_name}</div>
                <div><span className="text-muted-foreground">Status:</span> <span className="capitalize">{pretty(client.status)}</span></div>
                <div><span className="text-muted-foreground">Email:</span> {client.client_email || "-"}</div>
                <div><span className="text-muted-foreground">Phone:</span> {client.client_phone || "-"}</div>
                <div><span className="text-muted-foreground">Company:</span> {client.client_company || "-"}</div>
                <div>
                  <span className="text-muted-foreground">Workspace:</span>{" "}
                  {client.client_user_id ? <UserLink id={client.client_user_id} profile={profilesById[client.client_user_id]} fallback="Open linked investor" /> : "Not linked"}
                </div>
              </div>
            ) : <p className="mt-2 text-sm text-muted-foreground">No client record is linked to this agent-managed exchange.</p>}
          </div>
        )}

        {primaryAssignment && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <div>
              <p className="font-medium text-emerald-950">Assigned representative</p>
              <p className="mt-0.5 text-emerald-800"><UserLink id={primaryAssignment.agent_id} profile={assignmentAgent} fallback="Assigned agent" /></p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StatusPill status={primaryAssignment.status} />
              {primaryAssignment.is_primary && <Badge variant="outline">Primary</Badge>}
              {primaryAssignment.can_manage_exchange && <Badge variant="outline">Can manage exchange</Badge>}
              {primaryAssignment.can_manage_listing && <Badge variant="outline">Can manage listing</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExchangeSummaryCard({ exchange }: { exchange: Tables<"exchanges"> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-primary" /> Exchange status and economics</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Est. equity" value={money(exchange.estimated_equity)} icon={CircleDollarSign} />
          <Metric label="Proceeds" value={money(exchange.exchange_proceeds)} icon={CircleDollarSign} />
          <Metric label="Est. gain" value={money(exchange.estimated_gain)} icon={TrendingUp} />
          <Metric label="Est. tax" value={money(exchange.estimated_tax_liability)} icon={ShieldCheck} />
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Info label="Expected sale close">{fmtDate(exchange.sale_close_date)}</Info>
          <Info label="Actual sale close">{fmtDate(exchange.actual_close_date)}</Info>
          <Info label="Estimated basis">{money(exchange.estimated_basis)}</Info>
          <Info label="Pipeline stage override">{exchange.pipeline_stage_override ? pretty(exchange.pipeline_stage_override) : "Automatic"}</Info>
        </dl>
      </CardContent>
    </Card>
  );
}

function PropertyDetailCard({
  property,
  financials,
  images,
  documents,
  recordOwnerProfile,
}: {
  property: Property | null;
  financials: Financials | null | undefined;
  images: PropertyImage[];
  documents: PropertyDocument[];
  recordOwnerProfile: Profile | null;
}) {
  if (!property) {
    return <Card><CardHeader><CardTitle className="text-base">Current property</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">No current property is linked to this exchange.</p></CardContent></Card>;
  }
  const cover = images[0]?.storage_path ? resolvePropertyImageUrl(images[0].storage_path) : null;
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-primary" /> Current property and listing record</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">The complete listing, financial, media, and document context used by matching.</p>
          </div>
          <div className="flex gap-2"><StatusPill status={property.status} />{property.is_demo && <Badge className="bg-amber-100 text-amber-800">Demo</Badge>}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <div className="h-52 overflow-hidden rounded-lg border bg-muted">
              {cover ? <img src={cover} alt={resolveListingName(property, true)} className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full" />}
            </div>
            {images.length > 1 && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((image) => <img key={image.id} src={resolvePropertyImageUrl(image.storage_path)} alt={image.file_name || "Property photo"} className="h-14 w-full rounded border object-cover" />)}
              </div>
            )}
            <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" />{images.length} photo{images.length === 1 ? "" : "s"}</span>
              <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{documents.length} document{documents.length === 1 ? "" : "s"}</span>
            </div>
          </div>

          <div className="min-w-0 space-y-5">
            <div>
              <h3 className="text-xl font-semibold">{resolveListingName(property, true)}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{getListingLocationLabel(property) || "Location not provided"}</p>
              <p className="mt-2 text-xs text-muted-foreground">Record owner: <UserLink id={property.agent_id} profile={recordOwnerProfile} /></p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              <Metric label="Asking price" value={money(financials?.asking_price)} />
              <Metric label="NOI" value={money(financials?.noi)} />
              <Metric label="Cap rate" value={percent(financials?.cap_rate)} />
              <Metric label="Loan balance" value={money(financials?.loan_balance)} />
              <Metric label="Annual revenue" value={money(financials?.annual_revenue ?? financials?.gross_rent_roll)} />
              <Metric label="Op. expenses" value={money(financials?.total_operating_expenses ?? financials?.annual_expenses)} />
            </div>

            <dl className="grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Address">{property.address || "-"}</Info>
              <Info label="Address visibility">{property.address_is_public ? "Public to eligible users" : "Hidden from marketplace users"}</Info>
              <Info label="Asset / subtype"><span className="capitalize">{pretty(property.asset_type)}{property.asset_subtype ? ` · ${property.asset_subtype}` : ""}</span></Info>
              <Info label="Strategy"><span className="capitalize">{pretty(property.strategy_type)}</span></Info>
              <Info label="Class / condition">{[property.property_class, property.property_condition].filter(Boolean).join(" / ") || "-"}</Info>
              <Info label="Year / units">{property.year_built ?? "-"} · {property.units?.toLocaleString() ?? "-"} units</Info>
              <Info label="Building / land">{property.building_square_footage != null ? `${property.building_square_footage.toLocaleString()} sq ft` : "-"} · {property.land_area_acres != null ? `${property.land_area_acres} acres` : "-"}</Info>
              <Info label="Occupancy / vacancy">{percent(financials?.occupancy_rate)} / {percent(financials?.vacancy_rate)}</Info>
              <Info label="Debt service / rate">{money(financials?.annual_debt_service)} / {percent(financials?.loan_rate)}</Info>
              <Info label="Loan type / maturity">{financials?.loan_type || "-"} / {fmtDate(financials?.loan_maturity_date ?? null)}</Info>
              <Info label="Parking / zoning">{[property.parking_spaces != null ? `${property.parking_spaces} spaces` : null, property.parking_type, property.zoning].filter(Boolean).join(" · ") || "-"}</Info>
              <Info label="Authorization">{property.owner_authorization_confirmed ? "Owner authorization confirmed" : "Not confirmed"}</Info>
            </dl>

            {property.description && <p className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">{property.description}</p>}

            {documents.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Document metadata</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0"><p className="truncate font-medium">{document.file_name || "Untitled document"}</p><p className="mt-0.5 text-xs capitalize text-muted-foreground">{pretty(document.document_type)} · {fmtDate(document.created_at)}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CriteriaCard({ criteria, selfManagedInvestor }: { criteria: Tables<"replacement_criteria"> | null; selfManagedInvestor: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Matching inputs and optional criteria</CardTitle></CardHeader>
      <CardContent>
        {selfManagedInvestor && <p className="mb-4 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">This investor-owned exchange uses the same equity, financing, trade-up, and projected-ROE engine as an agent-managed exchange. Blank optional criteria leave platform defaults in control.</p>}
        {criteria ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Info label="Replacement value range">{Number(criteria.target_price_min) > 0 || Number(criteria.target_price_max) > 0 ? `${Number(criteria.target_price_min) > 0 ? money(criteria.target_price_min) : "No minimum"} – ${Number(criteria.target_price_max) > 0 ? money(criteria.target_price_max) : "No maximum"}` : "Automatic"}</Info>
            <Info label="Preferred replacement value">{money(criteria.preferred_replacement_value)}</Info>
            <Info label="Asset types">{criteria.target_asset_types?.map(pretty).join(", ") || "Any"}{criteria.require_asset_type_match ? " · required" : ""}</Info>
            <Info label="Locations">{[...(criteria.target_states ?? []), ...(criteria.target_metros ?? [])].join(", ") || "Any"}{criteria.require_location_match ? " · required" : ""}</Info>
            <Info label="Property classes">{criteria.target_property_classes?.join(", ") || "Any"}</Info>
            <Info label="Strategies">{criteria.target_strategies?.map(pretty).join(", ") || "Any"}</Info>
            <Info label="Additional cash">{money(criteria.additional_cash_available)}</Info>
            <Info label="Maximum LTV">{criteria.max_ltv != null ? percent(criteria.max_ltv, 100) : "Platform default (75%)"}</Info>
            <Info label="Desired replacement loan">{money(criteria.desired_loan_amount)}</Info>
            <Info label="Minimum debt replacement">{money(criteria.min_debt_replacement)}{criteria.must_replace_debt ? " · required" : ""}</Info>
            <Info label="Minimum projected ROE">{criteria.min_projected_roe != null ? percent(criteria.min_projected_roe) : "No optional floor"}</Info>
            <Info label="Minimum monthly cash flow">{money(criteria.preferred_monthly_cash_flow)}</Info>
            <Info label="Cap rate range">{criteria.target_cap_rate_min != null || criteria.target_cap_rate_max != null ? `${percent(criteria.target_cap_rate_min)} – ${percent(criteria.target_cap_rate_max)}` : "Any"}</Info>
            <Info label="Minimum occupancy">{percent(criteria.target_occupancy_min)}</Info>
            <Info label="Units / square feet">{criteria.target_units_min != null || criteria.target_units_max != null ? `${criteria.target_units_min ?? "No min"} – ${criteria.target_units_max ?? "No max"} units` : criteria.target_sf_min != null || criteria.target_sf_max != null ? `${criteria.target_sf_min?.toLocaleString() ?? "No min"} – ${criteria.target_sf_max?.toLocaleString() ?? "No max"} sq ft` : "Any"}</Info>
            <Info label="Alternative structures">{[criteria.open_to_dsts ? "DSTs" : null, criteria.open_to_tics ? "TICs" : null].filter(Boolean).join(", ") || "Not selected"}</Info>
          </dl>
        ) : <p className="text-sm text-muted-foreground">No criteria row exists. The platform matching defaults apply.</p>}
      </CardContent>
    </Card>
  );
}

function RepresentationContextCard({
  exchange,
  assignments,
  representations,
  contactRequests,
  connectionIntents,
  profilesById,
}: {
  exchange: Tables<"exchanges">;
  assignments: Tables<"exchange_agent_assignments">[];
  representations: Tables<"agent_representations">[];
  contactRequests: Tables<"agent_contact_requests">[];
  connectionIntents: Tables<"agent_connection_intents">[];
  profilesById: Record<string, Profile>;
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Handshake className="h-4 w-4 text-primary" /> Representation and agent handoff</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {isInvestorOwned(exchange.owner_type) && assignments.length === 0 && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This self-managed property owner has no agent assigned to this exchange. Agent-to-agent interest is held as an intent until representation is connected.</p>
        )}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border p-2"><p className="text-lg font-semibold">{assignments.length}</p><p className="text-[11px] text-muted-foreground">Assignments</p></div>
          <div className="rounded-lg border p-2"><p className="text-lg font-semibold">{contactRequests.length}</p><p className="text-[11px] text-muted-foreground">Contact requests</p></div>
          <div className="rounded-lg border p-2"><p className="text-lg font-semibold">{connectionIntents.length}</p><p className="text-[11px] text-muted-foreground">Connection intents</p></div>
        </div>
        {assignments.map((assignment) => (
          <div key={assignment.id} className="rounded-lg border p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><UserLink id={assignment.agent_id} profile={profilesById[assignment.agent_id]} fallback="Assigned agent" /><div className="flex gap-1"><StatusPill status={assignment.status} />{assignment.is_primary && <Badge variant="outline">Primary</Badge>}</div></div>
            <p className="mt-2 text-xs text-muted-foreground">Assigned {fmtDate(assignment.assigned_at)} · Exchange {assignment.can_manage_exchange ? "management enabled" : "view only"} · Listing {assignment.can_manage_listing ? "management enabled" : "view only"}</p>
          </div>
        ))}
        {representations.map((representation) => (
          <div key={representation.id} className="rounded-lg border bg-muted/20 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><span><span className="text-muted-foreground">Relationship:</span> <UserLink id={representation.agent_id} profile={representation.agent_id ? profilesById[representation.agent_id] : null} fallback={representation.agent_name || representation.agent_email} /> ↔ <UserLink id={representation.investor_id} profile={representation.investor_id ? profilesById[representation.investor_id] : null} fallback={representation.investor_email} /></span><StatusPill status={representation.status} /></div>
            <p className="mt-2 text-xs text-muted-foreground">Source {pretty(representation.source)} · Accepted {fmtDate(representation.accepted_at)} · {representation.is_default ? "Default agent" : "Exchange-specific or secondary relationship"}</p>
          </div>
        ))}
        {contactRequests.slice(0, 4).map((request) => (
          <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><span>Investor request from <UserLink id={request.investor_id} profile={profilesById[request.investor_id]} /></span><StatusPill status={request.status} /></div>
        ))}
        {connectionIntents.slice(0, 4).map((intent) => (
          <div key={intent.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span>Agent-to-agent intent · waiting on {pretty(intent.waiting_on_side)}</span><StatusPill status={intent.status} /></div>{intent.resolution_note && <p className="mt-2 text-xs text-muted-foreground">{intent.resolution_note}</p>}</div>
        ))}
        {!assignments.length && !representations.length && !contactRequests.length && !connectionIntents.length && <p className="text-sm text-muted-foreground">No representation, assignment, or contact-request workflow is linked to this exchange.</p>}
      </CardContent>
    </Card>
  );
}

function MatchesSection({
  exchange,
  matches,
  propertiesById,
  financialsByProperty,
  imagesByProperty,
  documentsByProperty,
  relatedExchangesById,
  profilesById,
  connections,
  contactRequests,
  connectionIntents,
}: {
  exchange: Tables<"exchanges">;
  matches: Tables<"matches">[];
  propertiesById: Record<string, Property>;
  financialsByProperty: Record<string, Financials>;
  imagesByProperty: Record<string, PropertyImage[]>;
  documentsByProperty: Record<string, PropertyDocument[]>;
  relatedExchangesById: Record<string, Tables<"exchanges">>;
  profilesById: Record<string, Profile>;
  connections: Tables<"exchange_connections">[];
  contactRequests: Tables<"agent_contact_requests">[];
  connectionIntents: Tables<"agent_connection_intents">[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Match inventory and underwriting audit</h2><p className="mt-1 text-sm text-muted-foreground">{matches.length} buyer- or listing-side match{matches.length === 1 ? "" : "es"}, with the exact property, financing, ROE, score, and communication state.</p></div>
        {matches.length > 0 && <Badge variant="outline">Top score {Math.round(matches[0].total_score)}</Badge>}
      </div>
      {matches.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No matches are associated with this exchange or its current listing.</CardContent></Card> : matches.map((match) => {
        const sellerProperty = propertiesById[match.seller_property_id];
        const relinquishedProperty = match.relinquished_property_id ? propertiesById[match.relinquished_property_id] : null;
        const financials = sellerProperty ? financialsByProperty[sellerProperty.id] : null;
        const image = sellerProperty && imagesByProperty[sellerProperty.id]?.[0]?.storage_path
          ? resolvePropertyImageUrl(imagesByProperty[sellerProperty.id][0].storage_path)
          : null;
        const sellerExchange = sellerProperty?.exchange_id ? relatedExchangesById[sellerProperty.exchange_id] : null;
        const sellerAccountId = match.seller_agent_id || sellerExchange?.agent_id || sellerProperty?.agent_id;
        const connection = connections.find((row) => row.match_id === match.id);
        const request = contactRequests.find((row) => row.match_id === match.id);
        const intent = connectionIntents.find((row) => row.match_id === match.id);
        const reasons = eligibilityReasons(match.eligibility_reasons);
        const isBuyerSide = match.buyer_exchange_id === exchange.id;
        return (
          <Card key={match.id} className="overflow-hidden">
            <div className="grid xl:grid-cols-[250px_minmax(0,1fr)]">
              <div className="h-56 bg-muted xl:h-full xl:min-h-[440px]">{image ? <img src={image} alt={sellerProperty ? resolveListingName(sellerProperty, true) : "Matched property"} className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full" />}</div>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{isBuyerSide ? "Buyer side" : "Listing side"}</Badge><StatusPill status={match.status} /><Badge variant="outline">{pretty(match.match_classification)}</Badge></div>
                    <h3 className="mt-3 text-lg font-semibold">{sellerProperty ? resolveListingName(sellerProperty, true) : "Seller property unavailable"}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{sellerProperty ? getListingLocationLabel(sellerProperty) || "Location not provided" : "Location unavailable"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Compared with {relinquishedProperty ? resolveListingName(relinquishedProperty, true) : "the buyer's current property"}</p>
                  </div>
                  <div className="flex w-fit items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-white"><span className="text-2xl font-bold">{Math.round(match.total_score)}</span><span className="text-[10px] uppercase leading-tight text-slate-400">Match<br />score</span></div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Replacement value" value={money(match.replacement_value ?? financials?.asking_price)} />
                  <Metric label="Purchasing capacity" value={money(match.estimated_purchasing_capacity)} />
                  <Metric label="Replacement loan" value={money(match.estimated_replacement_loan)} />
                  <Metric label="Estimated LTV" value={percent(match.estimated_ltv, 100)} />
                  <Metric label="Current ROE" value={percent(match.buyer_current_roe, 100)} />
                  <Metric label="Projected ROE" value={percent(match.candidate_roe, 100)} />
                  <Metric label="ROE improvement" value={match.roe_improvement_pp == null ? "-" : `${match.roe_improvement_pp.toFixed(2)} pts`} />
                  <Metric label="Exchange-up" value={percent(match.exchange_up_percentage)} />
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Listing financials</p>
                    <dl className="mt-3 grid grid-cols-2 gap-3"><Info label="Asking price">{money(financials?.asking_price)}</Info><Info label="NOI">{money(financials?.noi)}</Info><Info label="Cap rate">{percent(financials?.cap_rate)}</Info><Info label="Occupancy">{percent(financials?.occupancy_rate)}</Info></dl>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Score components</p>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs"><ScoreLine label="Financial" score={match.financial_score} /><ScoreLine label="Price" score={match.price_score} /><ScoreLine label="Asset" score={match.asset_score} /><ScoreLine label="Location" score={match.geo_score} /><ScoreLine label="Debt fit" score={match.debt_fit_score} /><ScoreLine label="Scale fit" score={match.scale_fit_score} /><ScoreLine label="Strategy" score={match.strategy_score} /><ScoreLine label="Timing" score={match.timing_score} /></div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Financing and boot audit</p>
                    <dl className="mt-3 grid grid-cols-2 gap-3"><Info label="Cash boot">{money(match.estimated_cash_boot)}</Info><Info label="Mortgage boot">{money(match.estimated_mortgage_boot)}</Info><Info label="Total boot">{money(match.estimated_total_boot)}</Info><Info label="Boot tax">{money(match.estimated_boot_tax)}</Info><Info label="Value increase">{money(match.value_increase)}</Info><Info label="Debt service">{money(match.candidate_annual_debt_service)}</Info></dl>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Eligibility explanation</p>{reasons.length ? <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">{reasons.slice(0, 8).map((reason) => <li key={reason} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />{reason}</li>)}</ul> : <p className="mt-2 text-xs text-muted-foreground">No eligibility reasons were recorded for this legacy match.</p>}</div>
                  <div className="rounded-lg border p-3 text-sm"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participants and workflow</p><div className="mt-3 space-y-2"><p>Buyer agent: <UserLink id={match.buyer_agent_id} profile={match.buyer_agent_id ? profilesById[match.buyer_agent_id] : null} fallback="Unassigned" /></p><p>Listing side: <UserLink id={sellerAccountId} profile={sellerAccountId ? profilesById[sellerAccountId] : null} fallback="Unrepresented property owner" /></p><p className="text-xs text-muted-foreground">{documentsByProperty[match.seller_property_id]?.length ?? 0} documents · {imagesByProperty[match.seller_property_id]?.length ?? 0} photos · boot status {pretty(match.boot_status)}</p></div></div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  {request && <Badge variant="outline">Contact request: {pretty(request.status)}</Badge>}
                  {intent && <Badge variant="outline">Connection intent: {pretty(intent.status)}</Badge>}
                  {connection && <Button asChild size="sm" variant="outline"><Link to={`/admin/opportunities/connections/${connection.id}`}><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Open conversation</Link></Button>}
                  {sellerExchange && sellerExchange.id !== exchange.id && <Button asChild size="sm" variant="outline"><Link to={`/admin/opportunities/exchanges/${sellerExchange.id}`}>Open seller exchange <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>}
                  {match.buyer_exchange_id !== exchange.id && <Button asChild size="sm" variant="outline"><Link to={`/admin/opportunities/exchanges/${match.buyer_exchange_id}`}>Open buyer exchange <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button>}
                </div>
              </CardContent>
            </div>
          </Card>
        );
      })}
    </section>
  );
}

function ScoreLine({ label, score }: { label: string; score: number }) {
  return <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">{label}</span><span className="font-semibold">{Math.round(score)}</span></div>;
}

function ConnectionsCard({ connections, profilesById }: { connections: Tables<"exchange_connections">[]; profilesById: Record<string, Profile> }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-primary" /> Agent conversations ({connections.length})</CardTitle></CardHeader>
      <CardContent>
        {connections.length === 0 ? <p className="text-sm text-muted-foreground">No agent-to-agent conversation has been created for this exchange.</p> : <div className="grid gap-3 lg:grid-cols-2">{connections.map((connection) => (
          <div key={connection.id} className="rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3"><StatusPill status={connection.status} /><Button asChild size="sm" variant="ghost"><Link to={`/admin/opportunities/connections/${connection.id}`}>Open <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button></div>
            <p className="mt-3 text-sm"><UserLink id={connection.buyer_agent_id} profile={profilesById[connection.buyer_agent_id]} fallback="Buyer agent" /> <span className="text-muted-foreground">with</span> <UserLink id={connection.seller_agent_id} profile={profilesById[connection.seller_agent_id]} fallback="Listing agent" /></p>
            <p className="mt-1 text-xs text-muted-foreground">Started {fmtDateTime(connection.initiated_at)} · Accepted {fmtDateTime(connection.accepted_at)}</p>
          </div>
        ))}</div>}
      </CardContent>
    </Card>
  );
}
