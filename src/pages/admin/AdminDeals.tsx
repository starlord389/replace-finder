import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { resolveListingName } from "@/lib/listingDisplay";
import { AlertTriangle, Database, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  exchangeManagedForLabel,
  exchangeOwnerTypeLabel,
} from "@/features/admin/lib/accountTypes";

type Exchange = Tables<"exchanges">;
type Property = Tables<"pledged_properties">;
type Match = Tables<"matches">;
type Connection = Tables<"exchange_connections">;
type DatasetKey = "exchanges" | "properties" | "matches" | "connections" | "profiles" | "clients";
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
  profiles: "User profiles",
  clients: "Client records",
};

const INITIAL_DATASET_STATUSES: DatasetStatuses = {
  exchanges: "loading",
  properties: "loading",
  matches: "loading",
  connections: "loading",
  profiles: "loading",
  clients: "loading",
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
  const [agentName, setAgentName] = useState<Map<string, string>>(new Map());
  const [clientName, setClientName] = useState<Map<string, string>>(new Map());
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

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
    setAgentName(new Map());
    setClientName(new Map());

    const [exchangeResult, propertyResult] = await Promise.all([
      supabase.from("exchanges").select("*").eq("is_demo", false).order("created_at", { ascending: false }),
      supabase.from("pledged_properties").select("*").eq("is_demo", false).order("created_at", { ascending: false }),
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
    const [matchResult, connectionResult, profileResult, clientResult] = await Promise.all([
      matchScope.length
        ? supabase.from("matches").select("*").or(matchScope.join(",")).order("created_at", { ascending: false })
        : unavailable("Matches were not queried because both exchange and property scopes failed to load."),
      !exchangeResult.error
        ? supabase.from("exchange_connections").select("*").or(`buyer_exchange_id.in.(${exchangeScopeIds.join(",")}),seller_exchange_id.in.(${exchangeScopeIds.join(",")})`).order("created_at", { ascending: false })
        : unavailable("Connections were not queried because the live exchange scope failed to load."),
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("agent_clients").select("id, client_name"),
    ]);
    if (requestId !== requestSequence.current) return;

    const statuses: DatasetStatuses = {
      exchanges: exchangeResult.error ? "failed" : "loaded",
      properties: propertyResult.error ? "failed" : "loaded",
      matches: matchResult.error ? "failed" : exchangeResult.error || propertyResult.error ? "partial" : "loaded",
      connections: connectionResult.error ? "failed" : "loaded",
      profiles: profileResult.error ? "failed" : "loaded",
      clients: clientResult.error ? "failed" : "loaded",
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
    if (profileResult.error) errors.profiles = profileResult.error.message;
    if (clientResult.error) errors.clients = clientResult.error.message;

    setExchanges(liveExchanges);
    setProperties(liveProperties);
    setMatches(matchResult.error ? [] : (matchResult.data ?? []) as Match[]);
    setConnections(connectionResult.error ? [] : (connectionResult.data ?? []) as Connection[]);
    setAgentName(new Map(profileResult.error ? [] : (profileResult.data ?? []).map((profile) => [profile.id, profile.full_name || profile.email || "Unknown"])));
    setClientName(new Map(clientResult.error ? [] : (clientResult.data ?? []).map((client) => [client.id, client.client_name])));
    setDatasetStatuses(statuses);
    setDatasetErrors(errors);
    setLoading(false);
  }, []);

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
  const currentPropertyByExchange = useMemo(() => {
    const map = new Map<string, Property>();
    for (const exchange of exchanges) {
      const property = (exchange.relinquished_property_id ? propertyById.get(exchange.relinquished_property_id) : null)
        ?? properties.find((item) => item.exchange_id === exchange.id);
      if (property) map.set(exchange.id, property);
    }
    return map;
  }, [exchanges, properties, propertyById]);

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
    setSearchParams(next, { replace: true });
  }
  const fExchanges = useMemo(
    () => exchanges.filter((e) => !term || agent(e.agent_id).toLowerCase().includes(term) || exchangeManagedForLabel(e.owner_type, clientName.get(e.client_id)).toLowerCase().includes(term) || exchangeOwnerTypeLabel(e.owner_type).toLowerCase().includes(term) || e.status.toLowerCase().includes(term)),
    [exchanges, term, agent, clientName],
  );
  const fProperties = useMemo(
    () => properties.filter((p) => {
      if (selectedPropertyId && p.id !== selectedPropertyId) return false;
      const ownerType = exchangeById.get(p.exchange_id ?? "")?.owner_type;
      return !term || resolveListingName(p, true).toLowerCase().includes(term) || (p.property_name ?? "").toLowerCase().includes(term) || (p.address ?? "").toLowerCase().includes(term) || (p.city ?? "").toLowerCase().includes(term) || (p.state ?? "").toLowerCase().includes(term) || (p.zip ?? "").toLowerCase().includes(term) || (p.asset_type ?? "").toLowerCase().includes(term) || agent(p.agent_id).toLowerCase().includes(term) || exchangeOwnerTypeLabel(ownerType).toLowerCase().includes(term);
    }),
    [properties, selectedPropertyId, term, agent, exchangeById],
  );
  const fConnections = useMemo(
    () => connections.filter((c) => !term || agent(c.buyer_agent_id).toLowerCase().includes(term) || agent(c.seller_agent_id).toLowerCase().includes(term) || exchangeOwnerTypeLabel(exchangeById.get(c.buyer_exchange_id)?.owner_type).toLowerCase().includes(term) || exchangeOwnerTypeLabel(c.seller_exchange_id ? exchangeById.get(c.seller_exchange_id)?.owner_type : null).toLowerCase().includes(term) || c.status.toLowerCase().includes(term)),
    [connections, term, agent, exchangeById],
  );
  const fMatches = useMemo(
    () => matches.filter((m) => {
      const exchange = exchangeById.get(m.buyer_exchange_id);
      const currentProperty = currentPropertyByExchange.get(m.buyer_exchange_id);
      const candidate = propertyById.get(m.seller_property_id);
      return !term
        || (m.status ?? "").toLowerCase().includes(term)
        || (m.boot_status ?? "").toLowerCase().includes(term)
        || (m.match_classification ?? "").toLowerCase().includes(term)
        || exchangeOwnerTypeLabel(exchange?.owner_type).toLowerCase().includes(term)
        || agent(exchange?.agent_id ?? null).toLowerCase().includes(term)
        || resolveListingName(currentProperty ?? null, true).toLowerCase().includes(term)
        || resolveListingName(candidate ?? null, true).toLowerCase().includes(term);
    }),
    [matches, term, exchangeById, currentPropertyByExchange, propertyById, agent],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const loadIssues = (Object.entries(datasetErrors) as Array<[DatasetKey, string]>);
  const totalFailure = adminDealsHasTotalFailure(datasetStatuses);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{mode === "properties" ? "Properties" : "Opportunities"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "properties"
              ? "The canonical listing directory across agent-managed clients and self-managed property owners. Open any property for photos, financials, exchange context, and matched opportunities."
              : "Track every active exchange, matched opportunity, and agent conversation from one operating queue (demo data excluded)."}
          </p>
        </div>
        {mode === "opportunities" && <ReseedStagingButton />}
      </div>

      {loadIssues.length > 0 && (
        <LoadHealthNotice issues={loadIssues} totalFailure={totalFailure} onRetry={loadDeals} />
      )}

      {!totalFailure && <>
      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); if (selectedPropertyId) { const next = new URLSearchParams(searchParams); next.delete("property"); setSearchParams(next, { replace: true }); } }} placeholder={mode === "properties" ? "Search address, owner, location, asset type, or status…" : "Search account owner, client, account type, or status…"} className="pl-9" aria-label={mode === "properties" ? "Search properties" : "Search opportunities"} />
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        {mode === "opportunities" && <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matches">Matches ({adminDealsCountLabel(datasetStatuses.matches, fMatches.length, matches.length)})</TabsTrigger>
          <TabsTrigger value="exchanges">Exchanges ({adminDealsCountLabel(datasetStatuses.exchanges, fExchanges.length, exchanges.length)})</TabsTrigger>
          <TabsTrigger value="connections">Conversations ({adminDealsCountLabel(datasetStatuses.connections, fConnections.length, connections.length)})</TabsTrigger>
        </TabsList>}

        {/* Exchanges */}
        <TabsContent value="exchanges" className="mt-4">
          <TableCard empty={fExchanges.length === 0} emptyLabel="No exchanges found." status={datasetStatuses.exchanges} error={datasetErrors.exchanges} onRetry={loadDeals}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Created</TableHead>
                  <TableHead>Account type</TableHead>
                  <TableHead>Account owner</TableHead>
                  <TableHead>Managed for</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[120px]">Proceeds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fExchanges.map((e) => (
                  <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/opportunities/exchanges/${e.id}`)}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(e.created_at)}</TableCell>
                    <TableCell className="text-xs font-medium">{exchangeOwnerTypeLabel(e.owner_type)}</TableCell>
                    <TableCell className="text-sm">{agent(e.agent_id)}</TableCell>
                    <TableCell className="text-sm">{exchangeManagedForLabel(e.owner_type, clientName.get(e.client_id))}</TableCell>
                    <TableCell><StatusPill value={e.status} /></TableCell>
                    <TableCell className="text-sm">{money(e.exchange_proceeds)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        {/* Properties */}
        <TabsContent value="properties" className="mt-4">
          <TableCard empty={fProperties.length === 0} emptyLabel="No properties found." status={datasetStatuses.properties} error={datasetErrors.properties} onRetry={loadDeals}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Created</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Asset type</TableHead>
                  <TableHead>Account type</TableHead>
                  <TableHead>Account owner</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fProperties.map((p) => {
                  const ownerType = exchangeById.get(p.exchange_id ?? "")?.owner_type;
                  return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/properties/${p.id}`)}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</TableCell>
                    <TableCell className="text-sm font-medium">{resolveListingName(p, true)}</TableCell>
                    <TableCell className="text-sm">{[p.city, p.state].filter(Boolean).join(", ") || "-"}</TableCell>
                    <TableCell className="text-sm capitalize">{p.asset_type ? pretty(p.asset_type) : "-"}</TableCell>
                    <TableCell className="text-xs font-medium">{exchangeOwnerTypeLabel(ownerType)}</TableCell>
                    <TableCell className="text-sm">{agent(p.agent_id)}</TableCell>
                    <TableCell><StatusPill value={p.status} /></TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        {/* Matches */}
        <TabsContent value="matches" className="mt-4">
          <TableCard empty={fMatches.length === 0} emptyLabel="No matches found." status={datasetStatuses.matches} error={datasetErrors.matches} onRetry={loadDeals}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Created</TableHead>
                  <TableHead>Account / client</TableHead>
                  <TableHead>Current property</TableHead>
                  <TableHead>Matched property</TableHead>
                  <TableHead className="w-[100px]">Score</TableHead>
                  <TableHead className="w-[140px]">Boot</TableHead>
                  <TableHead className="w-[110px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fMatches.map((m) => {
                  const exchange = exchangeById.get(m.buyer_exchange_id);
                  const currentProperty = currentPropertyByExchange.get(m.buyer_exchange_id);
                  const candidate = propertyById.get(m.seller_property_id);
                  return <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/opportunities/matches/${m.id}`)}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(m.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{agent(exchange?.agent_id ?? null)}</div>
                      <div className="text-xs text-muted-foreground">{exchangeManagedForLabel(exchange?.owner_type, exchange?.client_id ? clientName.get(exchange.client_id) : null)}</div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{currentProperty ? resolveListingName(currentProperty, true) : "Property unavailable"}</TableCell>
                    <TableCell className="text-sm font-medium">{candidate ? resolveListingName(candidate, true) : "Property unavailable"}</TableCell>
                    <TableCell>
                      <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-slate-950 px-2 py-1 text-sm font-semibold text-white">{Math.round(m.total_score)}</span>
                    </TableCell>
                    <TableCell className="text-xs capitalize">{pretty(m.boot_status)}</TableCell>
                    <TableCell><StatusPill value={m.status} /></TableCell>
                  </TableRow>;
                })}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        {/* Connections */}
        <TabsContent value="connections" className="mt-4">
          <TableCard empty={fConnections.length === 0} emptyLabel="No connections found." status={datasetStatuses.connections} error={datasetErrors.connections} onRetry={loadDeals}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Started</TableHead>
                  <TableHead>Buyer account</TableHead>
                  <TableHead>Seller account</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[140px]">Facilitation fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fConnections.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/opportunities/connections/${c.id}`)}>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(c.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      <div>{agent(c.buyer_agent_id)}</div>
                      <div className="text-xs text-muted-foreground">{exchangeOwnerTypeLabel(exchangeById.get(c.buyer_exchange_id)?.owner_type)}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{agent(c.seller_agent_id)}</div>
                      <div className="text-xs text-muted-foreground">{exchangeOwnerTypeLabel(c.seller_exchange_id ? exchangeById.get(c.seller_exchange_id)?.owner_type : null)}</div>
                    </TableCell>
                    <TableCell><StatusPill value={c.status} /></TableCell>
                    <TableCell className="text-sm">
                      {c.facilitation_fee_amount != null ? money(c.facilitation_fee_amount) : "-"}
                      {c.facilitation_fee_status && (
                        <span className="ml-1 text-xs text-muted-foreground capitalize">({pretty(c.facilitation_fee_status)})</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>
      </Tabs>
      </>}
    </div>
  );
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
