import { Link } from "react-router-dom";
import { Building2, MapPin, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAgentExchangesQuery } from "@/features/agent/hooks/useAgentExchangesQuery";
import { EXCHANGE_STATUS_LABELS, EXCHANGE_STATUS_COLORS } from "@/lib/constants";

interface Props {
  clientId: string | null;
}

function fmtPrice(v: number | null | undefined) {
  if (!v) return "Price TBD";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

export function AgentListingsGrid({ clientId }: Props) {
  const { user } = useAuth();
  const { data: exchanges = [], isLoading } = useAgentExchangesQuery(user?.id);

  const filtered = clientId
    ? exchanges.filter((e) => e.client_id === clientId)
    : exchanges;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No listings yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create an exchange to pledge a relinquished property{clientId ? " for this client" : ""}.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to={clientId ? `/agent/exchanges/new?client=${clientId}` : "/agent/exchanges/new"}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New listing
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((e) => {
        const loc = [e.pledged_properties?.city, e.pledged_properties?.state]
          .filter(Boolean)
          .join(", ");
        return (
          <Link key={e.id} to={`/agent/exchanges/${e.id}`}>
            <Card className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    className={`${
                      EXCHANGE_STATUS_COLORS[e.status] || "bg-muted text-muted-foreground"
                    } text-[10px]`}
                  >
                    {EXCHANGE_STATUS_LABELS[e.status] || e.status}
                  </Badge>
                  {e.agent_clients?.client_name && (
                    <span className="truncate text-[11px] text-muted-foreground">
                      {e.agent_clients.client_name}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">
                  {fmtPrice(e.exchange_proceeds)}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {e.pledged_properties?.address ||
                    (e.status === "draft" ? "Draft — no property yet" : "Untitled listing")}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {loc || "Location TBD"}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
