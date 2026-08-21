import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { resolveListingName } from "@/lib/listingDisplay";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CircleDollarSign,
  Database,
  Handshake,
  Home,
  ImageOff,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { CrmPageHeader, MetricTile } from "@/features/admin-crm/components/CrmPrimitives";
import {
  exchangeManagedForLabel,
  exchangeOwnerTypeLabel,
} from "@/features/admin/lib/accountTypes";
import { useAdminCrmScope } from "@/features/admin-crm/layout/AdminCrmScope";

type Exchange = Tables<"exchanges">;
type Property = Tables<"pledged_properties">;
type Match = Tables<"matches">;
type Connection = Tables<"exchange_connections">;
type Message = Tables<"messages">;
type Financials = Tables<"property_financials">;
type PropertyImage = Tables<"property_images">;
type DatasetKey = "exchanges" | "properties" | "matches" | "connections" | "messages" | "profiles" | "clients" | "financials" | "images";
type DatasetStatus = "loading" | "loaded" | "partial" | "failed";
type DatasetStatuses = Record<DatasetKey, DatasetStatus>;
type DatasetErrors = Partial<Record<DatasetKey, string>>;
type StagingDatasetManifest = {
  buyer?: { exchange_id?: string };
  seller?: { exchange_id?: string };
};

const DATASET_LABELS: Record<DatasetKey, string> = {
  exchanges: "Exchanges",
  properties: "Properties",
  matches: "Matches",
  connections: "Connections",
  messages: "Conversation messages",
  profiles: "User profiles",
  clients: "Client records",
  financials: "Property financials",
  images: "Property photos",
};

const INITIAL_DATASET_STATUSES: DatasetStatuses = {
  exchanges: "loading",
  properties: "loading",
  matches: "loading",
  connections: "loading",
  messages: "loading",
  profiles: "loading",
  clients: "loading",
  financials: "loading",
  images: "loading",
};

const EMPTY_SCOPE_ID = "00000000-0000-0000-0000-000000000000";

function adminDealsCountLabel(status: DatasetStatus, filtered: number, total: number) {
  if (status === "failed") return "Unavailable";
  if (status === "loading") return "Loading";
  return `${status === "partial" ? "Partial · " : ""}${filtered}/${total}`;
}

function adminDealsHasTotalFailure(statuses: DatasetStatuses) {
  return (["exchanges", "properties", "matches", "connections"] as DatasetKey[]).every((key) => statuses[key] === "failed");
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : "-";
}
function money(n: number | null) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : "-";
}
function pretty(s: string) {
  return s.replace(/_/g, " ");
}

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  in_identification: "bg-amber-100 text-amber-800 border-amber-200",
  in_closing: "bg-blue-100 text-blue-800 border-blue-200",
  under_contract: "bg-blue-100 text-blue-800 border-blue-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  withdrawn: "bg-muted text-muted-foreground",
};

