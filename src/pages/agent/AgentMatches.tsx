import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  useUnifiedRelationships,
  type Relationship,
} from "@/features/matches/hooks/useUnifiedRelationships";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import {
  InboxList,
  type InboxClientGroup,
} from "@/features/matches/components/inbox/InboxList";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import {
  deriveUiStatus,
  sortRelationships,
  type SortKey,
  type UiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
import {
  EMPTY_FILTERS,
  type MatchFilters,
} from "@/features/matches/components/inbox/SortFilterBar";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";

export default function AgentMatches() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: allRels = [], isLoading } = useUnifiedRelationships();
  const { data: agentListings = [] } = useAgentListings(user?.id);

  // Buyer-side rels = matches against the agent's own listings.
  const buyerRels = useMemo(
    () => allRels.filter((r) => r.mySide === "buyer"),
    [allRels],
  );

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

  // Scope: "all" by default; can narrow to a client (all properties) via the toolbar.
  const scopeClientId = searchParams.get("client"); // null = all clients
  const activeClient = useMemo(
    () => clientGroups.find((c) => (c.clientId ?? "") === (scopeClientId ?? "__skip")) ?? null,
    [clientGroups, scopeClientId],
  );

  const listingFilterId = searchParams.get("listing");
  const listingFilterName = useMemo(() => {
    if (!listingFilterId) return null;
    const l = agentListings.find((x) => x.id === listingFilterId);
    if (!l) return null;
    return (
      l.propertyName ||
      l.address ||
      [l.city, l.state].filter(Boolean).join(", ") ||
      "this listing"
    );
  }, [agentListings, listingFilterId]);

  const scopedRels = useMemo(() => {
    let rels = buyerRels;
    if (scopeClientId) rels = rels.filter((r) => r.clientId === scopeClientId);
    if (listingFilterId) rels = rels.filter((r) => r.propertyId === listingFilterId);
    return rels;
  }, [buyerRels, scopeClientId, listingFilterId]);

  // Filter / sort / search state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | UiStatus>("all");
  const [sort, setSort] = useState<SortKey>("best_match");
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [groupByClient, setGroupByClient] = useState(true);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const selectedMatchId = searchParams.get("match");

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
      in_conversation: 0,
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
          (r.counterpartyName ?? "").toLowerCase().includes(q) ||
          (r.clientName ?? "").toLowerCase().includes(q)
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
      const inScope = scopedRels.find(
        (r) => r.matchId === selectedMatchId || r.id === selectedMatchId,
      );
      if (inScope) return inScope;
    }
    return visibleRels[0] ?? null;
  }, [visibleRels, scopedRels, selectedMatchId]);

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

  function setScopeClient(clientId: string | null) {
    const next = new URLSearchParams(searchParams);
    if (clientId) next.set("client", clientId);
    else next.delete("client");
    next.delete("match");
    setSearchParams(next);
  }

  const listingsTouched = useMemo(
    () => new Set(buyerRels.map((r) => r.buyerExchangeId)).size,
    [buyerRels],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3">
      {/* Global header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {activeClient ? `${activeClient.clientName} · Matches` : "All matches"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {activeClient
              ? `${scopedRels.length} match${scopedRels.length === 1 ? "" : "es"} across ${activeClient.listings.length} listing${activeClient.listings.length === 1 ? "" : "s"}`
              : `${buyerRels.length} match${buyerRels.length === 1 ? "" : "es"} across ${listingsTouched} listing${listingsTouched === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {listingFilterId && listingFilterName && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <p className="text-xs text-foreground">
            Showing matches for{" "}
            <span className="font-semibold">{listingFilterName}</span>
          </p>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete("listing");
              next.delete("match");
              setSearchParams(next);
            }}
          >
            Clear
          </Button>
        </div>
      )}

      {buyerRels.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
          <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-base font-semibold text-foreground">No matches yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Matches will appear here as soon as your listings start receiving them.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4">
            <Link to="/agent/listings">Go to listings</Link>
          </Button>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
          <div
            className={
              mobileDetailOpen ? "hidden lg:block min-h-0 min-w-0" : "block min-h-0 min-w-0"
            }
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
              scopeRels={scopedRels}
              rankMap={rankMap}
              groupByClient={groupByClient && !activeClient}
              onGroupByClientChange={activeClient ? undefined : setGroupByClient}
              clients={clientGroups}
              activeClientId={activeClient?.clientId ?? null}
              activeExchangeId={undefined}
              allClientsActive={!activeClient}
              allPropertiesActive={!!activeClient}
              onSelectExchange={(id) => navigate(`/agent/workspace/${id}`)}
              onSelectAllClients={() => setScopeClient(null)}
              onSelectAllPropertiesForClient={(clientId) => setScopeClient(clientId)}
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
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileDetailOpen(false)}
                    className="lg:hidden"
                  >
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
