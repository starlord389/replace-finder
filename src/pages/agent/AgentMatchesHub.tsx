import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { InboxList } from "@/features/matches/components/inbox/InboxList";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import { DealRoomPanel } from "@/features/matches/components/inbox/DealRoomPanel";
import { ExchangeContextBar } from "@/features/matches/components/inbox/ExchangeContextBar";
import {
  deriveUiStatus,
  type UiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";
import { cn } from "@/lib/utils";

// Legacy stage param → new UI filter
const LEGACY_FILTER_MAP: Record<string, "all" | UiStatus> = {
  live: "all",
  all: "all",
  new: "new",
  pending: "client_interested",
  active: "agent_connected",
  closed: "closed",
};

export default function AgentMatchesHub() {
  const { data: rels = [], isLoading } = useUnifiedRelationships();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const rawFilter = searchParams.get("filter") ?? searchParams.get("stage") ?? "all";
  const filter = (LEGACY_FILTER_MAP[rawFilter] ?? (rawFilter as UiStatus | "all")) as "all" | UiStatus;
  const selectedId = searchParams.get("id");
  const exchangeParam = (searchParams.get("exchange") ?? "all") as string | "all";

  // Translate legacy ?connection=/ ?match= → ?id=
  useEffect(() => {
    const legacy = searchParams.get("connection") ?? searchParams.get("match");
    if (legacy) {
      const next = new URLSearchParams(searchParams);
      next.delete("connection");
      next.delete("match");
      next.set("id", legacy);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Scope by exchange first
  const exchangeScopedRels = useMemo(() => {
    if (exchangeParam === "all") return rels;
    return rels.filter((r) => r.buyerExchangeId === exchangeParam);
  }, [rels, exchangeParam]);

  // Annotate each rel with its UI status
  const annotated = useMemo(
    () =>
      exchangeScopedRels.map((r) => ({
        rel: r,
        status: deriveUiStatus(r, readMatchLocalState(r.matchId)),
      })),
    [exchangeScopedRels],
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
    return annotated
      .filter((a) => (filter === "all" ? true : a.status === filter))
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
  }, [annotated, filter, search]);

  const selected = useMemo(() => {
    return visibleRels.find((r) => r.id === selectedId) ?? visibleRels[0] ?? null;
  }, [visibleRels, selectedId]);

  function setFilter(f: "all" | UiStatus) {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    next.delete("stage");
    setSearchParams(next);
  }

  function setExchange(id: string | "all") {
    const next = new URLSearchParams(searchParams);
    if (id === "all") next.delete("exchange");
    else next.set("exchange", id);
    next.delete("id"); // reset selection when scope changes
    setSearchParams(next);
  }

  function select(rel: Relationship) {
    const next = new URLSearchParams(searchParams);
    next.set("id", rel.id);
    setSearchParams(next);
    setMobileDetailOpen(true);
  }

  const showClientLabel = exchangeParam === "all";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matches</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review, share with clients, and move deals forward.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/agent/exchanges/new">
            <Plus className="mr-1 h-4 w-4" /> New exchange
          </Link>
        </Button>
      </div>

      {/* Context bar */}
      <ExchangeContextBar
        selectedExchangeId={exchangeParam}
        onChange={setExchange}
        totalCount={rels.length}
      />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : rels.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
          {/* LEFT: Inbox */}
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
              showClientLabel={showClientLabel}
            />
          </div>

          {/* RIGHT: Property review (dominant) */}
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
                  />
                </div>
              </>
            ) : (
              <EmptySelection />
            )}
          </div>
        </div>
      )}

      {/* Actions drawer (right side) */}
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

      {/* Mobile sticky action bar */}
      {selected && mobileDetailOpen && (
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
      <p className="text-base font-semibold text-foreground">No matches yet</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Create an exchange and we'll surface matching properties for your client here.
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
          Pick a property from the inbox to review the deal.
        </p>
      </div>
    </div>
  );
}
