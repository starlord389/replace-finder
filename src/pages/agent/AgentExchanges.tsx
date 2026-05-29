import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight, Plus, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";
import { formatCurrency } from "@/lib/exchangeWizardTypes";
import { EXCHANGE_STATUS_LABELS, EXCHANGE_STATUS_COLORS } from "@/lib/constants";
import { useAgentExchangesQuery } from "@/features/agent/hooks/useAgentExchangesQuery";

export default function AgentExchanges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: exchanges = [], isLoading, error } = useAgentExchangesQuery(user?.id);

  const activeCount = exchanges.filter(e => ["active", "in_identification", "in_closing"].includes(e.status)).length;

  if (isLoading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load exchanges: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Exchanges</h1>
          <p className="text-sm text-muted-foreground">{activeCount} active exchange{activeCount !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => navigate("/agent/exchanges/new")}><Plus className="mr-2 h-4 w-4" /> New Exchange</Button>
      </div>

      {exchanges.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">No exchanges yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">Create an exchange for a client to pledge their property and start receiving matches.</p>
          <Button className="mt-4" onClick={() => navigate("/agent/exchanges/new")}>Create First Exchange</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {exchanges.map(ex => {
            const propAddr = ex.pledged_properties ? [ex.pledged_properties.address, ex.pledged_properties.city, ex.pledged_properties.state].filter(Boolean).join(", ") : null;
            const nextDeadline = ex.identification_deadline || ex.closing_deadline;
            const daysLeft = nextDeadline ? differenceInDays(new Date(nextDeadline), new Date()) : null;

            return (
              <Card key={ex.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/agent/exchanges/${ex.id}`)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{ex.agent_clients?.client_name || "Unknown Client"}</p>
                    <p className="text-sm text-muted-foreground truncate">{propAddr || "No property pledged yet"}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {daysLeft != null && (
                      <span className={`flex items-center gap-1 text-xs font-medium ${daysLeft < 7 ? "text-destructive" : daysLeft < 21 ? "text-amber-600" : "text-green-600"}`}>
                        <Clock className="h-3.5 w-3.5" /> {daysLeft}d
                      </span>
                    )}
                    {ex.exchange_proceeds && <span className="text-sm font-medium text-foreground">{formatCurrency(ex.exchange_proceeds)}</span>}
                    <Badge className={EXCHANGE_STATUS_COLORS[ex.status] || "bg-muted text-muted-foreground"}>
                      {EXCHANGE_STATUS_LABELS[ex.status] || ex.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
