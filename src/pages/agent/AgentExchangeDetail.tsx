import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Clock, Pencil, Send, Archive, Trash2 } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { formatCurrency } from "@/lib/exchangeWizardTypes";
import { ASSET_TYPE_LABELS, EXCHANGE_STATUS_LABELS, EXCHANGE_STATUS_COLORS } from "@/lib/constants";
import { useUpdateExchange } from "@/features/exchanges/hooks/useUpdateExchange";
import { toast } from "sonner";

export default function AgentExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [criteria, setCriteria] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [hasBlockingConnections, setHasBlockingConnections] = useState(false);
  const [hasMatchesOrConns, setHasMatchesOrConns] = useState(false);
  const updateExchange = useUpdateExchange();
  const [acting, setActing] = useState(false);

  const reload = async () => {
    if (!id || !user) return;
    const { data: ex } = await supabase.from("exchanges").select("*").eq("id", id).eq("agent_id", user.id).single();
    if (!ex) { navigate("/agent/exchanges"); return; }
    setExchange(ex);

    const promises = [
      supabase.from("agent_clients").select("*").eq("id", ex.client_id).single(),
      ex.relinquished_property_id ? supabase.from("pledged_properties").select("*").eq("id", ex.relinquished_property_id).single() : Promise.resolve({ data: null }),
      ex.relinquished_property_id ? supabase.from("property_financials").select("*").eq("property_id", ex.relinquished_property_id).single() : Promise.resolve({ data: null }),
      ex.criteria_id ? supabase.from("replacement_criteria").select("*").eq("id", ex.criteria_id).single() : Promise.resolve({ data: null }),
      supabase.from("exchange_timeline").select("*").eq("exchange_id", id).order("created_at", { ascending: false }),
      supabase.from("exchange_connections").select("id, status", { count: "exact" }).eq("buyer_exchange_id", id),
      supabase.from("matches").select("id", { count: "exact", head: true }).eq("buyer_exchange_id", id),
    ];

    const [clientRes, propRes, finRes, critRes, timeRes, connRes, matchRes] = await Promise.all(promises);
    setClient((clientRes as any).data);
    setProperty((propRes as any).data);
    setFinancials((finRes as any).data);
    setCriteria((critRes as any).data);
    setTimeline((timeRes as any).data || []);

    const conns = ((connRes as any).data ?? []) as Array<{ status: string }>;
    setHasBlockingConnections(conns.some(c => c.status === "accepted" || c.status === "completed"));
    setHasMatchesOrConns(conns.length > 0 || ((matchRes as any).count ?? 0) > 0);

    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const runAction = async (intent: "publish" | "move_to_draft" | "delete_draft", successMsg: string) => {
    if (!id) return;
    setActing(true);
    try {
      await updateExchange.mutateAsync({ exchangeId: id, intent });
      toast.success(successMsg);
      if (intent === "delete_draft") {
        navigate("/agent/exchanges");
      } else {
        await reload();
      }
    } catch (err: any) {
      toast.error("Action failed: " + (err.message || "Unknown error"));
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!exchange) return null;

  const deadlines = [
    exchange.identification_deadline && { label: "Identification Deadline", date: exchange.identification_deadline },
    exchange.closing_deadline && { label: "Closing Deadline", date: exchange.closing_deadline },
  ].filter(Boolean) as { label: string; date: string }[];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agent/exchanges")}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{client?.client_name || "Exchange"}</h1>
          <p className="text-sm text-muted-foreground">{property ? [property.address, property.city, property.state].filter(Boolean).join(", ") : "No property pledged"}</p>
        </div>
        <Badge className={EXCHANGE_STATUS_COLORS[exchange.status] || "bg-muted text-muted-foreground"}>
          {EXCHANGE_STATUS_LABELS[exchange.status] || exchange.status}
        </Badge>
      </div>

      {/* Deadlines */}
      {deadlines.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {deadlines.map(d => {
            const days = differenceInDays(new Date(d.date), new Date());
            const color = days < 7 ? "text-destructive" : days < 21 ? "text-amber-600" : "text-green-600";
            return (
              <Card key={d.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <Clock className={`h-5 w-5 ${color}`} />
                  <div>
                    <p className="text-sm font-medium">{d.label}</p>
                    <p className={`text-lg font-bold ${color}`}>{days} days remaining</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(d.date), "MMM d, yyyy")}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Overview */}
      <Card>
        <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Exchange Overview</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-2">
          <Detail label="Estimated Proceeds" value={formatCurrency(exchange.exchange_proceeds)} />
          <Detail label="Estimated Equity" value={formatCurrency(exchange.estimated_equity)} />
        </CardContent>
      </Card>

      {/* Property */}
      <Card>
        <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Pledged Property</CardTitle></CardHeader>
        <CardContent>
          {property ? (
            <>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
                <Detail label="Name" value={property.property_name} />
                <Detail label="Address" value={[property.address, property.city, property.state, property.zip].filter(Boolean).join(", ")} />
                <Detail label="Asset Type" value={property.asset_type ? ASSET_TYPE_LABELS[property.asset_type as keyof typeof ASSET_TYPE_LABELS] : "—"} />
                <Detail label="Year Built" value={property.year_built?.toString()} />
                <Detail label="Units" value={property.units?.toString()} />
                <Detail label="Building SF" value={property.building_square_footage?.toLocaleString()} />
                {financials && <>
                  <Detail label="Asking Price" value={formatCurrency(financials.asking_price)} />
                  <Detail label="NOI" value={formatCurrency(financials.noi)} />
                  <Detail label="Cap Rate" value={financials.cap_rate ? `${financials.cap_rate}%` : "—"} />
                  <Detail label="Occupancy" value={financials.occupancy_rate ? `${financials.occupancy_rate}%` : "—"} />
                  <Detail label="Loan Balance" value={formatCurrency(financials.loan_balance)} />
                </>}
              </div>
              {property.description && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Property Summary</p>
                  <p className="mt-2 text-sm text-foreground">{property.description}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No property pledged yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Replacement Criteria</CardTitle></CardHeader>
        <CardContent>
          {criteria ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Asset Types: </span>
                {criteria.target_asset_types?.map((t: string) => <Badge key={t} variant="secondary" className="mr-1">{ASSET_TYPE_LABELS[t as keyof typeof ASSET_TYPE_LABELS] || t}</Badge>)}
              </div>
              <div>
                <span className="text-sm text-muted-foreground">States: </span>
                {criteria.target_states?.map((s: string) => <Badge key={s} variant="outline" className="mr-1 text-xs">{s}</Badge>)}
              </div>
              <Detail label="Price Range" value={`${formatCurrency(criteria.target_price_min)} – ${formatCurrency(criteria.target_price_max)}`} />
              {criteria.target_metros?.length > 0 && <Detail label="Target Metros" value={criteria.target_metros.join(", ")} />}
              {criteria.target_year_built_min && <Detail label="Min Year Built" value={criteria.target_year_built_min?.toString()} />}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No replacement criteria set.</p>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeline.map(e => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{e.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(e.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}
