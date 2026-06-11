import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import { deriveUiStatus, type UiStatus } from "@/features/matches/components/inbox/inboxHelpers";
import { readMatchLocalState } from "@/features/matches/components/inbox/useMatchLocalState";
import { PipelineListingCard } from "./PipelineListingCard";

type StageKey = "new" | "interested" | "connected" | "closed";

const STAGE_DEFS: Array<{ key: StageKey; title: string; subtitle: string }> = [
  { key: "new", title: "New", subtitle: "Fresh matches to triage" },
  { key: "interested", title: "Interested", subtitle: "Client engaged" },
  { key: "connected", title: "Connected", subtitle: "Agents working it" },
  { key: "closed", title: "Closed", subtitle: "Won or archived" },
];

const STAGE_RANK: Record<StageKey, number> = { new: 0, interested: 1, connected: 2, closed: 3 };

function uiStatusToStage(s: UiStatus): StageKey {
  if (s === "closed" || s === "archived") return "closed";
  if (s === "in_conversation" || s === "loi" || s === "under_contract")
    return "connected";
  if (s === "client_interested" || s === "sent_to_client") return "interested";
  return "new";
}

interface ListingBucket {
  listing: AgentListing;
  stage: StageKey;
  matchCount: number;
  lastActivityAt: string | null;
}

export function PipelineKanban({
  listings,
  relationships,
}: {
  listings: AgentListing[];
  relationships: Relationship[];
}) {
  const buckets = useMemo<ListingBucket[]>(() => {
    const relsByExchange = new Map<string, Relationship[]>();
    for (const r of relationships) {
      const arr = relsByExchange.get(r.buyerExchangeId) ?? [];
      arr.push(r);
      relsByExchange.set(r.buyerExchangeId, arr);
    }

    return listings.map((l) => {
      const rels = relsByExchange.get(l.id) ?? [];
      let stage: StageKey = "new";
      let lastActivityAt: string | null = null;
      if (l.status === "closed" || l.status === "completed") stage = "closed";

      for (const r of rels) {
        const s = uiStatusToStage(deriveUiStatus(r, readMatchLocalState(r.matchId)));
        if (STAGE_RANK[s] > STAGE_RANK[stage]) stage = s;
        if (!lastActivityAt || r.lastActivityAt > lastActivityAt) lastActivityAt = r.lastActivityAt;
      }

      return { listing: l, stage, matchCount: rels.length, lastActivityAt };
    });
  }, [listings, relationships]);

  const columns = useMemo(() => {
    const grouped: Record<StageKey, ListingBucket[]> = {
      new: [],
      interested: [],
      connected: [],
      closed: [],
    };
    for (const b of buckets) grouped[b.stage].push(b);
    for (const k of Object.keys(grouped) as StageKey[]) {
      grouped[k].sort((a, b) => {
        const at = a.lastActivityAt ?? a.listing.createdAt;
        const bt = b.lastActivityAt ?? b.listing.createdAt;
        return bt.localeCompare(at);
      });
    }
    return grouped;
  }, [buckets]);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {STAGE_DEFS.map((col) => {
        const items = columns[col.key];
        return (
          <div
            key={col.key}
            className="flex min-h-[200px] flex-col rounded-xl border bg-muted/30 p-3"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
                <p className="text-[11px] text-muted-foreground">{col.subtitle}</p>
              </div>
              <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
              {items.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-card/50 p-4 text-center">
                  <p className="text-[11px] text-muted-foreground">No listings here</p>
                </div>
              ) : (
                items.map((b) => {
                  const title =
                    b.listing.propertyName ||
                    b.listing.address ||
                    (b.listing.status === "draft" ? "Draft listing" : "Untitled");
                  const loc = [b.listing.city, b.listing.state].filter(Boolean).join(", ") || null;
                  return (
                    <PipelineListingCard
                      key={b.listing.id}
                      exchangeId={b.listing.id}
                      clientId={b.listing.clientId}
                      clientName={b.listing.clientName}
                      propertyTitle={title}
                      location={loc}
                      matchCount={b.matchCount}
                      lastActivityAt={b.lastActivityAt}
                      stageLabel={col.title}
                    />
                  );
                })
              )}
            </div>
            {col.key === "new" && items.length === 0 && (
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link to="/agent/exchanges/new">
                  <Plus className="mr-1 h-3.5 w-3.5" /> New listing
                </Link>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
