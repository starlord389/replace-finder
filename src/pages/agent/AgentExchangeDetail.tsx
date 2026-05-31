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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Clock, Pencil, Send, Archive, Trash2, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
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
  const [matchCount, setMatchCount] = useState(0);
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
    const mCount = (matchRes as any).count ?? 0;
    setMatchCount(mCount);
    setHasMatchesOrConns(conns.length > 0 || mCount > 0);

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

  const isDraft = exchange.status === "draft";
  const isActive = exchange.status === "active";
  const canDelete = isDraft && !hasMatchesOrConns;
  const canMoveToDraft = isActive && !hasBlockingConnections;

  const primaryDeadline = exchange.identification_deadline || exchange.closing_deadline;
  const primaryDaysLeft = primaryDeadline ? differenceInDays(new Date(primaryDeadline), new Date()) : null;
  const propertyAddress = property ? [property.address, property.city, property.state].filter(Boolean).join(", ") : null;
  const relinquishedValue = financials?.asking_price ?? exchange.exchange_proceeds ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agent/exchanges")} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" /> All exchanges
        </Button>
      </div>

      {/* Context header */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Exchange Workspace</p>
              <h1 className="mt-1 truncate text-2xl font-bold text-foreground">
                {client?.client_name || "Exchange"}
              </h1>
              <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {property?.property_name ? `${property.property_name} · ` : ""}
                {propertyAddress || "No property pledged"}
              </p>
            </div>
            <Badge className={EXCHANGE_STATUS_COLORS[exchange.status] || "bg-muted text-muted-foreground"}>
              {EXCHANGE_STATUS_LABELS[exchange.status] || exchange.status}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
            <HeaderStat label="Relinquished value" value={relinquishedValue != null ? formatCurrency(relinquishedValue) : "—"} />
            <HeaderStat
              label={exchange.identification_deadline ? "Days to ID" : "Days to close"}
              value={primaryDaysLeft != null ? `${primaryDaysLeft} days` : "—"}
              tone={primaryDaysLeft == null ? undefined : primaryDaysLeft < 7 ? "danger" : primaryDaysLeft < 21 ? "warn" : "ok"}
            />
            <HeaderStat label="Matches" value={matchCount.toString()} />
            <HeaderStat
              label="Target criteria"
              value={
                criteria?.target_asset_types?.length
                  ? criteria.target_asset_types.slice(0, 2).map((t: string) => ASSET_TYPE_LABELS[t as keyof typeof ASSET_TYPE_LABELS] || t).join(", ")
                  : "Not set"
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Workspace tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="shared">Shared with Client</TabsTrigger>
          <TabsTrigger value="threads">Agent Threads</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/agent/exchanges/${id}/edit`)} disabled={acting}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            {isDraft && (
              <Button size="sm" onClick={() => runAction("publish", "Exchange published — matching queued.")} disabled={acting}>
                <Send className="mr-2 h-4 w-4" /> Publish
              </Button>
            )}
            {canMoveToDraft && (
              <Button variant="outline" size="sm" onClick={() => runAction("move_to_draft", "Moved to draft — matching paused.")} disabled={acting}>
                <Archive className="mr-2 h-4 w-4" /> Save as Draft
              </Button>
            )}
            {canDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={acting}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete draft
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this draft exchange?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the property, financials, criteria, and timeline. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => runAction("delete_draft", "Draft exchange deleted.")}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
        </TabsContent>

        {/* MATCHES (placeholder) */}
        <TabsContent value="matches" className="mt-4">
          <Card>
            <CardContent className="space-y-3 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Ranked replacement property matches for this exchange will live here.
              </p>
              {matchCount > 0 && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/agent/matches?exchange=${id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in legacy Matches view ({matchCount})
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHARED */}
        <TabsContent value="shared" className="mt-4">
          <PlaceholderTab text="Properties you've shared with this client — and their reactions — will appear here." />
        </TabsContent>

        {/* THREADS */}
        <TabsContent value="threads" className="mt-4">
          <PlaceholderTab text="Conversations with listing agents for matches on this exchange will appear here." />
        </TabsContent>

        {/* PIPELINE */}
        <TabsContent value="pipeline" className="mt-4">
          <PlaceholderTab text="Deal lifecycle for this exchange — Interested → LOI → Under Contract → Closed — will appear here." />
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="mt-4">
          {timeline.length > 0 ? (
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
          ) : (
            <PlaceholderTab text="Exchange activity and audit log will appear here." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeaderStat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "danger" }) {
  const toneClass =
    tone === "danger" ? "text-destructive" :
    tone === "warn" ? "text-amber-600" :
    tone === "ok" ? "text-green-600" : "text-foreground";
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function PlaceholderTab({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
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
