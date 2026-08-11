import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BriefcaseBusiness, MessageSquareText, Plus, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";
import { deriveUiStatus, statusForAudience } from "@/features/matches/components/inbox/inboxHelpers";
import { readMatchLocalState, useMatchLocalStateVersion } from "@/features/matches/components/inbox/useMatchLocalState";
import { PipelineToolbar } from "@/features/pipeline/components/PipelineToolbar";
import {
  OpportunityPipelineKanban,
  type OpportunityStage,
} from "@/features/pipeline/components/OpportunityPipelineKanban";
import {
  DEFAULT_FILTERS,
  type PipelineFilters,
  type SortKey,
} from "@/features/pipeline/lib/pipelineFilters";

const SORT_KEYS: SortKey[] = ["activity", "value", "score"];

function parseFiltersFromParams(params: URLSearchParams): PipelineFilters {
  const sortParam = params.get("sort");
  return {
    search: params.get("q") ?? "",
    clientIds: params.get("clients")?.split(",").filter(Boolean) ?? [],
    assetTypes: params.get("assets")?.split(",").filter(Boolean) ?? [],
    sort: sortParam && SORT_KEYS.includes(sortParam as SortKey) ? sortParam as SortKey : "activity",
  };
}

function writeFiltersToParams(base: URLSearchParams, filters: PipelineFilters) {
  const next = new URLSearchParams(base);
  if (filters.search) next.set("q", filters.search); else next.delete("q");
  if (filters.clientIds.length) next.set("clients", filters.clientIds.join(",")); else next.delete("clients");
  if (filters.assetTypes.length) next.set("assets", filters.assetTypes.join(",")); else next.delete("assets");
  if (filters.sort !== "activity") next.set("sort", filters.sort); else next.delete("sort");
  return next;
}

function formatMoney(value: number) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Sparkles;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}

export default function AgentPipeline({ audience = "agent" }: { audience?: "agent" | "investor" }) {
  const { user } = useAuth();
  const { isDemo } = useWorkspaceMode();
  const { data: relationships = [], isLoading } = useUnifiedRelationships(audience);
  const [searchParams, setSearchParams] = useSearchParams();
  useMatchLocalStateVersion();
  const isInvestor = audience === "investor";
  const basePath = isInvestor ? "/investor" : "/agent";

  useEffect(() => {
    if (!user || isDemo || isInvestor) return;
    supabase
      .from("profiles")
      .update({ launchpad_pipeline_ack_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("launchpad_pipeline_ack_at", null)
      .then(() => {});
  }, [user, isDemo, isInvestor]);

  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams]);
  const setFilters = (next: PipelineFilters) => {
    setSearchParams(writeFiltersToParams(searchParams, next), { replace: true });
  };

  // Pipeline is the buyer/client acquisition workflow. Seller-side incoming
  // interest remains visible in Matches and shared conversations, but must not
  // create a duplicate card inside the buyer's replacement-property pipeline.
  const buyerOpportunities = useMemo(
    () => relationships.filter((relationship) => relationship.mySide === "buyer"),
    [relationships],
  );

  const stageByMatch = useMemo(() => {
    const map = new Map<string, OpportunityStage>();
    for (const relationship of buyerOpportunities) {
      const status = statusForAudience(
        deriveUiStatus(relationship, readMatchLocalState(relationship.matchId)),
        audience,
      );
      if (status !== "archived") map.set(relationship.matchId, status);
    }
    return map;
  }, [buyerOpportunities, audience]);

  const archivedCount = buyerOpportunities.length - stageByMatch.size;
  const activeOpportunities = buyerOpportunities.filter((relationship) => stageByMatch.has(relationship.matchId));

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const result = activeOpportunities.filter((relationship) => {
      if (filters.clientIds.length && (!relationship.clientId || !filters.clientIds.includes(relationship.clientId))) return false;
      if (filters.assetTypes.length && (!relationship.propertyAssetType || !filters.assetTypes.includes(relationship.propertyAssetType))) return false;
      if (query) {
        const haystack = [
          relationship.clientName,
          relationship.propertyName,
          relationship.propertyCity,
          relationship.propertyState,
          relationship.relinquishedLabel,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
    return result.sort((left, right) => {
      if (filters.sort === "value") return (right.askingPrice ?? 0) - (left.askingPrice ?? 0);
      if (filters.sort === "score") return right.score - left.score;
      return right.lastActivityAt.localeCompare(left.lastActivityAt);
    });
  }, [activeOpportunities, filters]);

  const clientOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const relationship of buyerOpportunities) {
      if (relationship.clientId && relationship.clientName) map.set(relationship.clientId, relationship.clientName);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((left, right) => left.name.localeCompare(right.name));
  }, [buyerOpportunities]);

  const assetOptions = useMemo(
    () => Array.from(new Set(buyerOpportunities.map((relationship) => relationship.propertyAssetType).filter(Boolean) as string[])).sort(),
    [buyerOpportunities],
  );

  const totalValue = activeOpportunities.reduce((total, relationship) => total + (relationship.askingPrice ?? 0), 0);
  const conversationCount = activeOpportunities.filter((relationship) => {
    const stage = stageByMatch.get(relationship.matchId);
    return stage === "in_conversation" || stage === "loi" || stage === "under_contract";
  }).length;
  const bestScore = activeOpportunities.reduce<number | null>(
    (best, relationship) => best === null || relationship.score > best ? relationship.score : best,
    null,
  );
  const hasFilters = filters.search.trim() !== "" || filters.clientIds.length > 0 || filters.assetTypes.length > 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunity Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isInvestor
              ? "Follow each matched replacement property from discovery through closing."
              : "Every matched replacement property advances automatically when you take action in Next Steps."}
          </p>
          {archivedCount > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {archivedCount} archived opportunit{archivedCount === 1 ? "y remains" : "ies remain"} available in Matches.
            </p>
          ) : null}
        </div>
        <Button asChild size="sm">
          <Link to={`${basePath}/exchanges/new`}><Plus className="mr-1 h-4 w-4" /> New listing</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : buyerOpportunities.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
          <BriefcaseBusiness className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold text-foreground">No matched opportunities yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Create and activate a listing. Each qualified replacement property will appear here automatically.</p>
          <Button asChild size="sm" className="mt-4"><Link to={`${basePath}/exchanges/new`}><Plus className="mr-1 h-4 w-4" /> Create listing</Link></Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Active opportunities" value={`${activeOpportunities.length}`} detail="One card per matched property" icon={BriefcaseBusiness} />
            <SummaryCard label="Replacement value" value={formatMoney(totalValue)} detail="Across active opportunities" icon={TrendingUp} />
            <SummaryCard label="Agent conversations" value={`${conversationCount}`} detail="Active deal discussions" icon={MessageSquareText} />
            <SummaryCard label="Best match" value={bestScore === null ? "-" : `${Math.round(bestScore)}`} detail="Highest current score" icon={Sparkles} />
          </div>

          <PipelineToolbar
            filters={filters}
            onChange={setFilters}
            clientOptions={clientOptions}
            assetOptions={assetOptions}
            resultCount={filtered.length}
            totalCount={activeOpportunities.length}
            audience={audience}
          />

          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center">
              <p className="font-semibold">No opportunities match these filters</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</Button>
            </div>
          ) : (
            <OpportunityPipelineKanban relationships={filtered} stageByMatch={stageByMatch} audience={audience} />
          )}
        </>
      )}
    </div>
  );
}
