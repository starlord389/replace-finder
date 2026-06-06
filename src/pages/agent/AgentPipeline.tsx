import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Inbox as InboxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { PipelineKanban } from "@/features/pipeline/components/PipelineKanban";

export default function AgentPipeline() {
  const { user } = useAuth();
  const { data: rels = [], isLoading: relsLoading } = useUnifiedRelationships();
  const { data: listings = [], isLoading: listingsLoading } = useAgentListings(user?.id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auto-redirect legacy ?match=/?connection=/?id= deep links straight into Workspace
  useEffect(() => {
    const legacyId = searchParams.get("id") ?? searchParams.get("connection") ?? searchParams.get("match");
    if (!legacyId || rels.length === 0) return;
    const found = rels.find((r) => r.id === legacyId || r.matchId === legacyId || r.connectionId === legacyId);
    if (found) navigate(`/agent/workspace/${found.buyerExchangeId}?match=${found.matchId}`, { replace: true });
  }, [searchParams, rels, navigate]);

  const isLoading = relsLoading || listingsLoading;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            High-level view of every listing by stage. Click any card to open it in the Workspace.
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
            Create a listing and we'll start tracking it through the stages here.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/agent/exchanges/new">
              <Plus className="mr-1 h-4 w-4" /> New listing
            </Link>
          </Button>
        </div>
      ) : (
        <PipelineKanban listings={listings} relationships={rels} />
      )}
    </div>
  );
}
