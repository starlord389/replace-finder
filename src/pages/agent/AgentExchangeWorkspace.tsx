import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { useWorkspaceExchanges } from "@/features/matches/v2/hooks/useWorkspaceExchanges";
import { ExchangeContextHeader } from "@/features/matches/v2/components/ExchangeContextHeader";
import { ExchangePickerDrawer } from "@/features/matches/v2/components/ExchangePickerDrawer";
import {
  RankedMatchQueue,
  computeVisible,
} from "@/features/matches/v2/components/RankedMatchQueue";

import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import { DealRoomPanel } from "@/features/matches/components/inbox/DealRoomPanel";
import { EMPTY_FILTERS, type MatchFilters } from "@/features/matches/components/inbox/SortFilterBar";
import type { SortKey } from "@/features/matches/components/inbox/inboxHelpers";

export default function AgentExchangeWorkspace() {
  const { isLoading, exchanges, byId, defaultExchangeId } = useWorkspaceExchanges();
  const [searchParams, setSearchParams] = useSearchParams();

  const exchangeIdParam = searchParams.get("exchange");
  const selectedExchangeId = exchangeIdParam ?? defaultExchangeId;
  const selectedExchange = selectedExchangeId ? byId.get(selectedExchangeId) ?? null : null;

  const selectedMatchId = searchParams.get("id");
  const sort = (searchParams.get("sort") as SortKey) || "best_match";

  const [filters, setFilters] = useState<MatchFilters>(EMPTY_FILTERS);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Reset filters when exchange changes
  useEffect(() => {
    setFilters(EMPTY_FILTERS);
  }, [selectedExchangeId]);

  // Hydrate the URL with the default exchange once data lands
  useEffect(() => {
    if (!exchangeIdParam && defaultExchangeId) {
      const next = new URLSearchParams(searchParams);
      next.set("exchange", defaultExchangeId);
      setSearchParams(next, { replace: true });
    }
  }, [exchangeIdParam, defaultExchangeId, searchParams, setSearchParams]);

  const scopeMatches = selectedExchange?.matches ?? [];
  const { visible, rankMap } = useMemo(
    () => computeVisible(scopeMatches, filters, sort),
    [scopeMatches, filters, sort],
  );

  const selectedMatch = useMemo(() => {
    return visible.find((r) => r.id === selectedMatchId) ?? visible[0] ?? null;
  }, [visible, selectedMatchId]);

  // Keep ?id in sync with the actually-shown selection
  useEffect(() => {
    if (!selectedMatch) return;
    if (selectedMatchId === selectedMatch.id) return;
    const next = new URLSearchParams(searchParams);
    next.set("id", selectedMatch.id);
    setSearchParams(next, { replace: true });
  }, [selectedMatch, selectedMatchId, searchParams, setSearchParams]);

  function setExchange(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set("exchange", id);
    next.delete("id");
    setSearchParams(next);
  }

  function setSort(k: SortKey) {
    const next = new URLSearchParams(searchParams);
    if (k === "best_match") next.delete("sort");
    else next.set("sort", k);
    setSearchParams(next);
  }

  function selectMatch(rel: { id: string }) {
    const next = new URLSearchParams(searchParams);
    next.set("id", rel.id);
    setSearchParams(next);
    setMobileDetailOpen(true);
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      {/* Page header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchange Workspace</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One client, one exchange, ranked replacement matches end-to-end.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/agent/matches">Old Matches</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/agent/exchanges/new">
              <Plus className="mr-1 h-4 w-4" /> New exchange
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : exchanges.length === 0 ? (
        <EmptyState />
      ) : !selectedExchange ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Pick an exchange to begin.
        </div>
      ) : (
        <>
          <ExchangeContextHeader
            exchange={selectedExchange}
            onChangeExchange={() => setPickerOpen(true)}
          />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)]">
            {/* LEFT: queue */}
            <div
              className={cn(
                "min-h-0 min-w-0",
                mobileDetailOpen ? "hidden lg:block" : "block",
              )}
            >
              <RankedMatchQueue
                matches={scopeMatches}
                sort={sort}
                onSortChange={setSort}
                filters={filters}
                onFiltersChange={setFilters}
                selectedId={selectedMatch?.id ?? null}
                onSelect={selectMatch}
                visible={visible}
                rankMap={rankMap}
              />
            </div>

            {/* RIGHT: detail */}
            <div
              className={
                mobileDetailOpen
                  ? "flex min-h-0 min-w-0 flex-col gap-2"
                  : "hidden min-h-0 min-w-0 lg:flex lg:flex-col lg:gap-2"
              }
            >
              {selectedMatch ? (
                <>
                  <div className="flex shrink-0 items-center justify-between gap-2 lg:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileDetailOpen(false)}
                    >
                      ← Back to matches
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <PropertyReviewPanel
                      rel={selectedMatch}
                      onOpenActions={() => setActionsOpen(true)}
                      rank={rankMap.get(selectedMatch.id) ?? null}
                      totalInScope={visible.length}
                    />
                  </div>
                </>
              ) : (
                <EmptySelection />
              )}
            </div>
          </div>
        </>
      )}

      {/* Exchange picker */}
      <ExchangePickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        exchanges={exchanges}
        selectedId={selectedExchangeId}
        onSelect={setExchange}
      />

      {/* Actions drawer */}
      <Sheet open={actionsOpen && !!selectedMatch} onOpenChange={setActionsOpen}>
        <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-md">
          {selectedMatch && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Actions & deal room</h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {selectedMatch.propertyName}
                </p>
              </div>
              <div className="min-h-0 flex-1 p-3">
                <DealRoomPanel rel={selectedMatch} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile sticky action bar */}
      {selectedMatch && mobileDetailOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card p-3 shadow-lg lg:hidden">
          <Button className="w-full" onClick={() => setActionsOpen(true)}>
            All actions
          </Button>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
      <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
      <p className="text-base font-semibold text-foreground">No exchanges yet</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Create an exchange and we'll surface ranked replacement matches for your
        client here.
      </p>
      <Button asChild size="sm" className="mt-4">
        <Link to="/agent/exchanges/new">
          <Plus className="mr-1 h-4 w-4" /> New exchange
        </Link>
      </Button>
    </div>
  );
}

function EmptySelection() {
  return (
    <div className="flex w-full items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
      <div>
        <InboxIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">Select a match</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a property from the ranked list to review the deal.
        </p>
      </div>
    </div>
  );
}
