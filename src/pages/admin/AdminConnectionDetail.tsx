import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { recordAdminAction } from "@/features/admin/hooks/useAdminOperations";
import { exchangeOwnerTypeLabel } from "@/features/admin/lib/accountTypes";
import { resolveListingName } from "@/lib/listingDisplay";
import { Loader2, ArrowLeft, RefreshCw, ArrowRight, Building2, MessageSquare } from "lucide-react";

const CONNECTION_STATUSES = ["pending", "accepted", "in_progress", "declined", "cancelled", "completed"];

const CONNECTION_STATUS_LABELS: Record<string, string> = {
  in_progress: "Under Contract",
};

const statusColor: Record<string, string> = {
  accepted: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

function fmtDateTime(d: string | null) {
  return d ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : null;
}
function money(n: number | null) {
  return n != null ? `$${Math.round(n).toLocaleString()}` : "-";
}
function pretty(s: string) {
  return s.replace(/_/g, " ");
}

export default function AdminConnectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conn, setConn] = useState<Tables<"exchange_connections"> | null>(null);
  const [match, setMatch] = useState<Tables<"matches"> | null>(null);
  const [messages, setMessages] = useState<Tables<"messages">[]>([]);
  const [properties, setProperties] = useState<Map<string, Tables<"pledged_properties">>>(new Map());
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [ownerTypes, setOwnerTypes] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const loadRequestRef = useRef(0);

  useEffect(() => {
    if (id) load(id);
    return () => { loadRequestRef.current += 1; };
  }, [id]);

  async function load(connId: string) {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    setLoadError(null);
    setConn(null);
    setMatch(null);
    setMessages([]);
    setProperties(new Map());
    const { data: c, error } = await supabase.from("exchange_connections").select("*").eq("id", connId).maybeSingle();
    if (requestId !== loadRequestRef.current) return;
    if (error) {
      setLoadError(error.message || "The connection record could not be loaded.");
      toast({ title: "Couldn't load this connection.", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    if (!c) {
      setLoadError("This connection does not exist or is no longer available.");
      setLoading(false);
      return;
    }
    setConn(c);
    const exchangeIds = [c.buyer_exchange_id, c.seller_exchange_id].filter((value): value is string => Boolean(value));
    const [mt, msgs, profs, exchanges] = await Promise.all([
      c.match_id ? supabase.from("matches").select("*").eq("id", c.match_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("messages").select("*").eq("connection_id", connId).order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, email").in("id", [c.buyer_agent_id, c.seller_agent_id]),
      supabase.from("exchanges").select("id, owner_type, relinquished_property_id").in("id", exchangeIds),
    ]);
    if (requestId !== loadRequestRef.current) return;
    const loadedMatch = mt.data ?? null;
    const buyerExchange = (exchanges.data ?? []).find((exchange) => exchange.id === c.buyer_exchange_id);
    const propertyIds = [...new Set([
      loadedMatch?.relinquished_property_id,
      buyerExchange?.relinquished_property_id,
      loadedMatch?.seller_property_id,
    ].filter((value): value is string => Boolean(value)))];
    const propertyResult = propertyIds.length
      ? await supabase.from("pledged_properties").select("*").in("id", propertyIds)
      : { data: [] as Tables<"pledged_properties">[], error: null };
    if (requestId !== loadRequestRef.current) return;
    setMatch(loadedMatch);
    setMessages(msgs.data ?? []);
    setProperties(new Map((propertyResult.data ?? []).map((property) => [property.id, property])));
    setNames(new Map((profs.data ?? []).map((p) => [p.id, p.full_name || p.email || "Unknown"])));
    setOwnerTypes(new Map((exchanges.data ?? []).map((exchange) => [exchange.id, exchange.owner_type])));
    setLoading(false);
  }

  async function changeStatus(status: string) {
    if (!conn) return;
    const previousStatus = conn.status;
    setSaving(true);
    const { error } = await supabase.from("exchange_connections").update({ status }).eq("id", conn.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update status.", description: error.message, variant: "destructive" });
      return;
    }
    await recordAdminAction({
      action: "connection.status_changed",
      entityType: "exchange_connection",
      entityId: conn.id,
      summary: `Changed connection status from ${pretty(previousStatus)} to ${pretty(status)}`,
      metadata: { previous_status: previousStatus, new_status: status },
    });
    setConn({ ...conn, status });
    toast({ title: "Connection status updated." });
  }

  const name = (uid: string) => names.get(uid) ?? "Unknown";
  const participantType = (exchangeId: string | null) =>
    exchangeOwnerTypeLabel(exchangeId ? ownerTypes.get(exchangeId) : null);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!conn) {
    return (
      <div>
        <BackLink />
        <Card><CardContent className="p-8 text-center"><p className="text-sm font-medium">{loadError ?? "Connection not found."}</p><p className="mt-1 text-xs text-muted-foreground">No other connection record is being shown in its place.</p>{id && <Button variant="outline" size="sm" className="mt-4" onClick={() => load(id)}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>}</CardContent></Card>
      </div>
    );
  }

  const milestones: Array<[string, string | null]> = [
    ["Initiated", conn.initiated_at],
    ["Accepted", conn.accepted_at],
    ["Inspection complete", conn.inspection_complete_at],
    ["Under contract", conn.under_contract_at],
    ["Financing approved", conn.financing_approved_at],
    ["Closed", conn.closed_at],
    ["Declined", conn.declined_at],
    ["Failed", conn.failed_at],
  ];
  const currentProperty = (match?.relinquished_property_id ? properties.get(match.relinquished_property_id) : null)
    ?? [...properties.values()].find((property) => property.id !== match?.seller_property_id)
    ?? null;
  const matchedProperty = match?.seller_property_id ? properties.get(match.seller_property_id) : null;

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent conversation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buyer: <ParticipantLink id={conn.buyer_agent_id} name={name(conn.buyer_agent_id)} /> ({participantType(conn.buyer_exchange_id)}) · Seller: <ParticipantLink id={conn.seller_agent_id} name={name(conn.seller_agent_id)} /> ({participantType(conn.seller_exchange_id)})
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${statusColor[conn.status] || "bg-muted text-muted-foreground"}`}>
          {pretty(conn.status)}
        </span>
      </div>

      <Card className="overflow-hidden border-slate-200">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property opportunity</p></div>
          <div className="grid items-stretch md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <PropertyContext property={currentProperty} label="Client’s current property" />
            <div className="hidden place-items-center border-x border-slate-200 px-4 md:grid"><ArrowRight className="h-5 w-5 text-emerald-600" /></div>
            <PropertyContext property={matchedProperty} label="Matched replacement property" />
          </div>
          {match && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3"><p className="text-xs text-slate-500">Match score <strong className="ml-1 text-slate-900">{Math.round(match.total_score)}</strong></p><Button asChild variant="outline" size="sm"><Link to={`/admin/opportunities/matches/${match.id}`}>Open complete match comparison<ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button></div>}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="border-primary/30">
          <CardHeader><CardTitle className="text-base">Admin action</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Conversation status</label>
              <div className="flex items-center gap-2">
                <Select value={conn.status} onValueChange={changeStatus}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONNECTION_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{CONNECTION_STATUS_LABELS[s] ?? pretty(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Milestones */}
        <Card>
          <CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {milestones.map(([label, ts]) => (
                <li key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{fmtDateTime(ts) ?? <span className="text-xs text-muted-foreground">-</span>}</span>
                </li>
              ))}
            </ul>
            {(conn.decline_reason || conn.failure_reason) && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
                {conn.decline_reason || conn.failure_reason}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Match + fee */}
        <Card>
          <CardHeader><CardTitle className="text-base">Deal context</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Match score</dt><dd>{match ? Math.round(match.total_score) : "-"}</dd>
              <dt className="text-muted-foreground">Buyer account</dt><dd>{participantType(conn.buyer_exchange_id)}</dd>
              <dt className="text-muted-foreground">Seller account</dt><dd>{participantType(conn.seller_exchange_id)}</dd>
              <dt className="text-muted-foreground">Fee agreed</dt><dd>{conn.facilitation_fee_agreed ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Fee amount</dt><dd>{money(conn.facilitation_fee_amount)}</dd>
              <dt className="text-muted-foreground">Fee status</dt><dd className="capitalize">{pretty(conn.facilitation_fee_status)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Messages audit */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-slate-50"><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-emerald-700" />Conversation history ({messages.length})</CardTitle><p className="text-xs text-muted-foreground">Read-only audit of the agent-to-agent conversation.</p></CardHeader>
        <CardContent className="bg-slate-100/60 p-5">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages exchanged.</p>
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => {
                const buyerMessage = m.sender_id === conn.buyer_agent_id;
                return <li key={m.id} className={`flex ${buyerMessage ? "justify-start" : "justify-end"}`}><div className="max-w-[82%]"><div className={`mb-1 flex items-center gap-2 text-xs text-muted-foreground ${buyerMessage ? "justify-start" : "justify-end"}`}><ParticipantLink id={m.sender_id} name={name(m.sender_id)} /><span>·</span><span>{fmtDateTime(m.created_at)}</span></div><div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${buyerMessage ? "rounded-tl-md border border-slate-200 bg-white text-slate-800" : "rounded-tr-md bg-slate-950 text-white"}`}><p className="whitespace-pre-wrap">{m.content}</p></div></div></li>;
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ParticipantLink({ id, name }: { id: string; name: string }) {
  return <Link to={`/admin/users/${id}`} className="font-medium text-foreground hover:text-primary hover:underline">{name}</Link>;
}

function PropertyContext({ property, label }: { property: Tables<"pledged_properties"> | null; label: string }) {
  return (
    <div className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Building2 className="h-4 w-4" /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          {property ? <><Link to={`/admin/properties/${property.id}`} className="mt-1 block truncate text-sm font-semibold text-slate-950 hover:text-emerald-700 hover:underline">{resolveListingName(property, true)}</Link><p className="mt-1 text-xs text-slate-500">{[property.city, property.state].filter(Boolean).join(", ") || "Location not provided"} · {property.asset_type ? pretty(property.asset_type) : "Asset type not provided"}</p></> : <p className="mt-1 text-sm text-slate-500">Property context unavailable</p>}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/opportunities" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Back to Opportunities
    </Link>
  );
}
