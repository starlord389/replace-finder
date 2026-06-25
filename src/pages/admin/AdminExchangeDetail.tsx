import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { STAGE_DEFS, type StageKey } from "@/features/pipeline/lib/pipelineStages";
import { Loader2, ArrowLeft, Clock } from "lucide-react";

const EXCHANGE_STATUSES = ["draft", "active", "in_identification", "in_closing", "completed", "failed", "cancelled"];

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  draft: "bg-muted text-muted-foreground",
  in_identification: "bg-amber-100 text-amber-800 border-amber-200",
  in_closing: "bg-blue-100 text-blue-800 border-blue-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function money(n: number | null | undefined) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : "—";
}
function pretty(s: string) {
  return s.replace(/_/g, " ");
}

export default function AdminExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exchange, setExchange] = useState<Tables<"exchanges"> | null>(null);
  const [agentName, setAgentName] = useState("—");
  const [client, setClient] = useState<Tables<"agent_clients"> | null>(null);
  const [property, setProperty] = useState<Tables<"pledged_properties"> | null>(null);
  const [criteria, setCriteria] = useState<Tables<"replacement_criteria"> | null>(null);
  const [matches, setMatches] = useState<Tables<"matches">[]>([]);
  const [connections, setConnections] = useState<Tables<"exchange_connections">[]>([]);
  const [timeline, setTimeline] = useState<Tables<"exchange_timeline">[]>([]);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingStage, setSavingStage] = useState(false);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function load(exchangeId: string) {
    setLoading(true);
    const { data: ex, error } = await supabase.from("exchanges").select("*").eq("id", exchangeId).maybeSingle();
    if (error || !ex) {
      toast({ title: "Couldn't load this exchange.", variant: "destructive" });
      setLoading(false);
      return;
    }
    setExchange(ex);
    const [prof, cl, prop, crit, mt, cn, tl] = await Promise.all([
      supabase.from("profiles").select("full_name, email").eq("id", ex.agent_id).maybeSingle(),
      supabase.from("agent_clients").select("*").eq("id", ex.client_id).maybeSingle(),
      ex.relinquished_property_id
        ? supabase.from("pledged_properties").select("*").eq("id", ex.relinquished_property_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("replacement_criteria").select("*").eq("exchange_id", exchangeId).limit(1).maybeSingle(),
      supabase.from("matches").select("*").eq("buyer_exchange_id", exchangeId).order("total_score", { ascending: false }),
      supabase.from("exchange_connections").select("*").or(`buyer_exchange_id.eq.${exchangeId},seller_exchange_id.eq.${exchangeId}`),
      supabase.from("exchange_timeline").select("*").eq("exchange_id", exchangeId).order("created_at", { ascending: false }),
    ]);
    setAgentName(prof.data?.full_name || prof.data?.email || "Unknown");
    setClient(cl.data ?? null);
    setProperty(prop.data ?? null);
    setCriteria(crit.data ?? null);
    setMatches(mt.data ?? []);
    setConnections(cn.data ?? []);
    setTimeline(tl.data ?? []);
    setLoading(false);
  }

  async function logEvent(description: string) {
    if (!exchange) return;
    // Both callers log a status/stage override, so use 'status_change' — the
    // fitting value in exchange_timeline_event_check (there is no
    // 'admin_action'). The admin origin stays in the description + actor_id.
    const { error } = await supabase.from("exchange_timeline").insert({
      exchange_id: exchange.id,
      event_type: "status_change",
      description,
      actor_id: user?.id ?? null,
    });
    if (error) {
      console.error("Failed to write admin timeline entry:", error);
      toast({
        title: "Action saved, but the timeline entry could not be logged.",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  async function changeStatus(status: string) {
    if (!exchange) return;
    setSavingStatus(true);
    const { error } = await supabase.from("exchanges").update({ status: status as Tables<"exchanges">["status"] }).eq("id", exchange.id);
    if (error) {
      setSavingStatus(false);
      toast({ title: "Failed to update status.", description: error.message, variant: "destructive" });
      return;
    }
    await logEvent(`Admin changed exchange status to "${pretty(status)}".`);
    setExchange({ ...exchange, status: status as Tables<"exchanges">["status"] });
    setSavingStatus(false);
    toast({ title: "Status updated." });
    load(exchange.id);
  }

  async function changeStage(value: string) {
    if (!exchange) return;
    const stage = value === "__auto__" ? null : (value as StageKey);
    setSavingStage(true);
    const { error } = await supabase.from("exchanges").update({ pipeline_stage_override: stage }).eq("id", exchange.id);
    if (error) {
      setSavingStage(false);
      toast({ title: "Failed to update stage.", description: error.message, variant: "destructive" });
      return;
    }
    await logEvent(stage ? `Admin overrode pipeline stage to "${stage}".` : "Admin cleared the pipeline stage override.");
    setExchange({ ...exchange, pipeline_stage_override: stage });
    setSavingStage(false);
    toast({ title: "Stage updated." });
    load(exchange.id);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!exchange) {
    return (
      <div>
        <BackLink />
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Exchange not found.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchange</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {agentName} · {client?.client_name ?? "—"} · created {fmtDate(exchange.created_at)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${statusColor[exchange.status] || "bg-muted text-muted-foreground"}`}>
          {pretty(exchange.status)}
        </span>
      </div>

      {/* Admin actions */}
      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-base">Admin actions</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Exchange status</label>
            <div className="flex items-center gap-2">
              <Select value={exchange.status} onValueChange={changeStatus}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXCHANGE_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{pretty(s)}</SelectItem>)}
                </SelectContent>
              </Select>
              {savingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Pipeline stage override</label>
            <div className="flex items-center gap-2">
              <Select value={exchange.pipeline_stage_override ?? "__auto__"} onValueChange={changeStage}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__auto__">Auto (no override)</SelectItem>
                  {STAGE_DEFS.map((s) => <SelectItem key={s.key} value={s.key}>{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
              {savingStage && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Financials */}
        <Card>
          <CardHeader><CardTitle className="text-base">Exchange details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Sale close</dt><dd>{fmtDate(exchange.sale_close_date)}</dd>
              <dt className="text-muted-foreground">Actual close</dt><dd>{fmtDate(exchange.actual_close_date)}</dd>
              <dt className="text-muted-foreground">Proceeds</dt><dd>{money(exchange.exchange_proceeds)}</dd>
              <dt className="text-muted-foreground">Est. basis</dt><dd>{money(exchange.estimated_basis)}</dd>
              <dt className="text-muted-foreground">Est. equity</dt><dd>{money(exchange.estimated_equity)}</dd>
              <dt className="text-muted-foreground">Est. gain</dt><dd>{money(exchange.estimated_gain)}</dd>
              <dt className="text-muted-foreground">Est. tax</dt><dd>{money(exchange.estimated_tax_liability)}</dd>
            </dl>
          </CardContent>
        </Card>

        {/* Relinquished property */}
        <Card>
          <CardHeader><CardTitle className="text-base">Relinquished property</CardTitle></CardHeader>
          <CardContent>
            {property ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Address</dt><dd>{property.address || property.property_name || "—"}</dd>
                <dt className="text-muted-foreground">Address visibility</dt><dd>{property.address_is_public ? "Shown to agents" : "Hidden from agents"}</dd>
                <dt className="text-muted-foreground">Location</dt><dd>{[property.city, property.state].filter(Boolean).join(", ") || "—"}</dd>
                <dt className="text-muted-foreground">Asset type</dt><dd className="capitalize">{property.asset_type ? pretty(property.asset_type) : "—"}</dd>
                <dt className="text-muted-foreground">Status</dt><dd className="capitalize">{pretty(property.status)}</dd>
              </dl>
            ) : <p className="text-sm text-muted-foreground">No relinquished property linked.</p>}
          </CardContent>
        </Card>

        {/* Criteria */}
        <Card>
          <CardHeader><CardTitle className="text-base">Replacement criteria</CardTitle></CardHeader>
          <CardContent>
            {criteria ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Price range</dt><dd>{money(criteria.target_price_min)} – {money(criteria.target_price_max)}</dd>
                <dt className="text-muted-foreground">Asset types</dt><dd className="capitalize">{criteria.target_asset_types?.map(pretty).join(", ") || "—"}</dd>
                <dt className="text-muted-foreground">States</dt><dd>{criteria.target_states?.join(", ") || "—"}</dd>
                <dt className="text-muted-foreground">Cap rate</dt><dd>{criteria.target_cap_rate_min ?? "—"}–{criteria.target_cap_rate_max ?? "—"}%</dd>
                <dt className="text-muted-foreground">Urgency</dt><dd className="capitalize">{criteria.urgency || "—"}</dd>
              </dl>
            ) : <p className="text-sm text-muted-foreground">No criteria set.</p>}
          </CardContent>
        </Card>

        {/* Matches & connections */}
        <Card>
          <CardHeader><CardTitle className="text-base">Matches &amp; connections</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium">{matches.length}</span> match{matches.length !== 1 ? "es" : ""}
              {matches.length > 0 && (
                <span className="text-muted-foreground"> · top score {Math.round(matches[0].total_score)}</span>
              )}
            </div>
            <div>
              <span className="font-medium">{connections.length}</span> connection{connections.length !== 1 ? "s" : ""}
            </div>
            {connections.map((c) => (
              <Link key={c.id} to={`/admin/deals/connections/${c.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50">
                <span className="capitalize">{pretty(c.status)}</span>
                <span className="text-xs text-primary">View →</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Timeline</CardTitle></CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {timeline.map((t) => (
                <li key={t.id} className="flex gap-3 text-sm">
                  <span className="w-36 shrink-0 text-xs text-muted-foreground">{fmtDateTime(t.created_at)}</span>
                  <span>{t.description}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/deals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back to Deal Oversight
    </Link>
  );
}
