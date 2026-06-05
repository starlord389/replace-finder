import { useMemo, useState } from "react";
import { Inbox as InboxIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { InboxList } from "@/features/matches/components/inbox/InboxList";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import { DealRoomPanel } from "@/features/matches/components/inbox/DealRoomPanel";
import {
  deriveUiStatus,
  sortRelationships,
  type SortKey,
  type UiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
import { EMPTY_FILTERS, type MatchFilters } from "@/features/matches/components/inbox/SortFilterBar";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";
import { cn } from "@/lib/utils";

interface Props {
  clientId: string;
}

export function ClientMatchesTab({ clientId }: Props) {
  const { data: allRels = [], isLoading } = useUnifiedRelationships();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | UiStatus>("all");
  const [sort, setSort] = useState<SortKey>("best_match");
  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  // Pre-scope to this client
  const scopedRels = useMemo(
    () => allRels.filter((r) => r.clientId === clientId),
    [allRels, clientId],
  );

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
    return visibleRels.find((r) => r.id === selectedId) ?? visibleRels[0] ?? null;
  }, [visibleRels, selectedId]);

  function select(rel: Relationship) {
    setSelectedId(rel.id);
    setMobileDetailOpen(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (scopedRels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
        <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">No matches yet</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Once this client has an active exchange, matching properties will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid min-h-[60vh] grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
      <div
        className={cn(
          "min-h-0 min-w-0",
          mobileDetailOpen ? "hidden lg:block" : "block",
        )}
      >
        <InboxList
          rels={visibleRels}
          selectedId={selected?.id ?? null}
          onSelect={select}
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
                onOpenActions={() => setActionsOpen(true)}
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

      <Sheet open={actionsOpen && !!selected} onOpenChange={setActionsOpen}>
        <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-md">
          {selected && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Actions & deal room</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {selected.propertyName}
                </p>
              </div>
              <div className="min-h-0 flex-1 p-3">
                <DealRoomPanel rel={selected} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
