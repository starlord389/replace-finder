import { Link } from "react-router-dom";
import { Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { ListingSwitcher } from "@/features/workspace/components/ListingSwitcher";

export default function AgentListings() {
  const { user } = useAuth();
  const { data: listings = [], isLoading } = useAgentListings(user?.id);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Listings</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your active listings, grouped by client.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/agent/exchanges/new">
            <Plus className="mr-1 h-4 w-4" /> New listing
          </Link>
        </Button>
      </div>

      {isLoading ? (
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
        <div className="mx-auto w-full max-w-6xl">
          <ListingSwitcher listings={listings} />
        </div>
      )}
    </div>
  );
}
