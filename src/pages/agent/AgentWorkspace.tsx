import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Inbox as InboxIcon, MapPin, Pencil, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { InboxList, type InboxClientGroup } from "@/features/matches/components/inbox/InboxList";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";

import {
  deriveUiStatus,
  sortRelationships,
  type SortKey,
  type UiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
import { EMPTY_FILTERS, type MatchFilters } from "@/features/matches/components/inbox/SortFilterBar";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";
import { EXCHANGE_STATUS_COLORS, EXCHANGE_STATUS_LABELS } from "@/lib/constants";
import { setLastListing } from "@/features/workspace/lib/lastListing";

interface WorkspaceData {
  exchange: {
    id: string;
    status: string;
    client_id: string;
    relinquished_property_id: string | null;
  };
  client: { id: string; client_name: string } | null;
  property: {
    id: string;
    property_name: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  } | null;
  financials: { asking_price: number | null; cap_rate: number | null } | null;
  siblingExchanges: Array<{
    id: string;
    propertyName: string | null;
    city: string | null;
    state: string | null;
    status: string;
  }>;
}

async function fetchWorkspace(exchangeId: string, agentId: string): Promise<WorkspaceData | null> {
  const { data: ex } = await supabase
    .from("exchanges")
    .select("id, status, client_id, relinquished_property_id")
    .eq("id", exchangeId)
    .eq("agent_id", agentId)
    .single();
  if (!ex) return null;

  const [clientRes, propRes, finRes, siblingExchangesRes] = await Promise.all([
    ex.client_id
      ? supabase.from("agent_clients").select("id, client_name").eq("id", ex.client_id).single()
      : Promise.resolve({ data: null }),
    ex.relinquished_property_id
      ? supabase
          .from("pledged_properties")
          .select("id, property_name, address, city, state")
          .eq("id", ex.relinquished_property_id)
          .single()
      : Promise.resolve({ data: null }),
    ex.relinquished_property_id
      ? supabase
          .from("property_financials")
          .select("asking_price, cap_rate")
          .eq("property_id", ex.relinquished_property_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    ex.client_id
      ? supabase
          .from("exchanges")
          .select("id, status, relinquished_property_id, created_at")
          .eq("agent_id", agentId)
          .eq("client_id", ex.client_id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const siblingRows = (siblingExchangesRes as any).data ?? [];
  const siblingPropIds = siblingRows
    .map((r: any) => r.relinquished_property_id)
    .filter(Boolean) as string[];
  const sibPropsRes = siblingPropIds.length
    ? await supabase
        .from("pledged_properties")
        .select("id, property_name, city, state")
        .in("id", siblingPropIds)
    : { data: [] as any[] };
  const sibPropMap = new Map((sibPropsRes.data ?? []).map((p: any) => [p.id, p]));

  return {
    exchange: ex as any,
    client: (clientRes as any).data ?? null,
    property: (propRes as any).data ?? null,
    financials: (finRes as any).data ?? null,
    siblingExchanges: siblingRows.map((r: any) => {
      const p = r.relinquished_property_id ? sibPropMap.get(r.relinquished_property_id) : null;
      return {
        id: r.id,
        propertyName: (p as any)?.property_name ?? null,
        city: (p as any)?.city ?? null,
        state: (p as any)?.state ?? null,
        status: r.status,
      };
    }),
  };
}

function fmtPrice(v: number | null | undefined) {
  if (!v) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

export default function AgentWorkspace() {
  const { exchangeId } = useParams<{ exchangeId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, isLoading: wsLoading, isError } = useQuery({
    queryKey: ["workspace", exchangeId, user?.id],
    queryFn: () => fetchWorkspace(exchangeId!, user!.id),
    enabled: !!exchangeId && !!user?.id,
  });

  const { data: allRels = [], isLoading: relsLoading } = useUnifiedRelationships();
  const { data: agentListings = [] } = useAgentListings(user?.id);

  const clientGroups = useMemo<InboxClientGroup[]>(() => {
    const map = new Map<string, InboxClientGroup>();
    for (const l of agentListings) {
      const key = l.clientId ?? "__unassigned";
      if (!map.has(key)) {
        map.set(key, {
          clientId: l.clientId,
          clientName: l.clientName ?? "Unassigned",
          listings: [],
        });
      }
      map.get(key)!.listings.push({
        exchangeId: l.id,
        propertyLabel:
          l.propertyName ||
          l.address ||
          [l.city, l.state].filter(Boolean).join(", ") ||
          "Untitled listing",
        city: l.city,
        state: l.state,
        status: l.status,
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      a.clientName.localeCompare(b.clientName),
    );
  }, [agentListings]);

  useEffect(() => {
    if (exchangeId && user?.id) setLastListing(user.id, exchangeId);
  }, [exchangeId, user?.id]);

  const exchangeRels = useMemo(
    () => allRels.filter((r) => r.buyerExchangeId === exchangeId),
    [allRels, exchangeId],
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | UiStatus>("all");
  const [sort, setSort] = useState<SortKey>("best_match");
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const selectedMatchId = searchParams.get("match");

  const annotated = useMemo(
    () =>
      exchangeRels.map((r) => ({
        rel: r,
        status: deriveUiStatus(r, readMatchLocalState(r.matchId)),
      })),
    [exchangeRels],
  );

  const counts = useMemo(() => {
    const c: Record<"all" | UiStatus, number> = {
      all: annotated.length,
      new: 0,
      sent_to_client: 0,
      client_interested: 0,
      agent_connected: 0,
      reviewing_docs: 0,
      loi: 0,
      under_contract: 0,
      closed: 0,
      archived: 0,
    };
    for (const a of annotated) c[a.status]++;
    return c;
  }, [annotated]);

  const visibleRels = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = annotated
      .filter((a) => (filter === "all" ? true : a.status === filter))
      .filter((a) => a.rel.score >= filters.minScore)
      .filter((a) =>
        filters.states.length === 0
          ? true
          : a.rel.propertyState
            ? filters.states.includes(a.rel.propertyState)
            : false,
      )
      .filter((a) => {
        const p = a.rel.askingPrice ?? null;
        if (filters.priceMin != null && (p == null || p < filters.priceMin)) return false;
        if (filters.priceMax != null && (p == null || p > filters.priceMax)) return false;
        return true;
      })
      .filter((a) => {
        if (!q) return true;
        const r = a.rel;
        return (
          r.propertyName.toLowerCase().includes(q) ||
          (r.propertyCity ?? "").toLowerCase().includes(q) ||
          (r.counterpartyName ?? "").toLowerCase().includes(q)
        );
      })
      .map((a) => a.rel);
    return sortRelationships(filtered, sort);
  }, [annotated, filter, search, sort, filters]);

  const rankMap = useMemo(() => {
    const m = new Map<string, number>();
    visibleRels.forEach((r, i) => m.set(r.id, i + 1));
    return m;
  }, [visibleRels]);

  const selected = useMemo(() => {
    if (selectedMatchId) {
      const inVisible = visibleRels.find(
        (r) => r.matchId === selectedMatchId || r.id === selectedMatchId,
      );
      if (inVisible) return inVisible;
      // Honor incoming ?match= even if current filters would hide it.
      const inScope = exchangeRels.find(
        (r) => r.matchId === selectedMatchId || r.id === selectedMatchId,
      );
      if (inScope) return inScope;
    }
    return visibleRels[0] ?? null;
  }, [visibleRels, exchangeRels, selectedMatchId]);

  // Keep ?match in sync with current selection
  useEffect(() => {
    if (!selected) return;
    if (selectedMatchId === selected.matchId) return;
    const next = new URLSearchParams(searchParams);
    next.set("match", selected.matchId);
    setSearchParams(next, { replace: true });
  }, [selected, selectedMatchId, searchParams, setSearchParams]);

  function selectRel(rel: Relationship) {
    const next = new URLSearchParams(searchParams);
    next.set("match", rel.matchId);
    setSearchParams(next);
    setMobileDetailOpen(true);
  }

  if (wsLoading || relsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data || !exchangeId) {
    return <Navigate to="/agent/pipeline" replace />;
  }

  const { exchange, client, property, financials, siblingExchanges } = data;
  const accent = getClientAccent(exchange.client_id);
  const propertyTitle =
    property?.property_name ||
    property?.address ||
    (exchange.status === "draft" ? "Draft — no property yet" : "Untitled property");
  const location = [property?.city, property?.state].filter(Boolean).join(", ");

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
      {/* Breadcrumb */}
      <nav
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-lg border border-l-[4px] bg-card px-3 py-2 text-sm",
          accent.borderLeft,
        )}
        aria-label="Breadcrumb"
      >
        <Link
          to={client ? `/agent/clients/${client.id}` : "/agent/clients"}
          className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary"
        >
          <span className={cn("h-2 w-2 rounded-full", accent.dot)} />
          {client?.client_name ?? "Client"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate font-medium text-muted-foreground">{propertyTitle}</span>
      </nav>

      {/* Property switcher (same client only) */}
      {siblingExchanges.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Properties:
          </span>
          {siblingExchanges.map((s) => {
            const isCurrent = s.id === exchangeId;
            const label =
              s.propertyName ||
              [s.city, s.state].filter(Boolean).join(", ") ||
              "Untitled";
            return (
              <Link
                key={s.id}
                to={`/agent/workspace/${s.id}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  isCurrent
                    ? cn("border-transparent font-semibold", accent.soft, accent.fg)
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="max-w-[140px] truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Property summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-foreground">{propertyTitle}</h1>
            <Badge
              className={cn(
                EXCHANGE_STATUS_COLORS[exchange.status] || "bg-muted text-muted-foreground",
                "text-[10px]",
              )}
            >
              {EXCHANGE_STATUS_LABELS[exchange.status] || exchange.status}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {location}
              </span>
            )}
            {fmtPrice(financials?.asking_price ?? null) && (
              <span className="font-medium text-foreground">
                {fmtPrice(financials?.asking_price ?? null)}
              </span>
            )}
            {financials?.cap_rate != null && (
              <span>{Number(financials.cap_rate).toFixed(1)}% cap</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/agent/exchanges/${exchangeId}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit listing
            </Link>
          </Button>
        </div>
      </div>

      {/* Matches area */}
      {exchangeRels.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
          <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-base font-semibold text-foreground">No matches yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {exchange.status === "draft"
              ? "Publish this listing to start receiving matches."
              : "We'll surface matching properties here as they come in."}
          </p>
          {exchange.status === "draft" && (
            <Button asChild size="sm" className="mt-4">
              <Link to={`/agent/exchanges/${exchangeId}/edit`}>
                <Plus className="mr-1 h-4 w-4" /> Finish listing
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
          <div
            className={cn(
              "min-h-0 min-w-0",
              mobileDetailOpen ? "hidden lg:block" : "block",
            )}
          >
            <InboxList
              rels={visibleRels}
              selectedId={selected?.id ?? null}
              onSelect={selectRel}
              search={search}
              onSearchChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
              sort={sort}
              onSortChange={setSort}
              filters={filters}
              onFiltersChange={setFilters}
              scopeRels={exchangeRels}
              rankMap={rankMap}
            />
          </div>

          <div
            className={
              mobileDetailOpen
                ? "flex min-h-0 min-w-0 flex-col gap-2"
                : "hidden min-h-0 min-w-0 lg:flex lg:flex-col lg:gap-2"
            }
          >
            {selected ? (
              <>
                <div className="flex shrink-0 items-center justify-between gap-2 lg:hidden">
                  <Button variant="ghost" size="sm" onClick={() => setMobileDetailOpen(false)}>
                    ← Back to matches
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  <PropertyReviewPanel
                    rel={selected}
                    rank={rankMap.get(selected.id) ?? null}
                    totalInScope={visibleRels.length}
                  />
                </div>
              </>
            ) : (
              <div className="flex w-full items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
                <div>
                  <InboxIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">Select a match</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pick a property from the inbox to review the deal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
