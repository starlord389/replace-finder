import { useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { PipelineKanban } from "@/features/pipeline/components/PipelineKanban";
import { PipelineSummaryBar } from "@/features/pipeline/components/PipelineSummaryBar";
import { PipelineToolbar } from "@/features/pipeline/components/PipelineToolbar";
import {
  applyFilters,
  buildListingMeta,
  DEFAULT_FILTERS,
  sortListings,
  type PipelineFilters,
  type SortKey,
} from "@/features/pipeline/lib/pipelineFilters";

const SORT_KEYS: SortKey[] = ["activity", "value", "score"];

function parseFiltersFromParams(sp: URLSearchParams): PipelineFilters {
  const sortParam = sp.get("sort");
  const sort: SortKey =
    sortParam && SORT_KEYS.includes(sortParam as SortKey)
      ? (sortParam as SortKey)
      : "activity";
  return {
    search: sp.get("q") ?? "",
    clientIds: sp.get("clients")?.split(",").filter(Boolean) ?? [],
    assetTypes: sp.get("assets")?.split(",").filter(Boolean) ?? [],
    sort,
  };
}

function writeFiltersToParams(
  base: URLSearchParams,
  filters: PipelineFilters,
): URLSearchParams {
  const next = new URLSearchParams(base);
  filters.search ? next.set("q", filters.search) : next.delete("q");
  filters.clientIds.length
    ? next.set("clients", filters.clientIds.join(","))
    : next.delete("clients");
  filters.assetTypes.length
    ? next.set("assets", filters.assetTypes.join(","))
    : next.delete("assets");
  filters.sort !== "activity" ? next.set("sort", filters.sort) : next.delete("sort");
  return next;
}

export default function AgentPipeline() {
  const { user } = useAuth();
  const { data: rels = [], isLoading: relsLoading } = useUnifiedRelationships();
  const { data: listings = [], isLoading: listingsLoading } = useAgentListings(user?.id);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auto-redirect legacy ?match=/?connection=/?id= deep links straight into Workspace
  useEffect(() => {
    const legacyId =
      searchParams.get("id") ??
      searchParams.get("connection") ??
      searchParams.get("match");
    if (!legacyId || rels.length === 0) return;
    const found = rels.find(
      (r) => r.id === legacyId || r.matchId === legacyId || r.connectionId === legacyId,
    );
    if (found)
      navigate(`/agent/matches?listing=${found.buyerExchangeId}&match=${found.matchId}`, {
        replace: true,
      });
  }, [searchParams, rels, navigate]);

  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);
  const setFilters = (next: PipelineFilters) => {
    setSearchParams(writeFiltersToParams(searchParams, next), { replace: true });
  };

  const allMeta = useMemo(() => buildListingMeta(listings, rels), [listings, rels]);

  // Summary metrics — computed from all listings (ignore filters).
  const summary = useMemo(() => {
    const totalListings = allMeta.length;
    const totalValue = allMeta.reduce((s, m) => s + (m.listing.askingPrice ?? 0), 0);
    let bestScore: number | null = null;
    let activeMatches = 0;
    for (const m of allMeta) {
      if (m.stage !== "closed") activeMatches += m.matchCount;
      if (m.bestScore !== null && (bestScore === null || m.bestScore > bestScore)) {
        bestScore = m.bestScore;
      }
    }
    return { totalListings, totalValue, bestScore, activeMatches };
  }, [allMeta]);

  const filtered = useMemo(() => applyFilters(allMeta, filters), [allMeta, filters]);
  const sorted = useMemo(() => sortListings(filtered, filters.sort), [filtered, filters.sort]);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of allMeta) {
      if (m.listing.clientId && m.listing.clientName) {
        map.set(m.listing.clientId, m.listing.clientName);
      }
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [allMeta]);

  const assetOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of allMeta) {
      if (m.listing.assetType) set.add(m.listing.assetType);
    }
    return Array.from(set).sort();
  }, [allMeta]);

  const isLoading = relsLoading || listingsLoading;
  const hasFilters =
    filters.search.trim() !== "" ||
    filters.clientIds.length > 0 ||
    filters.assetTypes.length > 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Every listing across every stage. Drag cards between columns to override the stage.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/agent/exchanges/new">
            <Plus className="mr-1 h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
          <InboxIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-base font-semibold text-foreground">No listings yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Create a listing and we&apos;ll start tracking it through the stages here.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/agent/exchanges/new">
              <Plus className="mr-1 h-4 w-4" /> New listing
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <PipelineSummaryBar
            totalListings={summary.totalListings}
            totalValue={summary.totalValue}
            bestScore={summary.bestScore}
            activeMatches={summary.activeMatches}
          />
          <PipelineToolbar
            filters={filters}
            onChange={setFilters}
            clientOptions={clientOptions}
            assetOptions={assetOptions}
            resultCount={sorted.length}
            totalCount={allMeta.length}
          />
          <PipelineKanban
            rows={sorted}
            hasFilters={hasFilters}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
          />
        </>
      )}
    </div>
  );
}
