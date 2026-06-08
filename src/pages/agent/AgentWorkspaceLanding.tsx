import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Briefcase, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { ListingSwitcher } from "@/features/workspace/components/ListingSwitcher";
import { useUnifiedRelationships, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { PropertyMatchCard } from "@/features/matches/components/inbox/PropertyMatchCard";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { cn } from "@/lib/utils";

export default function AgentWorkspaceLanding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") as "matches" | "listings") || "matches";

  const { data: listings = [], isLoading: listingsLoading } = useAgentListings(user?.id);
  const { data: rels = [], isLoading: relsLoading } = useUnifiedRelationships();

  // Only buyer-side matches (these belong to the agent's own listings/clients)
  const buyerRels = useMemo(
    () => rels.filter((r) => r.mySide === "buyer"),
    [rels],
  );

  // Group by client → listing for an intuitive view
  const grouped = useMemo(() => {
    const byClient = new Map<
      string,
      {
        clientId: string | null;
        clientName: string;
        listings: Map<
          string,
          { exchangeId: string; propertyLabel: string; items: Relationship[] }
        >;
      }
    >();
    for (const r of buyerRels) {
      const ckey = r.clientId ?? "__unassigned";
      if (!byClient.has(ckey)) {
        byClient.set(ckey, {
          clientId: r.clientId,
          clientName: r.clientName ?? "Client",
          listings: new Map(),
        });
      }
      const c = byClient.get(ckey)!;
      if (!c.listings.has(r.buyerExchangeId)) {
        c.listings.set(r.buyerExchangeId, {
          exchangeId: r.buyerExchangeId,
          propertyLabel: r.relinquishedLabel ?? "Listing",
          items: [],
        });
      }
      c.listings.get(r.buyerExchangeId)!.items.push(r);
    }
    // Sort each listing's items by score desc
    const out = Array.from(byClient.values()).map((c) => ({
      ...c,
      listings: Array.from(c.listings.values()).map((l) => ({
        ...l,
        items: [...l.items].sort((a, b) => b.score - a.score),
      })),
    }));
    out.sort((a, b) => a.clientName.localeCompare(b.clientName));
    return out;
  }, [buyerRels]);

  function setTab(next: "matches" | "listings") {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  function openMatch(r: Relationship) {
    navigate(`/agent/workspace/${r.buyerExchangeId}?match=${r.matchId}`);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workspace</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Review matches and manage your listings.
          </p>
        </div>
        {tab === "listings" && (
          <Button asChild size="sm">
            <Link to="/agent/exchanges/new">
              <Plus className="mr-1 h-4 w-4" /> New listing
            </Link>
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "matches" | "listings")}>
        <TabsList>
          <TabsTrigger value="matches">
            Matches
            {buyerRels.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">{buyerRels.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="listings">
            Listings
            {listings.length > 0 && (
              <span className="ml-1.5 text-[10px] opacity-70">{listings.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="mt-4">
          {relsLoading ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : buyerRels.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
              <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground">No matches yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Matches will appear here as soon as your listings start receiving them.
              </p>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setTab("listings")}>
                Go to listings
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((c) => {
                const accent = getClientAccent(c.clientId);
                const total = c.listings.reduce((acc, l) => acc + l.items.length, 0);
                return (
                  <section key={c.clientId ?? c.clientName}>
                    <div
                      className={cn(
                        "mb-2 flex items-center gap-2 rounded-lg border border-l-[4px] bg-card px-3 py-2",
                        accent.borderLeft,
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full", accent.dot)} />
                      <span className="text-sm font-semibold text-foreground">{c.clientName}</span>
                      <span className="text-[11px] text-muted-foreground">
                        · {total} match{total === 1 ? "" : "es"}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {c.listings.map((l) => (
                        <div key={l.exchangeId}>
                          <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
                            <Link
                              to={`/agent/workspace/${l.exchangeId}`}
                              className="truncate text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                              {l.propertyLabel}
                            </Link>
                            <span className="text-[10px] text-muted-foreground">
                              {l.items.length} match{l.items.length === 1 ? "" : "es"}
                            </span>
                          </div>
                          <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                            {l.items.map((r) => (
                              <li key={r.id}>
                                <PropertyMatchCard
                                  rel={r}
                                  selected={false}
                                  onSelect={() => openMatch(r)}
                                  hideClientLead
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          {listingsLoading ? (
            <div className="flex flex-1 items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
              <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-base font-semibold text-foreground">No listings yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create a listing and your workspace will fill up with matching properties to work.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/agent/exchanges/new">
                  <Plus className="mr-1 h-4 w-4" /> New listing
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl">
              <ListingSwitcher listings={listings} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
