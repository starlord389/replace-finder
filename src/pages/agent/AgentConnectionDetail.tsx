import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ArrowLeft, User, Mail, Phone, Send, CalendarIcon, AlertTriangle,
} from "lucide-react";
import { BOOT_STATUS_LABELS, BOOT_STATUS_COLORS } from "@/lib/constants";
import { format } from "date-fns";

const fmt = (v: number | null | undefined) =>
  v != null && v !== 0 ? `$${Math.round(Number(v)).toLocaleString()}` : "—";

function scoreColor(score: number) {
  if (score >= 85) return "bg-green-600";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}

const MILESTONES = [
  { key: "initiated_at", label: "Requested" },
  { key: "accepted_at", label: "Accepted" },
  { key: "under_contract_at", label: "Under Contract" },
  { key: "inspection_complete_at", label: "Inspection Complete" },
  { key: "financing_approved_at", label: "Financing Approved" },
  { key: "closed_at", label: "Closed" },
] as const;

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
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [milestoneDate, setMilestoneDate] = useState<Date | undefined>(undefined);
  const [failOpen, setFailOpen] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [acting, setActing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && user) loadData();
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    const { data: connData } = await supabase
      .from("exchange_connections").select("*").eq("id", id!).single();
    if (!connData) { setLoading(false); return; }
    setConn(connData);

    const [matchRes, buyerProfRes, sellerProfRes, msgRes] = await Promise.all([
      supabase.from("matches").select("*").eq("id", connData.match_id).single(),
      supabase.from("profiles").select("*").eq("id", connData.buyer_agent_id).single(),
      supabase.from("profiles").select("*").eq("id", connData.seller_agent_id).single(),
      supabase.from("messages").select("*").eq("connection_id", id!).order("created_at", { ascending: true }),
    ]);

    setMatch(matchRes.data);
    setBuyerProfile(buyerProfRes.data);
    setSellerProfile(sellerProfRes.data);
    setMessages(msgRes.data ?? []);

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return;
    setSending(true);
    const { data, error } = await supabase.from("messages").insert({
      connection_id: id,
      sender_id: user.id,
      content: newMessage.trim(),
    }).select().single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setNewMessage("");
    } else {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    }
    setSending(false);
  };

  const nextMilestone = () => {
    if (!conn) return null;
    for (const m of MILESTONES) {
      if (m.key === "initiated_at") continue;
      if (m.key === "accepted_at") continue; // Already accepted
      if (!conn[m.key]) return m;
    }
    return null;
  };

  const handleUpdateProgress = async () => {
    const next = nextMilestone();
    if (!next || !milestoneDate || !conn) return;
    setActing(true);

    const updates: Record<string, any> = {
      [next.key]: milestoneDate.toISOString(),
    };

    if (next.key === "closed_at") {
      updates.status = "completed";
      updates.facilitation_fee_status = "invoiced";
    }

    await supabase.from("exchange_connections").update(updates).eq("id", conn.id);

    // Notify other agent
    const otherId = conn.buyer_agent_id === user!.id ? conn.seller_agent_id : conn.buyer_agent_id;
    await supabase.from("notifications").insert({
      user_id: otherId,
      type: "connection_milestone",
      title: `Exchange Progress: ${next.label}`,
      message: `The exchange connection has been updated to "${next.label}".`,
      link_to: `/agent/connections/${conn.id}`,
    });

    // Timeline entries
    const timelineEntry = { event_type: "connection_milestone", description: `Milestone reached: ${next.label}`, actor_id: user!.id };
    if (conn.buyer_exchange_id) await supabase.from("exchange_timeline").insert({ ...timelineEntry, exchange_id: conn.buyer_exchange_id });
    if (conn.seller_exchange_id) await supabase.from("exchange_timeline").insert({ ...timelineEntry, exchange_id: conn.seller_exchange_id });

    // If closing, update both exchanges
    if (next.key === "closed_at") {
      if (conn.buyer_exchange_id) await supabase.from("exchanges").update({ status: "completed" as any, actual_close_date: milestoneDate.toISOString().split("T")[0] }).eq("id", conn.buyer_exchange_id);
      if (conn.seller_exchange_id) await supabase.from("exchanges").update({ status: "completed" as any, actual_close_date: milestoneDate.toISOString().split("T")[0] }).eq("id", conn.seller_exchange_id);
    }

    toast({ title: "Progress updated!", description: `${next.label} milestone set.` });
    setProgressOpen(false);
    setMilestoneDate(undefined);
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
  const revealed = conn.status === "accepted" || conn.status === "completed";
  const next = nextMilestone();

  return (
    <div>
      <button onClick={() => navigate("/agent/connections")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Connections
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Exchange Connection</h1>
        <Badge className={conn.status === "accepted" ? "bg-green-600 text-white" : conn.status === "completed" ? "bg-blue-600 text-white" : ""}>{conn.status}</Badge>
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

      {/* Agent Contact Cards — revealed only after acceptance */}
      {revealed && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[{ label: "Buyer Agent", profile: buyerProfile }, { label: "Seller Agent", profile: sellerProfile }].map(({ label, profile }) => (
            <div key={label} className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{label}</h3>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{profile?.full_name || "—"}</span>
                </div>
                {profile?.brokerage_name && (
                  <p className="text-sm text-muted-foreground pl-6">{profile.brokerage_name}</p>
                )}
                {profile?.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${profile.email}`} className="text-primary hover:underline">{profile.email}</a>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${profile.phone}`} className="text-primary hover:underline">{profile.phone}</a>
                  </div>
                )}
              </div>
            </div>
          ))}
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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Exchange Progress</h3>
          {conn.status === "accepted" && next && (
            <Button size="sm" onClick={() => setProgressOpen(true)}>
              Update Progress
            </Button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {MILESTONES.map((m, i) => {
            const done = !!conn[m.key];
            return (
              <div key={m.key} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <div>
                  <p className={`text-sm ${done ? "font-medium text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                  {done && conn[m.key] && (
                    <p className="text-[10px] text-muted-foreground">{format(new Date(conn[m.key]), "MMM d")}</p>
                  )}
                </div>
                {i < MILESTONES.length - 1 && <div className={`hidden sm:block h-px w-6 ${done ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {/* Special actions */}
        {conn.status === "accepted" && (
          <div className="mt-4 flex gap-2 border-t pt-4">
            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => setFailOpen(true)}>
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Mark as Failed
            </Button>
          </div>
        )}
      </div>

      {/* Messaging Section */}
      {revealed && (
        <div className="mt-6 rounded-xl border bg-card">
          <div className="border-b px-5 py-3">
            <h3 className="font-semibold text-foreground">Messages</h3>
          </div>
          <div className="max-h-80 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_id === user!.id;
              const senderName = msg.sender_id === conn.buyer_agent_id
                ? buyerProfile?.full_name
                : sellerProfile?.full_name;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <p className={`text-xs font-medium ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{senderName || "Agent"}</p>
                    <p className="text-sm mt-0.5">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}>
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="min-h-[40px] resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            />
            <Button size="icon" onClick={handleSendMessage} disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Update Progress Dialog */}
      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Progress: {next?.label}</DialogTitle>
            <DialogDescription>Set the date for this milestone.</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateProgress} disabled={!milestoneDate || acting}>
              {acting ? "Updating..." : "Confirm"}
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
