import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft, MessageSquare, CalendarIcon, AlertTriangle, CheckCircle2, Circle, Pencil, X, CheckCircle, XCircle,
} from "lucide-react";
import { BOOT_STATUS_LABELS, BOOT_STATUS_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import { AgentProfileCard } from "@/components/profile/AgentProfileCard";

const fmt = (v: number | null | undefined) =>
  v != null && v !== 0 ? `$${Math.round(Number(v)).toLocaleString()}` : "—";

function scoreColor(score: number) {
  if (score >= 85) return "bg-green-600";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}

const MILESTONES = [
  { key: "initiated_at", label: "Requested", editable: false, description: "Initial connection request sent." },
  { key: "accepted_at", label: "Accepted", editable: false, description: "Both agents accepted the connection." },
  { key: "under_contract_at", label: "Under Contract", editable: true, description: "Purchase agreement signed." },
  { key: "inspection_complete_at", label: "Inspection Complete", editable: true, description: "Property inspection finished and reviewed." },
  { key: "financing_approved_at", label: "Financing Approved", editable: true, description: "Buyer's financing has cleared." },
  { key: "closed_at", label: "Closed", editable: true, description: "Deal closed and ownership transferred." },
] as const;

type MilestoneKey = typeof MILESTONES[number]["key"];

export default function AgentConnectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [conn, setConn] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [sellerProp, setSellerProp] = useState<any>(null);
  const [sellerFin, setSellerFin] = useState<any>(null);
  const [relinquishedProp, setRelinquishedProp] = useState<any>(null);
  const [relinquishedFin, setRelinquishedFin] = useState<any>(null);
  const [buyerProfile, setBuyerProfile] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);

  const [stageDialog, setStageDialog] = useState<{ open: boolean; key: MilestoneKey | null; mode: "set" | "edit" }>({ open: false, key: null, mode: "set" });
  const [milestoneDate, setMilestoneDate] = useState<Date | undefined>(undefined);
  const [milestoneNote, setMilestoneNote] = useState("");
  const [failOpen, setFailOpen] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (id && user) loadData();
  }, [id, user]);

  const loadData = async () => {
    const { data: connData } = await supabase
      .from("exchange_connections").select("*").eq("id", id!).single();
    if (!connData) { setLoading(false); return; }
    setConn(connData);

    const [matchRes, buyerProfRes, sellerProfRes] = await Promise.all([
      supabase.from("matches").select("*").eq("id", connData.match_id).single(),
      supabase.from("profiles").select("*").eq("id", connData.buyer_agent_id).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", connData.seller_agent_id).maybeSingle(),
    ]);

    setMatch(matchRes.data);
    setBuyerProfile(buyerProfRes.data);
    setSellerProfile(sellerProfRes.data);

    if (matchRes.data) {
      const [sellerPropRes, sellerFinRes] = await Promise.all([
        supabase.from("pledged_properties").select("*").eq("id", matchRes.data.seller_property_id).single(),
        supabase.from("property_financials").select("*").eq("property_id", matchRes.data.seller_property_id).maybeSingle(),
      ]);
      setSellerProp(sellerPropRes.data);
      setSellerFin(sellerFinRes.data);
    }

    // Buyer exchange → relinquished property + client name
    const { data: exchange } = await supabase.from("exchanges").select("*").eq("id", connData.buyer_exchange_id).single();
    if (exchange) {
      const [relPropRes, relFinRes, clientRes] = await Promise.all([
        exchange.relinquished_property_id ? supabase.from("pledged_properties").select("*").eq("id", exchange.relinquished_property_id).single() : Promise.resolve({ data: null }),
        exchange.relinquished_property_id ? supabase.from("property_financials").select("*").eq("property_id", exchange.relinquished_property_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("agent_clients").select("client_name").eq("id", exchange.client_id).single(),
      ]);
      setRelinquishedProp(relPropRes.data);
      setRelinquishedFin(relFinRes.data);
      setClientName(clientRes.data?.client_name || "Client");
    }

    setLoading(false);
  };

  const handleAccept = async () => {
    if (!conn) return;
    setActing(true);
    await supabase.from("exchange_connections").update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      facilitation_fee_agreed: true,
    }).eq("id", conn.id);
    await supabase.from("notifications").insert({
      user_id: conn.buyer_agent_id,
      type: "connection_accepted",
      title: "Connection Accepted",
      message: "Your connection request has been accepted. You can now view agent details and start messaging.",
      link_to: `/agent/connections/${conn.id}`,
    });
    toast({ title: "Connection accepted!", description: "You can now message the other agent." });
    setActing(false);
    loadData();
  };

  const handleDecline = async () => {
    if (!conn) return;
    setActing(true);
    await supabase.from("exchange_connections").update({
      status: "declined",
      declined_at: new Date().toISOString(),
      decline_reason: declineReason || null,
    }).eq("id", conn.id);
    await supabase.from("notifications").insert({
      user_id: conn.buyer_agent_id,
      type: "connection_declined",
      title: "Connection Declined",
      message: "Your connection request was declined.",
      link_to: "/agent/connections",
    });
    toast({ title: "Connection declined." });
    setActing(false);
    setDeclineOpen(false);
    setDeclineReason("");
    loadData();
  };

  const openStageDialog = (key: MilestoneKey, mode: "set" | "edit") => {
    const existing = conn?.[key];
    setStageDialog({ open: true, key, mode });
    setMilestoneDate(existing ? new Date(existing) : new Date());
    setMilestoneNote("");
  };

  const closeStageDialog = () => {
    setStageDialog({ open: false, key: null, mode: "set" });
    setMilestoneDate(undefined);
    setMilestoneNote("");
  };

  const handleSaveStage = async () => {
    if (!stageDialog.key || !milestoneDate || !conn) return;
    setActing(true);
    const stage = MILESTONES.find((m) => m.key === stageDialog.key)!;
    const isoDate = milestoneDate.toISOString();

    const updates: Record<string, any> = { [stage.key]: isoDate };

    // Derive connection status from stage
    if (stage.key === "under_contract_at" && conn.status === "accepted") {
      updates.status = "in_progress";
    }
    if (stage.key === "closed_at") {
      updates.status = "completed";
      updates.facilitation_fee_status = "invoiced";
    }

    await supabase.from("exchange_connections").update(updates).eq("id", conn.id);

    const otherId = conn.buyer_agent_id === user!.id ? conn.seller_agent_id : conn.buyer_agent_id;
    await supabase.from("notifications").insert({
      user_id: otherId,
      type: "connection_milestone",
      title: `${stageDialog.mode === "edit" ? "Updated" : "Reached"}: ${stage.label}`,
      message: `${stage.label} ${stageDialog.mode === "edit" ? "date updated" : "marked complete"} on ${format(milestoneDate, "MMM d, yyyy")}.${milestoneNote ? ` Note: ${milestoneNote}` : ""}`,
      link_to: `/agent/connections/${conn.id}`,
    });

    const timelineEntry = {
      event_type: "connection_milestone",
      description: `${stageDialog.mode === "edit" ? "Updated" : "Completed"}: ${stage.label}${milestoneNote ? ` — ${milestoneNote}` : ""}`,
      actor_id: user!.id,
      metadata: { milestone: stage.key, date: isoDate, note: milestoneNote || null },
    };
    if (conn.buyer_exchange_id) await supabase.from("exchange_timeline").insert({ ...timelineEntry, exchange_id: conn.buyer_exchange_id });
    if (conn.seller_exchange_id) await supabase.from("exchange_timeline").insert({ ...timelineEntry, exchange_id: conn.seller_exchange_id });

    if (stage.key === "closed_at") {
      const dateOnly = isoDate.split("T")[0];
      if (conn.buyer_exchange_id) await supabase.from("exchanges").update({ status: "completed" as any, actual_close_date: dateOnly }).eq("id", conn.buyer_exchange_id);
      if (conn.seller_exchange_id) await supabase.from("exchanges").update({ status: "completed" as any, actual_close_date: dateOnly }).eq("id", conn.seller_exchange_id);
    }

    toast({ title: stageDialog.mode === "edit" ? "Stage updated" : "Stage completed", description: `${stage.label} → ${format(milestoneDate, "MMM d, yyyy")}` });
    closeStageDialog();
    setActing(false);
    loadData();
  };

  const handleClearStage = async (key: MilestoneKey) => {
    if (!conn) return;
    const stage = MILESTONES.find((m) => m.key === key)!;
    if (!confirm(`Clear "${stage.label}" stage? This will reset the date.`)) return;
    setActing(true);
    const updates: Record<string, any> = { [key]: null };
    if (key === "closed_at") updates.status = "in_progress";
    if (key === "under_contract_at") updates.status = "accepted";
    await supabase.from("exchange_connections").update(updates).eq("id", conn.id);

    const timelineEntry = {
      event_type: "connection_milestone",
      description: `Cleared: ${stage.label}`,
      actor_id: user!.id,
      metadata: { milestone: key, cleared: true },
    };
    if (conn.buyer_exchange_id) await supabase.from("exchange_timeline").insert({ ...timelineEntry, exchange_id: conn.buyer_exchange_id });
    if (conn.seller_exchange_id) await supabase.from("exchange_timeline").insert({ ...timelineEntry, exchange_id: conn.seller_exchange_id });

    toast({ title: "Stage cleared", description: `${stage.label} reset.` });
    setActing(false);
    loadData();
  };

  const handleMarkFailed = async () => {
    if (!conn) return;
    setActing(true);
    await supabase.from("exchange_connections").update({
      status: "cancelled",
      failed_at: new Date().toISOString(),
      failure_reason: failReason || null,
    }).eq("id", conn.id);

    const otherId = conn.buyer_agent_id === user!.id ? conn.seller_agent_id : conn.buyer_agent_id;
    await supabase.from("notifications").insert({
      user_id: otherId,
      type: "connection_failed",
      title: "Exchange Connection Failed",
      message: `The exchange connection has been marked as failed.${failReason ? ` Reason: ${failReason}` : ""}`,
      link_to: "/agent/connections",
    });

    toast({ title: "Connection marked as failed." });
    setFailOpen(false);
    setActing(false);
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!conn) return <p className="py-20 text-center text-muted-foreground">Connection not found.</p>;

  const totalScore = match ? Math.round(Number(match.total_score)) : 0;
  const revealed = conn.status === "accepted" || conn.status === "in_progress" || conn.status === "completed";
  const lifecycleActive = conn.status === "accepted" || conn.status === "in_progress";
  const currentStage = [...MILESTONES].reverse().find((m) => conn[m.key]);

  return (
    <div>
      <button onClick={() => navigate("/agent/connections")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Connections
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Exchange Connection</h1>
        <Badge className={conn.status === "accepted" ? "bg-green-600 text-white" : conn.status === "completed" ? "bg-[#39484d] text-white" : ""}>{conn.status}</Badge>
        {match && (
          <>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${scoreColor(totalScore)}`}>{totalScore}</span>
            <Badge className={BOOT_STATUS_COLORS[match.boot_status] || ""}>{BOOT_STATUS_LABELS[match.boot_status] || match.boot_status}</Badge>
          </>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {clientName}'s exchange · Started {format(new Date(conn.initiated_at), "MMM d, yyyy")}
      </p>

      {/* Pending: accept/decline actions */}
      {conn.status === "pending" && (
        <div className="mt-6 rounded-xl border bg-amber-50 border-amber-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">
                {conn.seller_agent_id === user!.id ? "Incoming Connection Request" : "Awaiting Response"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {conn.seller_agent_id === user!.id
                  ? "Review the match and respond to the requesting agent."
                  : "The other agent will be notified. You'll see their response here."}
              </p>
            </div>
            {conn.seller_agent_id === user!.id && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAccept} disabled={acting}>
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" />Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDeclineOpen(true)} disabled={acting}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />Decline
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Profile Cards — revealed only after acceptance */}
      {revealed && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <AgentProfileCard label="Buyer Agent" profile={buyerProfile} />
          <AgentProfileCard label="Seller Agent" profile={sellerProfile} />
        </div>
      )}

      {/* Two-Property Summary */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Buyer's Relinquished Property</h3>
          <div className="mt-3">
            <p className="font-semibold text-foreground">{relinquishedProp?.property_name || relinquishedProp?.address || "—"}</p>
            <p className="text-sm text-muted-foreground">{[relinquishedProp?.city, relinquishedProp?.state].filter(Boolean).join(", ") || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{fmt(relinquishedFin?.asking_price)}</span>
              {relinquishedFin?.cap_rate && <span>{Number(relinquishedFin.cap_rate).toFixed(1)}% cap</span>}
              {relinquishedProp?.units && <span>{relinquishedProp.units} units</span>}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Replacement Property</h3>
          <div className="mt-3">
            <p className="font-semibold text-foreground">{sellerProp?.property_name || sellerProp?.address || "—"}</p>
            <p className="text-sm text-muted-foreground">{[sellerProp?.city, sellerProp?.state].filter(Boolean).join(", ") || "—"}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{fmt(sellerFin?.asking_price)}</span>
              {sellerFin?.cap_rate && <span>{Number(sellerFin.cap_rate).toFixed(1)}% cap</span>}
              {sellerProp?.units && <span>{sellerProp.units} units</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="mt-6 rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-semibold text-foreground">Exchange Progress</h3>
            {currentStage && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Current stage: <span className="font-medium text-foreground">{currentStage.label}</span>
              </p>
            )}
          </div>
          {conn.status === "completed" && (
            <Badge className="bg-green-600 text-white">Deal Closed</Badge>
          )}
          {conn.status === "cancelled" && (
            <Badge variant="destructive">Cancelled</Badge>
          )}
        </div>

        <div className="mt-5 space-y-2">
          {MILESTONES.map((m) => {
            const done = !!conn[m.key];
            const dateVal = conn[m.key] ? format(new Date(conn[m.key]), "MMM d, yyyy") : null;
            return (
              <div key={m.key} className="flex items-start gap-3 rounded-lg border bg-background/50 p-3">
                <div className="mt-0.5">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className={`text-sm ${done ? "font-medium text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                    {dateVal && <span className="text-xs text-muted-foreground">{dateVal}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">{m.description}</p>
                </div>
                {m.editable && lifecycleActive && (
                  <div className="flex items-center gap-1">
                    {done ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openStageDialog(m.key, "edit")} disabled={acting}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleClearStage(m.key)} disabled={acting} title="Clear stage">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => openStageDialog(m.key, "set")} disabled={acting}>
                        Mark Complete
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Special actions */}
        {lifecycleActive && (
          <div className="mt-4 flex gap-2 border-t pt-4">
            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => setFailOpen(true)}>
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Mark as Failed
            </Button>
          </div>
        )}
      </div>

      {/* Conversation link — replaces inline chat */}
      {revealed && (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">Messages</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Chat with the other agent in the full messages view.
              </p>
            </div>
            <Button asChild>
              <Link to={`/agent/messages?connection=${conn.id}`}>
                <MessageSquare className="mr-1.5 h-4 w-4" /> Open conversation
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Decline Dialog */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
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
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDecline} disabled={acting}>
              {acting ? "Declining..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Edit Dialog */}
      <Dialog open={stageDialog.open} onOpenChange={(o) => { if (!o) closeStageDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {stageDialog.mode === "edit" ? "Edit" : "Mark Complete"}: {MILESTONES.find((m) => m.key === stageDialog.key)?.label}
            </DialogTitle>
            <DialogDescription>
              {MILESTONES.find((m) => m.key === stageDialog.key)?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={`w-full justify-start text-left font-normal ${!milestoneDate ? "text-muted-foreground" : ""}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {milestoneDate ? format(milestoneDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={milestoneDate} onSelect={setMilestoneDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Note (optional)</label>
              <Textarea
                value={milestoneNote}
                onChange={(e) => setMilestoneNote(e.target.value)}
                placeholder="Add context for this milestone..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeStageDialog}>Cancel</Button>
            <Button onClick={handleSaveStage} disabled={!milestoneDate || acting}>
              {acting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Failed Dialog */}
      <Dialog open={failOpen} onOpenChange={setFailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Connection as Failed</DialogTitle>
            <DialogDescription>This will close the connection. Please provide a reason.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={failReason}
            onChange={(e) => setFailReason(e.target.value)}
            placeholder="Reason for failure..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleMarkFailed} disabled={acting}>
              {acting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
