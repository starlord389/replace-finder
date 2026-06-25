import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, ArrowLeft } from "lucide-react";

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
  return n != null ? `$${Math.round(n).toLocaleString()}` : "—";
}
function pretty(s: string) {
  return s.replace(/_/g, " ");
}

export default function AdminConnectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [conn, setConn] = useState<Tables<"exchange_connections"> | null>(null);
  const [match, setMatch] = useState<Tables<"matches"> | null>(null);
  const [messages, setMessages] = useState<Tables<"messages">[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function load(connId: string) {
    setLoading(true);
    const { data: c, error } = await supabase.from("exchange_connections").select("*").eq("id", connId).maybeSingle();
    if (error || !c) {
      toast({ title: "Couldn't load this connection.", variant: "destructive" });
      setLoading(false);
      return;
    }
    setConn(c);
    const [mt, msgs, profs] = await Promise.all([
      c.match_id ? supabase.from("matches").select("*").eq("id", c.match_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("messages").select("*").eq("connection_id", connId).order("created_at", { ascending: true }),
      supabase.from("profiles").select("id, full_name, email").in("id", [c.buyer_agent_id, c.seller_agent_id]),
    ]);
    setMatch(mt.data ?? null);
    setMessages(msgs.data ?? []);
    setNames(new Map((profs.data ?? []).map((p) => [p.id, p.full_name || p.email || "Unknown"])));
    setLoading(false);
  }

  async function changeStatus(status: string) {
    if (!conn) return;
    setSaving(true);
    const { error } = await supabase.from("exchange_connections").update({ status }).eq("id", conn.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update status.", description: error.message, variant: "destructive" });
      return;
    }
    setConn({ ...conn, status });
    toast({ title: "Connection status updated." });
  }

  const name = (uid: string) => names.get(uid) ?? "Unknown";

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!conn) {
    return (
      <div>
        <BackLink />
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Connection not found.</CardContent></Card>
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

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Connection</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buyer: {name(conn.buyer_agent_id)} · Seller: {name(conn.seller_agent_id)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium capitalize ${statusColor[conn.status] || "bg-muted text-muted-foreground"}`}>
          {pretty(conn.status)}
        </span>
      </div>

      <Card className="border-primary/30">
        <CardHeader><CardTitle className="text-base">Admin action</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Connection status</label>
            <div className="flex items-center gap-2">
              <Select value={conn.status} onValueChange={changeStatus}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONNECTION_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{CONNECTION_STATUS_LABELS[s] ?? pretty(s)}</SelectItem>)}
                </SelectContent>
              </Select>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Milestones */}
        <Card>
          <CardHeader><CardTitle className="text-base">Milestones</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {milestones.map(([label, ts]) => (
                <li key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span>{fmtDateTime(ts) ?? <span className="text-xs text-muted-foreground">—</span>}</span>
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
              <dt className="text-muted-foreground">Match score</dt><dd>{match ? Math.round(match.total_score) : "—"}</dd>
              <dt className="text-muted-foreground">Fee agreed</dt><dd>{conn.facilitation_fee_agreed ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Fee amount</dt><dd>{money(conn.facilitation_fee_amount)}</dd>
              <dt className="text-muted-foreground">Fee status</dt><dd className="capitalize">{pretty(conn.facilitation_fee_status)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Messages audit */}
      <Card>
        <CardHeader><CardTitle className="text-base">Messages ({messages.length})</CardTitle></CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages exchanged.</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((m) => (
                <li key={m.id} className="rounded-md border px-3 py-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{name(m.sender_id)}</span>
                    <span>{fmtDateTime(m.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
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
