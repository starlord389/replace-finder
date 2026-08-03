import { Link } from "react-router-dom";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAgentListings } from "@/features/pipeline/hooks/useAgentListings";
import { ListingSwitcher } from "@/features/workspace/components/ListingSwitcher";

export default function InvestorListings() {
  const { user } = useAuth();
  const { data: listings = [], isLoading } = useAgentListings(user?.id, "investor");

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Exchanges</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your current properties and the exchanges they are generating.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/investor/exchanges/new"><Plus className="mr-1 h-4 w-4" /> New listing</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
          <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-base font-semibold text-foreground">No exchanges yet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            List your current property and the platform will automatically surface financially stronger replacement opportunities.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/investor/exchanges/new"><Plus className="mr-1 h-4 w-4" /> List your property</Link>
          </Button>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-7xl">
          <ListingSwitcher listings={listings} basePath="/investor" ownerLabel="Your exchange" />
        </div>
      )}
    </div>
  );
}
