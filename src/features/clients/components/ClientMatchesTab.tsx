import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useUnifiedRelationships,
  type Relationship,
} from "@/features/matches/hooks/useUnifiedRelationships";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { PropertyMatchCard } from "@/features/matches/components/inbox/PropertyMatchCard";
import { PropertyReviewPanel } from "@/features/matches/components/inbox/PropertyReviewPanel";

interface Props {
  clientId: string;
}

export function ClientMatchesTab({ clientId }: Props) {
  const { user } = useAuth();
  // Same canonical, workspace-aware (Live/Demo) source the main Matches tab uses.
  const { data: allRels = [], isLoading } = useUnifiedRelationships();
  const { data: agentListings = [] } = useAgentListings(user?.id);
  // null = all listings; otherwise a buyer exchange (listing) id.
  const [listingFilter, setListingFilter] = useState<string | null>(null);
  // The match opened in the review popup (by matchId, so it stays fresh across refetches).
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // This client's buyer-side matches (replacement properties for their listings).
  const rels = useMemo(
    () => allRels.filter((r) => r.mySide === "buyer" && r.clientId === clientId),
    [allRels, clientId],
  );

  // Listing (exchange) id -> human label, for grouping + filter pills.
  const listingLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of agentListings) {
      if (l.clientId !== clientId) continue;
      m.set(
        l.id,
        l.propertyName ||
          l.address ||
          [l.city, l.state].filter(Boolean).join(", ") ||
          "Untitled listing",
      );
    }
    return m;
  }, [agentListings, clientId]);

  const labelFor = (exchangeId: string, fallback: string | null) =>
    listingLabel.get(exchangeId) ?? fallback ?? "This listing";

  // Listings that actually have matches, with counts (drives the filter pills).
  const listingFacets = useMemo(() => {
    const counts = new Map<string, { count: number; fallback: string | null }>();
    for (const r of rels) {
      const cur = counts.get(r.buyerExchangeId);
      if (cur) cur.count++;
      else counts.set(r.buyerExchangeId, { count: 1, fallback: r.relinquishedLabel });
    }
    return Array.from(counts.entries())
      .map(([exchangeId, { count, fallback }]) => ({
        exchangeId,
        count,
        label: labelFor(exchangeId, fallback),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [rels, listingLabel]);

  const filtered = useMemo(
    () => (listingFilter ? rels.filter((r) => r.buyerExchangeId === listingFilter) : rels),
    [rels, listingFilter],
  );

  // Rank by score across the client's matches (shown in the match detail header).
  const rankByMatchId = useMemo(() => {
    const m = new Map<string, number>();
    [...rels]
      .sort((a, b) => b.score - a.score)
      .forEach((r, i) => m.set(r.matchId, i + 1));
    return m;
  }, [rels]);

  // Group matches by the client's listing so it's obvious which match belongs where.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { exchangeId: string; label: string; items: Relationship[] }
    >();
    for (const r of filtered) {
      let g = map.get(r.buyerExchangeId);
      if (!g) {
        g = {
          exchangeId: r.buyerExchangeId,
          label: labelFor(r.buyerExchangeId, r.relinquishedLabel),
          items: [],
        };
        map.set(r.buyerExchangeId, g);
      }
      g.items.push(r);
    }
    for (const g of map.values()) g.items.sort((a, b) => b.score - a.score);
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered, listingLabel]);

  // Keep the open popup pointed at the freshest rel (actions invalidate the query).
  const selectedRel = useMemo(
    () => (selectedMatchId ? rels.find((r) => r.matchId === selectedMatchId) ?? null : null),
    [rels, selectedMatchId],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (rels.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No matches yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Matched replacement properties for this client's listings will show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter by listing — intuitively narrow to one of this client's listings. */}
      {listingFacets.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill active={!listingFilter} onClick={() => setListingFilter(null)} count={rels.length}>
            All listings
          </FilterPill>
          {listingFacets.map((f) => (
            <FilterPill
              key={f.exchangeId}
              active={listingFilter === f.exchangeId}
              onClick={() => setListingFilter(f.exchangeId)}
              count={f.count}
            >
              {f.label}
            </FilterPill>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.exchangeId} className="space-y-2">
            <header className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
              <div className="flex min-w-0 items-center gap-2">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <h3 className="truncate text-sm font-semibold text-foreground">{g.label}</h3>
                <span className="shrink-0 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {g.items.length} {g.items.length === 1 ? "match" : "matches"}
                </span>
              </div>
              <Link
                to={`/agent/matches?client=${clientId}&listing=${g.exchangeId}`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Open in Matches →
              </Link>
            </header>

            <ul className="space-y-2">
              {g.items.map((r) => (
                <li key={r.id}>
                  <PropertyMatchCard
                    rel={r}
                    selected={selectedMatchId === r.matchId}
                    onSelect={() => setSelectedMatchId(r.matchId)}
                    hideClientLead
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Full match workspace in a popup — same review panel + actions as the Matches tab. */}
      <Dialog open={!!selectedRel} onOpenChange={(o) => !o && setSelectedMatchId(null)}>
        <DialogContent className="max-w-6xl gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">
            {selectedRel?.propertyName ?? "Match"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review this matched property and take action.
          </DialogDescription>
          {selectedRel && (
            <div className="max-h-[88vh] overflow-y-auto p-3 sm:p-4">
              <PropertyReviewPanel
                rel={selectedRel}
                rank={rankByMatchId.get(selectedRel.matchId) ?? null}
                totalInScope={rels.length}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      <span className="max-w-[160px] truncate">{children}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px] font-semibold",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
