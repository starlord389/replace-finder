import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { InboxList } from "@/features/matches/components/inbox/InboxList";
import { ExchangeContextBar } from "@/features/matches/components/inbox/ExchangeContextBar";
import {
  deriveUiStatus,
  sortRelationships,
  type SortKey,
  type UiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
import { EMPTY_FILTERS, type MatchFilters } from "@/features/matches/components/inbox/SortFilterBar";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";

// Legacy stage param → new UI filter
const LEGACY_FILTER_MAP: Record<string, "all" | UiStatus> = {
  live: "all",
  all: "all",
  new: "new",
  pending: "client_interested",
  active: "agent_connected",
  closed: "closed",
};

export default function AgentPipeline() {
  const { data: rels = [], isLoading } = useUnifiedRelationships();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [groupByClient, setGroupByClient] = useState(false);

  const rawFilter = searchParams.get("filter") ?? searchParams.get("stage") ?? "all";
  const filter = (LEGACY_FILTER_MAP[rawFilter] ?? (rawFilter as UiStatus | "all")) as "all" | UiStatus;
  const exchangeParam = (searchParams.get("exchange") ?? "all") as string | "all";
  const clientParam = (searchParams.get("client") ?? "all") as string | "all";
  const sort = (searchParams.get("sort") as SortKey) || "best_match";

  const scopedRels = useMemo(() => {
    if (exchangeParam !== "all") return rels.filter((r) => r.buyerExchangeId === exchangeParam);
    if (clientParam !== "all") return rels.filter((r) => r.clientId === clientParam);
    return rels;
  }, [rels, exchangeParam, clientParam]);

  const annotated = useMemo(
    () =>
      scopedRels.map((r) => ({
        rel: r,
        status: deriveUiStatus(r, readMatchLocalState(r.matchId)),
      })),
    [scopedRels],
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
          (r.clientName ?? "").toLowerCase().includes(q) ||
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

  function setFilter(f: "all" | UiStatus) {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    next.delete("stage");
    setSearchParams(next);
  }

  function setSort(k: SortKey) {
    const next = new URLSearchParams(searchParams);
    if (k === "best_match") next.delete("sort");
    else next.set("sort", k);
    setSearchParams(next);
  }

  function setExchange(id: string | "all") {
    const next = new URLSearchParams(searchParams);
    if (id === "all") next.delete("exchange");
    else next.set("exchange", id);
    setSearchParams(next);
  }

  function setClient(id: string | "all") {
    const next = new URLSearchParams(searchParams);
    if (id === "all") next.delete("client");
    else next.set("client", id);
    next.delete("exchange");
    setSearchParams(next);
  }

  function openInWorkspace(rel: Relationship) {
    navigate(`/agent/workspace/${rel.buyerExchangeId}?match=${rel.matchId}`);
  }

  // Auto-redirect legacy ?connection=/?match=/?id= deep links straight into Workspace
  useEffect(() => {
    const legacyId = searchParams.get("id") ?? searchParams.get("connection") ?? searchParams.get("match");
    if (!legacyId || rels.length === 0) return;
    const found = rels.find((r) => r.id === legacyId || r.matchId === legacyId || r.connectionId === legacyId);
    if (found) navigate(`/agent/workspace/${found.buyerExchangeId}?match=${found.matchId}`, { replace: true });
  }, [searchParams, rels, navigate]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every active match across your clients — click any row to open it in the Workspace.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/agent/exchanges/new">
            <Plus className="mr-1 h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      <ExchangeContextBar
        selectedExchangeId={exchangeParam}
        selectedClientId={clientParam}
        onChange={setExchange}
        onChangeClient={setClient}
        totalCount={rels.length}
        scopedMatchCount={scopedRels.length}
        rels={rels}
      />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : rels.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="min-h-[60vh]">
          <InboxList
            rels={visibleRels}
            selectedId={null}
            onSelect={openInWorkspace}
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            counts={counts}
            sort={sort}
            onSortChange={setSort}
            filters={filters}
            onFiltersChange={setFilters}
            scopeRels={scopedRels}
            rankMap={rankMap}
            groupByClient={groupByClient && exchangeParam === "all"}
            onGroupByClientChange={exchangeParam === "all" ? setGroupByClient : undefined}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
      <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-base font-semibold text-foreground">No matches yet</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Create a listing and we'll surface matching properties for your client here.
      </p>
      <Button asChild size="sm" className="mt-4">
        <Link to="/agent/exchanges/new">
          <Plus className="mr-1 h-4 w-4" /> New listing
        </Link>
      </Button>
    </div>
  );
}
