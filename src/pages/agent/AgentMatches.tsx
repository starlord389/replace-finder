import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Handshake, ArrowUpDown, CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS,
  BOOT_STATUS_LABELS, BOOT_STATUS_COLORS,
} from "@/lib/constants";
import type { Enums } from "@/integrations/supabase/types";
import { useAgentMatchesQuery } from "@/features/agent/hooks/useAgentMatchesQuery";
import { MiniCompareBar } from "@/components/match/MiniCompareBar";

// ── Helpers ──────────────────────────────────────────────

function currency(v: number | null) {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function currencyFull(v: number | null) {
  return v ? `$${Number(v).toLocaleString()}` : "—";
}

function ScoreBadge({ score }: { score: number }) {
  const rounded = Math.round(score);
  const color =
    rounded >= 85 ? "bg-green-600" : rounded >= 70 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full ${color} text-sm font-bold text-white shadow-lg`}>
      {rounded}
    </div>
  );
}

function BootIndicator({ status, totalBoot }: { status: string; totalBoot: number | null }) {
  const icons: Record<string, JSX.Element> = {
    no_boot: <CheckCircle2 className="h-3 w-3" />,
    minor_boot: <AlertTriangle className="h-3 w-3" />,
    significant_boot: <ShieldAlert className="h-3 w-3" />,
  };
  const icon = icons[status];
  const label = BOOT_STATUS_LABELS[status] || status;
  if (status === "no_boot") return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700">{icon} No Boot</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
      {icon} {totalBoot ? currency(totalBoot) : label}
    </span>
  );
}

// ── Types ────────────────────────────────────────────────

// ── Main Component ──────────────────────────────────────

export default function AgentMatches() {
  const { user } = useAuth();
  const { data, isLoading } = useAgentMatchesQuery(user?.id);
  const buyerMatches = data?.buyerMatches ?? [];
  const sellerMatches = data?.sellerMatches ?? [];
  const exchangeMap = data?.exchangeMap ?? new Map<string, string>();

  // Filters
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [bootFilter, setBootFilter] = useState("all");
  const [sortBy, setSortBy] = useState("score");

  // ── Filtered & sorted buyer matches ──
  const filteredMatches = useMemo(() => {
    let result = [...buyerMatches];

    if (exchangeFilter !== "all") {
      result = result.filter((m) => m.buyer_exchange_id === exchangeFilter);
    }
    if (scoreFilter === "strong") result = result.filter((m) => Number(m.total_score) >= 85);
    else if (scoreFilter === "good") result = result.filter((m) => Number(m.total_score) >= 70 && Number(m.total_score) < 85);
    else if (scoreFilter === "fair") result = result.filter((m) => Number(m.total_score) >= 65 && Number(m.total_score) < 70);

    if (bootFilter === "no_boot") result = result.filter((m) => m.boot_status === "no_boot");
    else if (bootFilter === "minor") result = result.filter((m) => m.boot_status === "minor_boot");
    else if (bootFilter === "significant") result = result.filter((m) => m.boot_status === "significant_boot");

    if (sortBy === "score") result.sort((a, b) => Number(b.total_score) - Number(a.total_score));
    else if (sortBy === "price_low") result.sort((a, b) => (Number(a.financials?.asking_price || 0)) - (Number(b.financials?.asking_price || 0)));
    else if (sortBy === "price_high") result.sort((a, b) => (Number(b.financials?.asking_price || 0)) - (Number(a.financials?.asking_price || 0)));
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [buyerMatches, exchangeFilter, scoreFilter, bootFilter, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const totalCount = buyerMatches.length + sellerMatches.length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Matches</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {totalCount > 0
          ? `${totalCount} match${totalCount !== 1 ? "es" : ""} found across your exchanges`
          : "No matches yet"}
      </p>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border bg-card py-20 text-center">
          <Handshake className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="max-w-md text-sm text-muted-foreground">
            No matches yet. Once you activate an exchange, the system will automatically find matching properties.
          </p>
        </div>
      )}

      {/* Buyer-side matches */}
      {buyerMatches.length > 0 && (
        <>
          {/* Filters */}
          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-3">
            <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All exchanges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All exchanges</SelectItem>
                {[...exchangeMap.entries()].map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}'s exchange</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scores</SelectItem>
                <SelectItem value="strong">Strong (85+)</SelectItem>
                <SelectItem value="good">Good (70-84)</SelectItem>
                <SelectItem value="fair">Fair (65-69)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={bootFilter} onValueChange={setBootFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All boot status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All boot status</SelectItem>
                <SelectItem value="no_boot">No Boot</SelectItem>
                <SelectItem value="minor">Minor Boot</SelectItem>
                <SelectItem value="significant">Significant Boot</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Match Score</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Match cards */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match) => {
              const prop = match.property;
              const fin = match.financials;
              if (!prop) return null;

              return (
                <Link
                  key={match.id}
                  to={`/agent/matches/${match.id}`}
                  className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  {/* Photo */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {match.coverUrl ? (
                      <img
                        src={match.coverUrl}
                        alt={prop.property_name || "Property"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                        <Building2 className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}

                    <ScoreBadge score={Number(match.total_score)} />

                    {/* New badge */}
                    {!match.buyer_agent_viewed && (
                      <div className="absolute left-2 top-2">
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">New</Badge>
                      </div>
                    )}

                    {/* Boot status */}
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5">
                      <BootIndicator status={match.boot_status} totalBoot={match.estimated_total_boot} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-xl font-bold text-foreground">
                      {fin?.asking_price ? currencyFull(Number(fin.asking_price)) : "Price TBD"}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2 text-sm text-muted-foreground">
                      {fin?.cap_rate && <span>{Number(fin.cap_rate).toFixed(1)}% cap</span>}
                      {fin?.cap_rate && fin?.noi && <span className="text-border">·</span>}
                      {fin?.noi && <span>{currency(Number(fin.noi))} NOI</span>}
                      {(fin?.cap_rate || fin?.noi) && (prop.units || prop.building_square_footage) && <span className="text-border">·</span>}
                      {prop.units ? <span>{prop.units} units</span> : prop.building_square_footage ? <span>{Number(prop.building_square_footage).toLocaleString()} SF</span> : null}
                      {(prop.units || prop.building_square_footage) && prop.year_built && <span className="text-border">·</span>}
                      {prop.year_built && <span>Built {prop.year_built}</span>}
                    </div>

                    <p className="mt-2 font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {prop.property_name || prop.address || "Property"}
                    </p>

                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      {[prop.city, prop.state].filter(Boolean).join(", ") || "—"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {prop.asset_type && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {ASSET_TYPE_LABELS[prop.asset_type as Enums<"asset_type">]}
                        </span>
                      )}
                      {prop.strategy_type && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                          {STRATEGY_TYPE_LABELS[prop.strategy_type as Enums<"strategy_type">]}
                        </span>
                      )}
                    </div>

                    {match.relinquished && (
                      <div className="mt-3 rounded-lg border bg-muted/30 p-2.5">
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">vs your property</p>
                        <MiniCompareBar
                          bars={[
                            { label: "Price", yours: match.relinquished.price, theirs: fin?.asking_price ? Number(fin.asking_price) : null, format: "money", upIs: "neutral" },
                            { label: "NOI", yours: match.relinquished.noi, theirs: fin?.noi ? Number(fin.noi) : null, format: "money", upIs: "favorable" },
                            { label: "Cap", yours: match.relinquished.capRate, theirs: fin?.cap_rate ? Number(fin.cap_rate) : null, format: "pct", upIs: "favorable" },
                          ]}
                        />
                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-muted-foreground">
                      For: {match.clientName}'s exchange
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredMatches.length === 0 && buyerMatches.length > 0 && (
            <div className="mt-6 rounded-xl border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">No matches match your current filters.</p>
            </div>
          )}
        </>
      )}

      {/* Seller-side matches */}
      {sellerMatches.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Your Properties Matched to Other Exchanges</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Other agents' exchanges have been matched to your listings. They can initiate a connection.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sellerMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-xl border bg-card p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {(match as any).sellerPropertyName || "Your property"}
                  </p>
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${Number(match.total_score) >= 85 ? "bg-green-600" : Number(match.total_score) >= 70 ? "bg-amber-500" : "bg-red-500"}`}>
                    {Math.round(Number(match.total_score))}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Matched to an exchange — the buyer agent can initiate a connection.
                </p>
                <Badge className={`mt-2 ${BOOT_STATUS_COLORS[match.boot_status] || "bg-muted text-muted-foreground"}`}>
                  {BOOT_STATUS_LABELS[match.boot_status] || match.boot_status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