function StatusPill({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusColor[value] || "bg-muted text-muted-foreground"}`}>
      {pretty(value)}
    </span>
  );
}

export default function AdminDeals({ mode = "opportunities" }: { mode?: "opportunities" | "properties" }) {
  const { scope, isDemo } = useAdminCrmScope();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestSequence = useRef(0);
  const [loading, setLoading] = useState(true);
  const [datasetStatuses, setDatasetStatuses] = useState<DatasetStatuses>(INITIAL_DATASET_STATUSES);
  const [datasetErrors, setDatasetErrors] = useState<DatasetErrors>({});
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [financials, setFinancials] = useState<Financials[]>([]);
  const [propertyImages, setPropertyImages] = useState<PropertyImage[]>([]);
  const [agentName, setAgentName] = useState<Map<string, string>>(new Map());
  const [clientName, setClientName] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [recordStatus, setRecordStatus] = useState("all");

  const loadDeals = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setDatasetStatuses(INITIAL_DATASET_STATUSES);
    setDatasetErrors({});
    // Clear the previous snapshot immediately. A failed refresh must never leave
    // stale rows on screen under newly calculated, authoritative-looking counts.
    setExchanges([]);
    setProperties([]);
    setMatches([]);
    setConnections([]);
    setMessages([]);
    setFinancials([]);
    setPropertyImages([]);
    setAgentName(new Map());
    setClientName(new Map());

    const [exchangeResult, propertyResult] = await Promise.all([
      supabase.from("exchanges").select("*").eq("is_demo", isDemo).order("created_at", { ascending: false }),
      supabase.from("pledged_properties").select("*").eq("is_demo", isDemo).order("created_at", { ascending: false }),
    ]);
    if (requestId !== requestSequence.current) return;

    const liveExchanges = exchangeResult.error ? [] : exchangeResult.data ?? [];
    const liveProperties = propertyResult.error ? [] : propertyResult.data ?? [];
    const exchangeScopeIds = liveExchanges.length ? liveExchanges.map((exchange) => exchange.id) : [EMPTY_SCOPE_ID];
    const propertyScopeIds = liveProperties.length ? liveProperties.map((property) => property.id) : [EMPTY_SCOPE_ID];
    const matchScope: string[] = [];
    if (!exchangeResult.error) matchScope.push(`buyer_exchange_id.in.(${exchangeScopeIds.join(",")})`);
    if (!propertyResult.error) matchScope.push(`seller_property_id.in.(${propertyScopeIds.join(",")})`);

    const unavailable = (message: string) => Promise.resolve({ data: null, error: { message } });
    const [matchResult, connectionResult, profileResult, clientResult, financialResult, imageResult] = await Promise.all([
      matchScope.length
        ? supabase.from("matches").select("*").or(matchScope.join(",")).order("created_at", { ascending: false })
        : unavailable("Matches were not queried because both exchange and property scopes failed to load."),
      !exchangeResult.error
        ? supabase.from("exchange_connections").select("*").or(`buyer_exchange_id.in.(${exchangeScopeIds.join(",")}),seller_exchange_id.in.(${exchangeScopeIds.join(",")})`).order("created_at", { ascending: false })
        : unavailable(`Connections were not queried because the ${scope} exchange scope failed to load.`),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("agent_clients").select("id, client_name"),
      !propertyResult.error && liveProperties.length
        ? supabase.from("property_financials").select("*").in("property_id", propertyScopeIds)
        : propertyResult.error ? unavailable("Financials were not queried because properties failed to load.") : Promise.resolve({ data: [] as Financials[], error: null }),
      !propertyResult.error && liveProperties.length
        ? supabase.from("property_images").select("*").in("property_id", propertyScopeIds).order("sort_order", { ascending: true })
        : propertyResult.error ? unavailable("Photos were not queried because properties failed to load.") : Promise.resolve({ data: [] as PropertyImage[], error: null }),
    ]);
    if (requestId !== requestSequence.current) return;

    const connectionRows = connectionResult.error ? [] : (connectionResult.data ?? []) as Connection[];
    const connectionIds = connectionRows.map((connection) => connection.id);
    const messageResult = connectionIds.length
      ? await supabase.from("messages").select("*").in("connection_id", connectionIds).order("created_at", { ascending: false })
      : { data: [] as Message[], error: null };
    if (requestId !== requestSequence.current) return;

    const statuses: DatasetStatuses = {
      exchanges: exchangeResult.error ? "failed" : "loaded",
      properties: propertyResult.error ? "failed" : "loaded",
      matches: matchResult.error ? "failed" : exchangeResult.error || propertyResult.error ? "partial" : "loaded",
      connections: connectionResult.error ? "failed" : "loaded",
      messages: connectionResult.error || messageResult.error ? "failed" : "loaded",
      profiles: profileResult.error ? "failed" : "loaded",
      clients: clientResult.error ? "failed" : "loaded",
      financials: financialResult.error ? "failed" : "loaded",
      images: imageResult.error ? "failed" : "loaded",
    };
    const errors: DatasetErrors = {};
    if (exchangeResult.error) errors.exchanges = exchangeResult.error.message;
    if (propertyResult.error) errors.properties = propertyResult.error.message;
    if (matchResult.error) errors.matches = matchResult.error.message;
    else if (statuses.matches === "partial") {
      errors.matches = exchangeResult.error
        ? "Buyer-side matches are unavailable because exchanges failed to load; listing-side results may still be shown."
        : "Listing-side matches are unavailable because properties failed to load; buyer-side results may still be shown.";
    }
    if (connectionResult.error) errors.connections = connectionResult.error.message;
    if (connectionResult.error) errors.messages = "Messages were not queried because conversations failed to load.";
    else if (messageResult.error) errors.messages = messageResult.error.message;
    if (profileResult.error) errors.profiles = profileResult.error.message;
    if (clientResult.error) errors.clients = clientResult.error.message;
    if (financialResult.error) errors.financials = financialResult.error.message;
    if (imageResult.error) errors.images = imageResult.error.message;

    setExchanges(liveExchanges);
    setProperties(liveProperties);
    setMatches(matchResult.error ? [] : (matchResult.data ?? []) as Match[]);
    setConnections(connectionRows);
    setMessages(messageResult.error ? [] : (messageResult.data ?? []) as Message[]);
    setFinancials(financialResult.error ? [] : (financialResult.data ?? []) as Financials[]);
    setPropertyImages(imageResult.error ? [] : (imageResult.data ?? []) as PropertyImage[]);
    setAgentName(new Map(profileResult.error ? [] : (profileResult.data ?? []).map((profile) => [profile.id, profile.full_name || profile.email || "Unknown"])));
    setClientName(new Map(clientResult.error ? [] : (clientResult.data ?? []).map((client) => [client.id, client.client_name])));
    setDatasetStatuses(statuses);
    setDatasetErrors(errors);
    setLoading(false);
  }, [isDemo, scope]);

  useEffect(() => {
    void loadDeals();
    return () => {
      requestSequence.current += 1;
    };
  }, [loadDeals]);

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  const agent = useCallback(
    (id: string | null) => (id ? agentName.get(id) ?? "Unknown" : "-"),
    [agentName],
  );
  const exchangeById = useMemo(
    () => new Map(exchanges.map((exchange) => [exchange.id, exchange])),
    [exchanges],
  );
  const propertyById = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties],
  );
  const matchById = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches],
  );
  const messagesByConnection = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const message of messages) {
      const rows = map.get(message.connection_id) ?? [];
      rows.push(message);
      map.set(message.connection_id, rows);
    }
    return map;
  }, [messages]);
  const currentPropertyByExchange = useMemo(() => {
    const map = new Map<string, Property>();
    for (const exchange of exchanges) {
      const property = (exchange.relinquished_property_id ? propertyById.get(exchange.relinquished_property_id) : null)
        ?? properties.find((item) => item.exchange_id === exchange.id);
      if (property) map.set(exchange.id, property);
    }
    return map;
  }, [exchanges, properties, propertyById]);
  const financialByProperty = useMemo(
    () => new Map(financials.map((row) => [row.property_id, row])),
    [financials],
  );
  const firstImageByProperty = useMemo(() => {
    const map = new Map<string, PropertyImage>();
    for (const image of propertyImages) if (!map.has(image.property_id)) map.set(image.property_id, image);
    return map;
  }, [propertyImages]);
  const currentPropertyIds = useMemo(
    () => new Set([...currentPropertyByExchange.values()].map((property) => property.id)),
    [currentPropertyByExchange],
  );
  const matchCountByProperty = useMemo(() => {
    const map = new Map<string, number>();
    for (const match of matches) {
      map.set(match.seller_property_id, (map.get(match.seller_property_id) ?? 0) + 1);
      const current = currentPropertyByExchange.get(match.buyer_exchange_id);
      if (current) map.set(current.id, (map.get(current.id) ?? 0) + 1);
    }
    return map;
  }, [matches, currentPropertyByExchange]);
  const matchCountByExchange = useMemo(() => {
    const map = new Map<string, number>();
    for (const match of matches) map.set(match.buyer_exchange_id, (map.get(match.buyer_exchange_id) ?? 0) + 1);
    return map;
  }, [matches]);

  const term = search.trim().toLowerCase();
  const selectedPropertyId = mode === "properties" ? searchParams.get("property") : null;
  const requestedTab = searchParams.get("tab");
  const activeTab = mode === "properties"
    ? "properties"
    : ["exchanges", "matches", "connections"].includes(requestedTab ?? "")
    ? requestedTab!
    : "matches";

  function changeTab(tab: string) {
    const next = new URLSearchParams(searchParams);
    if (tab === "matches") next.delete("tab");
    else next.set("tab", tab);
    next.delete("property");
    setRecordStatus("all");
    setSearchParams(next, { replace: true });
  }
  const statusOptions = useMemo(() => {
    const rows = mode === "properties"
      ? properties
      : activeTab === "exchanges"
        ? exchanges
        : activeTab === "connections"
          ? connections
          : matches;
    return [...new Set(rows.map((row) => row.status))].sort();
  }, [mode, activeTab, properties, exchanges, connections, matches]);
  const fExchanges = useMemo(
    () => exchanges.filter((e) => (recordStatus === "all" || e.status === recordStatus) && (!term || agent(e.agent_id).toLowerCase().includes(term) || exchangeManagedForLabel(e.owner_type, clientName.get(e.client_id)).toLowerCase().includes(term) || exchangeOwnerTypeLabel(e.owner_type).toLowerCase().includes(term) || e.status.toLowerCase().includes(term))),
    [exchanges, term, recordStatus, agent, clientName],
  );
  const fProperties = useMemo(
    () => properties.filter((p) => {
      if (selectedPropertyId && p.id !== selectedPropertyId) return false;
      if (recordStatus !== "all" && p.status !== recordStatus) return false;
      const ownerType = exchangeById.get(p.exchange_id ?? "")?.owner_type;
      return !term || resolveListingName(p, true).toLowerCase().includes(term) || (p.property_name ?? "").toLowerCase().includes(term) || (p.address ?? "").toLowerCase().includes(term) || (p.city ?? "").toLowerCase().includes(term) || (p.state ?? "").toLowerCase().includes(term) || (p.zip ?? "").toLowerCase().includes(term) || (p.asset_type ?? "").toLowerCase().includes(term) || agent(p.agent_id).toLowerCase().includes(term) || exchangeOwnerTypeLabel(ownerType).toLowerCase().includes(term);
    }),
    [properties, selectedPropertyId, term, recordStatus, agent, exchangeById],
  );
  const fConnections = useMemo(
    () => connections.filter((c) => {
      const linkedMatch = c.match_id ? matchById.get(c.match_id) : null;
      const currentProperty = linkedMatch ? currentPropertyByExchange.get(linkedMatch.buyer_exchange_id) : null;
      const candidate = linkedMatch ? propertyById.get(linkedMatch.seller_property_id) : null;
      const conversationMessages = messagesByConnection.get(c.id) ?? [];
      return (recordStatus === "all" || c.status === recordStatus) && (!term
        || agent(c.buyer_agent_id).toLowerCase().includes(term)
        || agent(c.seller_agent_id).toLowerCase().includes(term)
        || exchangeOwnerTypeLabel(exchangeById.get(c.buyer_exchange_id)?.owner_type).toLowerCase().includes(term)
        || exchangeOwnerTypeLabel(c.seller_exchange_id ? exchangeById.get(c.seller_exchange_id)?.owner_type : null).toLowerCase().includes(term)
        || c.status.toLowerCase().includes(term)
        || resolveListingName(currentProperty ?? null, true).toLowerCase().includes(term)
        || resolveListingName(candidate ?? null, true).toLowerCase().includes(term)
        || conversationMessages.some((message) => message.content.toLowerCase().includes(term)));
    }),
    [connections, term, recordStatus, agent, exchangeById, matchById, currentPropertyByExchange, propertyById, messagesByConnection],
  );
  const fMatches = useMemo(
    () => matches.filter((m) => {
      const exchange = exchangeById.get(m.buyer_exchange_id);
      const currentProperty = currentPropertyByExchange.get(m.buyer_exchange_id);
      const candidate = propertyById.get(m.seller_property_id);
      return (recordStatus === "all" || m.status === recordStatus) && (!term
        || (m.status ?? "").toLowerCase().includes(term)
        || (m.boot_status ?? "").toLowerCase().includes(term)
        || (m.match_classification ?? "").toLowerCase().includes(term)
        || exchangeOwnerTypeLabel(exchange?.owner_type).toLowerCase().includes(term)
        || agent(exchange?.agent_id ?? null).toLowerCase().includes(term)
        || resolveListingName(currentProperty ?? null, true).toLowerCase().includes(term)
        || resolveListingName(candidate ?? null, true).toLowerCase().includes(term));
    }),
    [matches, term, recordStatus, exchangeById, currentPropertyByExchange, propertyById, agent],
  );
  const conversationDatasetStatus: DatasetStatus = datasetStatuses.connections === "failed"
    ? "failed"
    : datasetStatuses.messages === "failed"
      ? "partial"
      : datasetStatuses.connections;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const loadIssues = (Object.entries(datasetErrors) as Array<[DatasetKey, string]>);
  const totalFailure = adminDealsHasTotalFailure(datasetStatuses);
  const openConnections = connections.filter((connection) => ["pending", "accepted", "in_progress"].includes(connection.status));
  const connectedMatchIds = new Set(connections.map((connection) => connection.match_id).filter(Boolean));
  const unconnectedMatches = matches.filter((match) => match.status === "active" && !connectedMatchIds.has(match.id));
  const listedProperties = properties.filter((property) => property.status === "active" || Boolean(property.listed_at));
  const draftProperties = properties.filter((property) => property.status === "draft");
  const missingPhotoProperties = properties.filter((property) => !firstImageByProperty.has(property.id));

  return (
    <div className="space-y-6">
      <CrmPageHeader
        eyebrow={mode === "properties" ? "Property inventory" : "Deal workflow"}
        title={mode === "properties" ? "Properties" : "Opportunities"}
        description={mode === "properties"
          ? "See every current property and listing with its owner, exchange, financial position, photos, and matched opportunities in one directory."
          : `Follow each ${scope} exchange from the current property to its matches and the agent conversations that move it forward.`}
        actions={<div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => void loadDeals()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>{mode === "opportunities" && isDemo && <ReseedStagingButton />}</div>}
      />

      {loadIssues.length > 0 && (
        <LoadHealthNotice issues={loadIssues} totalFailure={totalFailure} onRetry={loadDeals} />
      )}

      {!totalFailure && <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {mode === "properties" ? <>
          <MetricTile label="All properties" value={properties.length} icon={Building2} detail={`${scope} property records`} tone="blue" />
          <MetricTile label="Listed or active" value={listedProperties.length} icon={Home} detail="Visible inventory and active exchanges" tone="green" />
          <MetricTile label="Drafts" value={draftProperties.length} icon={CircleDollarSign} detail="Started but not yet published" tone={draftProperties.length ? "amber" : "slate"} />
          <MetricTile label="Missing photos" value={missingPhotoProperties.length} icon={ImageOff} detail="Listings that may need follow-up" tone={missingPhotoProperties.length ? "amber" : "slate"} />
        </> : <>
          <MetricTile label="Active exchanges" value={exchanges.filter((exchange) => ["active", "in_identification", "in_closing"].includes(exchange.status)).length} icon={Building2} detail={`${exchanges.length} total exchange workspaces`} tone="blue" />
          <MetricTile label="Matched opportunities" value={matches.filter((match) => match.status === "active").length} icon={Sparkles} detail={`${matches.length} matches in this workspace`} tone="green" />
          <MetricTile label="Agent conversations" value={openConnections.length} icon={Handshake} detail={`${connections.length} total conversation records`} tone="blue" />
          <MetricTile label="Ready to advance" value={unconnectedMatches.length} icon={MessageSquare} detail="Active matches without a conversation" tone={unconnectedMatches.length ? "amber" : "slate"} />
        </>}
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        {mode === "opportunities" && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><TabsList className="grid h-auto w-full grid-cols-1 rounded-none bg-slate-50 p-1.5 sm:grid-cols-3">
          <WorkflowTab value="matches" label="Matches" detail="Review property fit" count={adminDealsCountLabel(datasetStatuses.matches, fMatches.length, matches.length)} icon={Sparkles} />
          <WorkflowTab value="exchanges" label="Exchanges" detail="Track active searches" count={adminDealsCountLabel(datasetStatuses.exchanges, fExchanges.length, exchanges.length)} icon={Building2} />
          <WorkflowTab value="connections" label="Conversations" detail="Follow agent activity" count={adminDealsCountLabel(conversationDatasetStatus, fConnections.length, connections.length)} icon={MessageSquare} />
        </TabsList></div>}

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); if (selectedPropertyId) { const next = new URLSearchParams(searchParams); next.delete("property"); setSearchParams(next, { replace: true }); } }} placeholder={mode === "properties" ? "Search property, owner, market, or asset type" : "Search owner, client, property, agent, or status"} className="pl-9" aria-label={mode === "properties" ? "Search properties" : "Search opportunities"} />
          </div>
          <select value={recordStatus} onChange={(event) => setRecordStatus(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700" aria-label="Filter by status">
            <option value="all">All statuses</option>
            {statusOptions.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}
          </select>
          {(search || recordStatus !== "all" || selectedPropertyId) && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setRecordStatus("all"); const next = new URLSearchParams(searchParams); next.delete("q"); next.delete("property"); setSearchParams(next, { replace: true }); }}>Clear filters</Button>}
        </div>

        {/* Exchanges */}
        <TabsContent value="exchanges" className="mt-4">
          <TableCard empty={fExchanges.length === 0} emptyLabel="No exchanges found." status={datasetStatuses.exchanges} error={datasetErrors.exchanges} onRetry={loadDeals}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exchange workspace</TableHead>
                  <TableHead>Current property</TableHead>
                  <TableHead>Owner and client</TableHead>
                  <TableHead className="w-[100px] text-center">Matches</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[150px]">Exchange proceeds</TableHead>
                  <TableHead className="w-10"><span className="sr-only">Open</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fExchanges.map((e) => { const current = currentPropertyByExchange.get(e.id); return (
                  <TableRow key={e.id} className="group cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/admin/opportunities/exchanges/${e.id}`)}>
                    <TableCell><p className="text-sm font-semibold text-slate-950">{exchangeManagedForLabel(e.owner_type, clientName.get(e.client_id))}</p><p className="mt-1 text-xs text-slate-500">Created {fmtDate(e.created_at)} · {exchangeOwnerTypeLabel(e.owner_type)}</p></TableCell>
                    <TableCell><p className="max-w-[260px] truncate text-sm font-medium">{current ? resolveListingName(current, true) : "Property not added"}</p><p className="mt-1 text-xs text-slate-500">{current ? [current.city, current.state].filter(Boolean).join(", ") || "Location not provided" : "Exchange setup incomplete"}</p></TableCell>
                    <TableCell><p className="text-sm font-medium">{agent(e.agent_id)}</p><p className="mt-1 text-xs text-slate-500">{exchangeManagedForLabel(e.owner_type, clientName.get(e.client_id))}</p></TableCell>
                    <TableCell className="text-center text-sm font-semibold">{matchCountByExchange.get(e.id) ?? 0}</TableCell>
                    <TableCell><StatusPill value={e.status} /></TableCell>
                    <TableCell className="text-sm font-medium">{money(e.exchange_proceeds)}</TableCell>
                    <TableCell><ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" /></TableCell>
                  </TableRow>
                ); })}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        {/* Properties */}
        <TabsContent value="properties" className="mt-4">
          <TableCard empty={fProperties.length === 0} emptyLabel="No properties found." status={datasetStatuses.properties} error={datasetErrors.properties} onRetry={loadDeals}>
            <div className="divide-y divide-slate-100">
              {fProperties.map((property) => {
                const exchange = exchangeById.get(property.exchange_id ?? "");
                return <PropertyDirectoryCard key={property.id} property={property} financial={financialByProperty.get(property.id)} image={firstImageByProperty.get(property.id)} matchCount={matchCountByProperty.get(property.id) ?? 0} relationship={currentPropertyIds.has(property.id) ? "Current property" : "Available listing"} ownerType={exchangeOwnerTypeLabel(exchange?.owner_type)} ownerName={agent(property.agent_id)} managedFor={exchange ? exchangeManagedForLabel(exchange.owner_type, exchange.client_id ? clientName.get(exchange.client_id) : null) : "Standalone listing"} onOpen={() => navigate(`/admin/properties/${property.id}`)} />;
              })}
            </div>
          </TableCard>
        </TabsContent>

        {/* Matches */}
        <TabsContent value="matches" className="mt-4">
          <TableCard empty={fMatches.length === 0} emptyLabel="No matches found." status={datasetStatuses.matches} error={datasetErrors.matches} onRetry={loadDeals}>
            <div className="divide-y divide-slate-100">
                {fMatches.map((m) => {
                  const exchange = exchangeById.get(m.buyer_exchange_id);
                  const currentProperty = currentPropertyByExchange.get(m.buyer_exchange_id);
                  const candidate = propertyById.get(m.seller_property_id);
                  const conversation = connections.find((connection) => connection.match_id === m.id);
                  return <MatchOpportunityCard key={m.id} match={m} exchange={exchange} currentProperty={currentProperty} candidate={candidate} candidateFinancial={candidate ? financialByProperty.get(candidate.id) : undefined} candidateImage={candidate ? firstImageByProperty.get(candidate.id) : undefined} accountOwner={agent(exchange?.agent_id ?? null)} managedFor={exchangeManagedForLabel(exchange?.owner_type, exchange?.client_id ? clientName.get(exchange.client_id) : null)} conversationStatus={conversation?.status ?? null} onOpen={() => navigate(`/admin/opportunities/matches/${m.id}`)} />;
                })}
            </div>
          </TableCard>
        </TabsContent>

        {/* Connections */}
        <TabsContent value="connections" className="mt-4">
          <TableCard empty={fConnections.length === 0} emptyLabel="No conversations found." status={conversationDatasetStatus} error={datasetErrors.connections ?? datasetErrors.messages} onRetry={loadDeals}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Started</TableHead>
                  <TableHead>Agents</TableHead>
                  <TableHead>Property opportunity</TableHead>
                  <TableHead>Latest message</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[95px] text-right">Messages</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fConnections.map((c) => {
                  const linkedMatch = c.match_id ? matchById.get(c.match_id) : null;
                  const currentProperty = linkedMatch ? currentPropertyByExchange.get(linkedMatch.buyer_exchange_id) : null;
                  const candidate = linkedMatch ? propertyById.get(linkedMatch.seller_property_id) : null;
                  const conversationMessages = messagesByConnection.get(c.id) ?? [];
                  const latest = conversationMessages[0];
                  return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/opportunities/connections/${c.id}`)}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{agent(c.buyer_agent_id)}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">with {agent(c.seller_agent_id)}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{currentProperty ? resolveListingName(currentProperty, true) : "Current property unavailable"}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">→ {candidate ? resolveListingName(candidate, true) : "Matched property unavailable"}</div>
                    </TableCell>
                    <TableCell className="max-w-[330px] text-sm"><div className="truncate">{latest?.content || "No messages yet"}</div>{latest && <div className="mt-0.5 text-xs text-muted-foreground">{agent(latest.sender_id)} · {fmtDate(latest.created_at)}</div>}</TableCell>
                    <TableCell><StatusPill value={c.status} /></TableCell>
                    <TableCell className="text-right text-sm font-semibold">{conversationMessages.length}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>
      </Tabs>
      </>}
    </div>
  );
}

function WorkflowTab({ value, label, detail, count, icon: Icon }: { value: string; label: string; detail: string; count: string; icon: LucideIcon }) {
  return (
    <TabsTrigger value={value} className="h-auto justify-start gap-3 rounded-lg px-3 py-3 text-left data-[state=active]:bg-white data-[state=active]:shadow-sm">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon className="h-4 w-4" /></span>
      <span className="min-w-0"><span className="flex items-center gap-1.5 text-sm font-semibold"><span>{label}</span><span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{count}</span></span><span className="mt-0.5 hidden text-[11px] font-normal text-slate-500 sm:block">{detail}</span></span>
    </TabsTrigger>
  );
}

function PropertyDirectoryCard({ property, financial, image, matchCount, relationship, ownerType, ownerName, managedFor, onOpen }: {
  property: Property;
  financial?: Financials;
  image?: PropertyImage;
  matchCount: number;
  relationship: string;
  ownerType: string;
  ownerName: string;
  managedFor: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="group flex w-full min-w-0 flex-col bg-white text-left transition hover:bg-slate-50 md:flex-row md:items-stretch">
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100 md:h-auto md:min-h-36 md:w-44 xl:w-52">
        {image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" /> : <PropertyPhotoPlaceholder className="h-full min-h-40 w-full" compact />}
        <Badge variant="outline" className="absolute left-3 top-3 border-white/70 bg-white/90 text-[10px] text-slate-700 shadow-sm">{relationship}</Badge>
      </div>
      <div className="min-w-0 flex-1 p-4 lg:p-5">
        <div className="grid h-full min-w-0 gap-5 lg:grid-cols-[minmax(220px,1fr)_minmax(300px,.95fr)_minmax(210px,.75fr)_auto] lg:items-center xl:gap-7">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(property, true)}</p>
              <StatusPill value={property.status} />
            </div>
            <p className="mt-1.5 truncate text-xs text-slate-500">{[property.city, property.state].filter(Boolean).join(", ") || "Location not provided"}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">{property.asset_type ? pretty(property.asset_type) : "Asset type not provided"}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3.5">
            <CompactFact label="Value" value={money(financial?.asking_price ?? financial?.appraised_value ?? null)} />
            <CompactFact label="NOI" value={money(financial?.noi ?? null)} />
            <CompactFact label="Cap rate" value={formatPercent(financial?.cap_rate)} />
          </div>
          <div className="min-w-0 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Owner and client</p>
            <p className="mt-1.5 truncate text-xs font-semibold text-slate-800">{ownerName}</p>
            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{ownerType} · {managedFor}</p>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:min-w-24 lg:justify-end lg:border-t-0 lg:pt-0">
            <div className="lg:text-right"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">Opportunities</p><p className="mt-1.5 text-xs font-semibold text-slate-700">{matchCount} {matchCount === 1 ? "match" : "matches"}</p></div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
          </div>
        </div>
      </div>
    </button>
  );
}

function MatchOpportunityCard({ match, exchange, currentProperty, candidate, candidateFinancial, candidateImage, accountOwner, managedFor, conversationStatus, onOpen }: {
  match: Match;
  exchange?: Exchange;
  currentProperty?: Property;
  candidate?: Property;
  candidateFinancial?: Financials;
  candidateImage?: PropertyImage;
  accountOwner: string;
  managedFor: string;
  conversationStatus: string | null;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="group block w-full p-4 text-left transition hover:bg-slate-50 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-32">{candidateImage ? <img src={resolvePropertyImageUrl(candidateImage.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" compact />}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white">{Math.round(match.total_score)} score</span><StatusPill value={match.status} />{conversationStatus && <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[10px] text-blue-700">Conversation {pretty(conversationStatus)}</Badge>}</div>
            <p className="mt-2 truncate text-base font-semibold text-slate-950 group-hover:text-emerald-700">{candidate ? resolveListingName(candidate, true) : "Matched property unavailable"}</p>
            <p className="mt-1 truncate text-xs text-slate-500">Matched against {currentProperty ? resolveListingName(currentProperty, true) : "current property unavailable"}</p>
          </div>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4 xl:w-[560px]">
          <CompactFact label="Purchase price" value={money(candidateFinancial?.asking_price ?? null)} />
          <CompactFact label="Projected NOI" value={money(candidateFinancial?.noi ?? null)} />
          <CompactFact label="ROE improvement" value={match.roe_improvement_pp != null ? `${match.roe_improvement_pp.toFixed(1)} pts` : "—"} />
          <CompactFact label="Boot" value={pretty(match.boot_status)} />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 xl:w-44 xl:justify-end"><div className="min-w-0 xl:text-right"><p className="truncate text-xs font-semibold text-slate-800">{accountOwner}</p><p className="mt-1 truncate text-[10px] text-slate-500">{managedFor} · {fmtDate(match.created_at)}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" /></div>
      </div>
      {exchange && <span className="sr-only">Exchange {exchange.id}</span>}
    </button>
  );
}

function CompactFact({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-semibold capitalize text-slate-800">{value || "—"}</p></div>;
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toFixed(2)}%`;
}

function ReseedStagingButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Re-seed the staging (is_demo) dataset? This wipes prior staging rows for the fixture agents.")) return;
        setBusy(true);
        const { data, error } = await supabase.functions.invoke("seed-staging-dataset", { body: {} });
        setBusy(false);
        if (error) {
          toast({ title: "Re-seed failed", description: error.message, variant: "destructive" });
          return;
        }
        const manifest = data as StagingDatasetManifest | null;
        toast({
          title: "Staging dataset ready",
          description: `Buyer exchange ${manifest?.buyer?.exchange_id?.slice(0, 8)} · 4 candidate listings${manifest?.seller?.exchange_id ? " · seller-side exchange included" : ""}`,
        });
        console.log("[staging] manifest", data);
      }}
    >
      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
      Re-seed staging data
    </Button>
  );
}


function LoadHealthNotice({
  issues,
  totalFailure,
  onRetry,
}: {
  issues: Array<[DatasetKey, string]>;
  totalFailure: boolean;
  onRetry: () => Promise<void>;
}) {
  return (
    <Card className={`mb-4 ${totalFailure ? "border-red-300 bg-red-50" : "border-amber-300 bg-amber-50"}`} role="alert">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${totalFailure ? "text-red-700" : "text-amber-700"}`} />
          <div>
            <p className={`font-semibold ${totalFailure ? "text-red-950" : "text-amber-950"}`}>
              {totalFailure ? "Admin records could not be loaded" : "Admin records are showing partial data"}
            </p>
            <p className={`mt-1 text-sm ${totalFailure ? "text-red-800" : "text-amber-800"}`}>
              {totalFailure
                ? "The primary datasets are unavailable, so no empty totals are being presented as authoritative."
                : "Available records are shown below, but counts and names may be incomplete until every dataset loads successfully."}
            </p>
            <ul className={`mt-2 space-y-1 text-xs ${totalFailure ? "text-red-800" : "text-amber-800"}`}>
              {issues.map(([dataset, message]) => <li key={dataset}><span className="font-semibold">{DATASET_LABELS[dataset]}:</span> {message}</li>)}
            </ul>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void onRetry()} className="shrink-0 bg-background">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry loading
        </Button>
      </CardContent>
    </Card>
  );
}

function TableCard({
  empty,
  emptyLabel,
  status,
  error,
  onRetry,
  children,
}: {
  empty: boolean;
  emptyLabel: string;
  status: DatasetStatus;
  error?: string;
  onRetry: () => Promise<void>;
  children: React.ReactNode;
}) {
  if (status === "failed") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="font-medium text-foreground">This dataset is unavailable.</p>
          <p className="mt-1 text-sm text-muted-foreground">{error || "The request failed before this data could be loaded."}</p>
          <Button variant="outline" size="sm" onClick={() => void onRetry()} className="mt-4"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
        </CardContent>
      </Card>
    );
  }
  if (empty) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          {status === "partial" ? "No records were returned from the portion that loaded. Results remain incomplete." : emptyLabel}
        </CardContent>
      </Card>
    );
  }
  return <Card><div className="overflow-x-auto">{children}</div></Card>;
}
