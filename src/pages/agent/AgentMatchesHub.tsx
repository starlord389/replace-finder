import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { InboxList } from "@/features/matches/components/inbox/InboxList";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";
import { DealRoomPanel } from "@/features/matches/components/inbox/DealRoomPanel";
import {
  deriveUiStatus,
  type UiStatus,
} from "@/features/matches/components/inbox/inboxHelpers";
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

export default function AgentMatchesHub() {
  const { data: rels = [], isLoading } = useUnifiedRelationships();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [tabletActionOpen, setTabletActionOpen] = useState(false);

  const rawFilter = searchParams.get("filter") ?? searchParams.get("stage") ?? "all";
  const filter = (LEGACY_FILTER_MAP[rawFilter] ?? (rawFilter as UiStatus | "all")) as "all" | UiStatus;
  const selectedId = searchParams.get("id");

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

  // Annotate each rel with its UI status (computed from rel + localStorage)
  const annotated = useMemo(
    () =>
      rels.map((r) => ({
        rel: r,
        status: deriveUiStatus(r, readMatchLocalState(r.matchId)),
      })),
    [rels],
  );

  // Counts by filter (ignoring search)
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

  // Apply filter + search
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

  const selected = rels.find((r) => r.id === selectedId) ?? visibleRels[0] ?? null;

  function setFilter(f: "all" | UiStatus) {
    const next = new URLSearchParams(searchParams);
    if (f === "all") next.delete("filter");
    else next.set("filter", f);
    next.delete("stage");
    setSearchParams(next);
  }

  function select(rel: Relationship) {
    const next = new URLSearchParams(searchParams);
    next.set("id", rel.id);
    setSearchParams(next);
    setMobileDetailOpen(true);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-0 flex-col gap-4 overflow-hidden">
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

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : rels.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[360px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)_360px]">
          {/* LEFT: Inbox */}
          <div
            className={
              mobileDetailOpen
                ? "hidden md:flex md:min-h-0 md:min-w-0"
                : "flex min-h-0 min-w-0"
            }
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
            />
          </div>

          {/* CENTER: Property review */}
          <div
            className={
              mobileDetailOpen
                ? "flex min-h-0 min-w-0 flex-col gap-3"
                : "hidden md:flex md:min-h-0 md:min-w-0 md:flex-col md:gap-3"
            }
          >
            {selected ? (
              <>
                <div className="flex shrink-0 items-center justify-between gap-2 md:hidden">
                  <Button variant="ghost" size="sm" onClick={() => setMobileDetailOpen(false)}>
                    ← Back to inbox
                  </Button>
                  <Button size="sm" onClick={() => setTabletActionOpen(true)}>
                    Take action
                  </Button>
                </div>
                {/* md-only (768–1023): Deal Room is hidden, so expose drawer trigger */}
                <div className="hidden shrink-0 items-center justify-end md:flex lg:hidden">
                  <Button size="sm" onClick={() => setTabletActionOpen(true)}>
                    Take action
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  <PropertyReviewPanel rel={selected} />
                </div>
              </>
            ) : (
              <EmptySelection />
            )}
          </div>

          {/* RIGHT: Deal Room (lg+) */}
          <div className="hidden min-h-0 min-w-0 lg:flex">
            {selected ? <DealRoomPanel rel={selected} /> : null}
          </div>
        </div>
      )}

      {/* Tablet / Mobile Deal Room drawer */}
      <Sheet open={tabletActionOpen && !!selected} onOpenChange={setTabletActionOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-4 sm:max-w-md">
          {selected && <DealRoomPanel rel={selected} />}
        </SheetContent>
      </Sheet>

      {/* Mobile sticky action bar */}
      {selected && mobileDetailOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card p-3 shadow-lg md:hidden">
          <Button className="w-full" onClick={() => setTabletActionOpen(true)}>
            Take action
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
