import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Link2, ArrowRight, CheckCircle, XCircle, Clock, Building2, User,
} from "lucide-react";
import { BOOT_STATUS_LABELS, BOOT_STATUS_COLORS } from "@/lib/constants";
import { format } from "date-fns";

interface ConnectionRow {
  id: string;
  match_id: string;
  buyer_exchange_id: string;
  seller_exchange_id: string | null;
  buyer_agent_id: string;
  seller_agent_id: string;
  status: string;
  initiated_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  closed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  facilitation_fee_status: string;
  under_contract_at: string | null;
  inspection_complete_at: string | null;
  financing_approved_at: string | null;
  // hydrated
  match?: any;
  sellerProperty?: any;
  sellerFinancials?: any;
  clientName?: string;
  buyerProfile?: any;
  sellerProfile?: any;
}

function scoreColor(score: number) {
  if (score >= 85) return "bg-green-600";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}

function statusBadge(status: string) {
  switch (status) {
    case "pending": return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    case "accepted": return <Badge className="bg-green-600 text-white">Active</Badge>;
    case "completed": return <Badge className="bg-[#39484d] text-white">Completed</Badge>;
    case "declined": return <Badge variant="destructive">Declined</Badge>;
    case "cancelled": return <Badge variant="outline">Cancelled</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

function progressStep(label: string, complete: boolean, idx: number) {
  return (
    <div key={label} className="flex items-center gap-1.5">
      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        {complete ? "✓" : idx + 1}
      </div>
      <span className={`text-xs ${complete ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}

export default function AgentConnections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineTarget, setDeclineTarget] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (user) loadConnections();
  }, [user]);

  const loadConnections = async () => {
    const { data: conns } = await supabase
      .from("exchange_connections")
      .select("*")
      .or(`buyer_agent_id.eq.${user!.id},seller_agent_id.eq.${user!.id}`)
      .order("created_at", { ascending: false });

    if (!conns || conns.length === 0) { setConnections([]); setLoading(false); return; }

    const matchIds = [...new Set(conns.map((c) => c.match_id))];
    const agentIds = [...new Set(conns.flatMap((c) => [c.buyer_agent_id, c.seller_agent_id]))];
    const exchangeIds = [...new Set(conns.map((c) => c.buyer_exchange_id))];

    const [matchRes, profileRes, exchangeRes] = await Promise.all([
      supabase.from("matches").select("id, total_score, boot_status, estimated_total_boot, seller_property_id").in("id", matchIds),
      supabase.from("profiles").select("id, full_name, brokerage_name, email, phone").in("id", agentIds),
      supabase.from("exchanges").select("id, client_id").in("id", exchangeIds),
    ]);

    const matchMap = new Map((matchRes.data ?? []).map((m: any) => [m.id, m]));
    const profileMap = new Map((profileRes.data ?? []).map((p: any) => [p.id, p]));

    // Get client names
    const clientIds = [...new Set((exchangeRes.data ?? []).map((e: any) => e.client_id))];
    const { data: clients } = clientIds.length > 0
      ? await supabase.from("agent_clients").select("id, client_name").in("id", clientIds)
      : { data: [] as any[] };
    const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c.client_name]));
    const exClientMap = new Map((exchangeRes.data ?? []).map((e: any) => [e.id, clientMap.get(e.client_id) || "Client"]));

    // Get seller properties
    const sellerPropIds = [...new Set((matchRes.data ?? []).map((m: any) => m.seller_property_id).filter(Boolean))];
    const [propRes, finRes] = await Promise.all([
      sellerPropIds.length > 0 ? supabase.from("pledged_properties").select("id, property_name, city, state, asset_type").in("id", sellerPropIds) : Promise.resolve({ data: [] }),
      sellerPropIds.length > 0 ? supabase.from("property_financials").select("property_id, asking_price, cap_rate, noi").in("property_id", sellerPropIds) : Promise.resolve({ data: [] }),
    ]);
    const propMap = new Map((propRes.data ?? []).map((p: any) => [p.id, p]));
    const finMap = new Map((finRes.data ?? []).map((f: any) => [f.property_id, f]));

    const hydrated = conns.map((c) => {
      const match = matchMap.get(c.match_id);
      const revealed = c.status === "accepted" || c.status === "completed";
      return {
        ...c,
        match,
        sellerProperty: match ? propMap.get(match.seller_property_id) : null,
        sellerFinancials: match ? finMap.get(match.seller_property_id) : null,
        clientName: exClientMap.get(c.buyer_exchange_id) || "Client",
        buyerProfile: revealed ? profileMap.get(c.buyer_agent_id) : null,
        sellerProfile: revealed ? profileMap.get(c.seller_agent_id) : null,
      } as ConnectionRow;
    });

    setConnections(hydrated);
    setLoading(false);
  };

  const handleAccept = async (connId: string) => {
    setActing(true);
    const conn = connections.find((c) => c.id === connId);
    if (!conn) { setActing(false); return; }

    await supabase.from("exchange_connections").update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      facilitation_fee_agreed: true,
    }).eq("id", connId);

    // Notify buyer agent
    await supabase.from("notifications").insert({
      user_id: conn.buyer_agent_id,
      type: "connection_accepted",
      title: "Connection Accepted",
      message: "Your connection request has been accepted. You can now view agent details and start messaging.",
      link_to: `/agent/connections/${connId}`,
    });

    // Timeline entries
    if (conn.buyer_exchange_id) {
      await supabase.from("exchange_timeline").insert({
        exchange_id: conn.buyer_exchange_id,
        event_type: "connection_accepted",
        description: "Exchange connection accepted",
        actor_id: user!.id,
      });
    }
    if (conn.seller_exchange_id) {
      await supabase.from("exchange_timeline").insert({
        exchange_id: conn.seller_exchange_id,
        event_type: "connection_accepted",
        description: "Exchange connection accepted",
        actor_id: user!.id,
      });
    }

    toast({ title: "Connection accepted!", description: "You can now message the other agent." });
    setActing(false);
    loadConnections();
  };

  const handleDecline = async () => {
    if (!declineTarget) return;
    setActing(true);
    const conn = connections.find((c) => c.id === declineTarget);

    await supabase.from("exchange_connections").update({
      status: "declined",
      declined_at: new Date().toISOString(),
      decline_reason: declineReason || null,
    }).eq("id", declineTarget);

    if (conn) {
      await supabase.from("notifications").insert({
        user_id: conn.buyer_agent_id,
        type: "connection_declined",
        title: "Connection Declined",
        message: "Your connection request was declined.",
        link_to: "/agent/connections",
      });
    }

    toast({ title: "Connection declined." });
    setActing(false);
    setDeclineDialogOpen(false);
    setDeclineTarget(null);
    setDeclineReason("");
    loadConnections();
  };

  const pending = connections.filter((c) => c.status === "pending");
  const active = connections.filter((c) => c.status === "accepted");
  const closed = connections.filter((c) => ["completed", "declined", "cancelled"].includes(c.status));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  const fmt = (v: number | null) => v ? `$${Math.round(Number(v)).toLocaleString()}` : "—";

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Connections</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage exchange connections with other agents.
      </p>

      <Tabs defaultValue="pending" className="mt-6">
        <TabsList>
          <TabsTrigger value="pending">Pending {pending.length > 0 && `(${pending.length})`}</TabsTrigger>
          <TabsTrigger value="active">Active {active.length > 0 && `(${active.length})`}</TabsTrigger>
          <TabsTrigger value="closed">Closed {closed.length > 0 && `(${closed.length})`}</TabsTrigger>
        </TabsList>

        {/* ═══ PENDING ═══ */}
        <TabsContent value="pending">
          {pending.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
              <Clock className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No pending connection requests.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {pending.map((conn) => {
                const isIncoming = conn.seller_agent_id === user!.id;
                const score = conn.match ? Math.round(Number(conn.match.total_score)) : null;
                return (
                  <div
                    key={conn.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/agent/connections/${conn.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(`/agent/connections/${conn.id}`);
                      }
                    }}
                    className="cursor-pointer rounded-xl border bg-card p-5 transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {isIncoming ? "Incoming Request" : "Awaiting Response"}
                          </h3>
                          {statusBadge("pending")}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {conn.sellerProperty?.property_name || "Property"} — {[conn.sellerProperty?.city, conn.sellerProperty?.state].filter(Boolean).join(", ") || "Unknown"}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-sm text-muted-foreground">
                          {conn.sellerFinancials?.asking_price && <span>{fmt(Number(conn.sellerFinancials.asking_price))}</span>}
                          {conn.sellerFinancials?.cap_rate && <><span className="text-border">·</span><span>{Number(conn.sellerFinancials.cap_rate).toFixed(1)}% cap</span></>}
                          {score != null && (
                            <>
                              <span className="text-border">·</span>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white ${scoreColor(score)}`}>{score}</span>
                            </>
                          )}
                          {conn.match?.boot_status && (
                            <Badge className={`text-[10px] ${BOOT_STATUS_COLORS[conn.match.boot_status] || ""}`}>
                              {BOOT_STATUS_LABELS[conn.match.boot_status] || conn.match.boot_status}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {isIncoming
                            ? "An agent wants to connect regarding their client's 1031 exchange."
                            : `Request sent for ${conn.clientName}'s exchange.`}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {format(new Date(conn.initiated_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isIncoming ? (
                          <>
                            <Button size="sm" onClick={() => handleAccept(conn.id)} disabled={acting}>
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />Accept
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setDeclineTarget(conn.id); setDeclineDialogOpen(true); }} disabled={acting}>
                              <XCircle className="mr-1.5 h-3.5 w-3.5" />Decline
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Awaiting response</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ ACTIVE ═══ */}
        <TabsContent value="active">
          {active.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
              <Link2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No active connections.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {active.map((conn) => {
                const score = conn.match ? Math.round(Number(conn.match.total_score)) : null;
                const steps = [
                  { label: "Requested", done: true },
                  { label: "Accepted", done: !!conn.accepted_at },
                  { label: "Under Contract", done: !!conn.under_contract_at },
                  { label: "Inspection", done: !!conn.inspection_complete_at },
                  { label: "Financing", done: !!conn.financing_approved_at },
                  { label: "Closed", done: !!conn.closed_at },
                ];
                return (
                  <div key={conn.id} className="rounded-xl border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {conn.sellerProperty?.property_name || "Property"}
                          </h3>
                          {statusBadge("accepted")}
                          {score != null && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white ${scoreColor(score)}`}>{score}</span>
                          )}
                        </div>

                        {/* Revealed agent names */}
                        <div className="mt-2 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>Buyer: <span className="font-medium text-foreground">{conn.buyerProfile?.full_name || "Agent"}</span></span>
                            {conn.buyerProfile?.brokerage_name && <span className="text-xs">({conn.buyerProfile.brokerage_name})</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            <span>Seller: <span className="font-medium text-foreground">{conn.sellerProfile?.full_name || "Agent"}</span></span>
                            {conn.sellerProfile?.brokerage_name && <span className="text-xs">({conn.sellerProfile.brokerage_name})</span>}
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-3 flex flex-wrap gap-3">
                          {steps.map((s, i) => progressStep(s.label, s.done, i))}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => navigate(`/agent/connections/${conn.id}`)}>
                        View <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══ CLOSED ═══ */}
        <TabsContent value="closed">
          {closed.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
              <Link2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No closed connections.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {closed.map((conn) => (
                <div key={conn.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {conn.sellerProperty?.property_name || "Property"}
                        </span>
                        {statusBadge(conn.status)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {conn.status === "completed" && conn.closed_at && `Completed on ${format(new Date(conn.closed_at), "MMM d, yyyy")}`}
                        {conn.status === "declined" && conn.declined_at && `Declined on ${format(new Date(conn.declined_at), "MMM d, yyyy")}${conn.decline_reason ? ` — ${conn.decline_reason}` : ""}`}
                        {conn.status === "cancelled" && conn.failed_at && `Cancelled on ${format(new Date(conn.failed_at), "MMM d, yyyy")}${conn.failure_reason ? ` — ${conn.failure_reason}` : ""}`}
                      </p>
                    </div>
                    {conn.status === "completed" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        Fee: {conn.facilitation_fee_status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Connection</DialogTitle>
            <DialogDescription>Optionally provide a reason for declining.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason (optional)..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDecline} disabled={acting}>
              {acting ? "Declining..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
