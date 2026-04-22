import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/telemetry";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Building2, Camera, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, X, Info, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS, SCORE_DIMENSIONS,
  BOOT_STATUS_LABELS, BOOT_STATUS_COLORS,
} from "@/lib/constants";
import type { Enums } from "@/integrations/supabase/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
  v != null && v !== 0 ? `$${Math.round(Number(v)).toLocaleString()}` : "—";
const pct = (v: number | null | undefined, d = 1) =>
  v != null ? `${Number(v).toFixed(d)}%` : "—";
const num = (v: number | null | undefined) =>
  v != null ? Number(v).toLocaleString() : "—";

function scoreColor(score: number) {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-amber-500";
  return "bg-red-500";
}
function scoreTextColor(score: number) {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-500";
}

function metricHealthDot(value: number, thresholds: [number, number], invert = false) {
  const [low, high] = thresholds;
  if (invert) return value <= low ? "bg-green-500" : value <= high ? "bg-amber-500" : "bg-red-500";
  return value >= high ? "bg-green-500" : value >= low ? "bg-amber-500" : "bg-red-500";
}

type DeltaDir = "up" | "down" | "same" | null;
function calcDelta(yours: number | null | undefined, theirs: number | null | undefined): { pct: number | null; dir: DeltaDir } {
  if (yours == null || theirs == null || yours === 0) return { pct: null, dir: null };
  const d = ((Number(theirs) - Number(yours)) / Math.abs(Number(yours))) * 100;
  return { pct: d, dir: Math.abs(d) < 0.05 ? "same" : d > 0 ? "up" : "down" };
}
function absDeltaPct(yours: number | null | undefined, theirs: number | null | undefined): { abs: number | null; dir: DeltaDir; text?: string } {
  if (yours == null || theirs == null) return { abs: null, dir: null };
  const d = Number(theirs) - Number(yours);
  return { abs: d, dir: Math.abs(d) < 0.05 ? "same" : d > 0 ? "up" : "down", text: `${d > 0 ? "+" : ""}${d.toFixed(1)}%` };
}
function yearDelta(yours: number | null | undefined, theirs: number | null | undefined): { abs: number | null; dir: DeltaDir; text?: string } {
  if (yours == null || theirs == null) return { abs: null, dir: null };
  const d = Number(theirs) - Number(yours);
  if (d === 0) return { abs: 0, dir: "same" };
  return { abs: d, dir: d > 0 ? "up" : "down", text: d > 0 ? `${d} yrs newer` : `${Math.abs(d)} yrs older` };
}

// ── Main Component ──────────────────────────────────────

export default function AgentMatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [match, setMatch] = useState<any>(null);
  const [sellerProp, setSellerProp] = useState<any>(null);
  const [sellerFin, setSellerFin] = useState<any>(null);
  const [sellerImages, setSellerImages] = useState<any[]>([]);
  const [buyerExchange, setBuyerExchange] = useState<any>(null);
  const [criteria, setCriteria] = useState<any>(null);
  const [relinquishedProp, setRelinquishedProp] = useState<any>(null);
  const [relinquishedFin, setRelinquishedFin] = useState<any>(null);
  const [relinquishedCover, setRelinquishedCover] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [detailedOpen, setDetailedOpen] = useState(false);

  // Connection state
  const [connectionState, setConnectionState] = useState<"none" | "pending" | "accepted" | "declined">("none");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [feeAgreed, setFeeAgreed] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const viewTracked = useRef(false);
  const headerRef = useRef<HTMLDivElement>(null);

  // Sticky bar observer
  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new IntersectionObserver(([e]) => setShowStickyBar(!e.isIntersecting), { threshold: 0 });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => { if (id && user) loadData(); }, [id, user]);

  // View tracking
  useEffect(() => {
    if (!match || viewTracked.current || !user) return;
    if (match.buyer_agent_viewed) { viewTracked.current = true; return; }
    // Check if current user is the buyer agent
    if (!buyerExchange || buyerExchange.agent_id !== user.id) return;
    viewTracked.current = true;
    supabase.from("matches").update({ buyer_agent_viewed: true, buyer_agent_viewed_at: new Date().toISOString() }).eq("id", match.id).then(() => {
      setMatch((prev: any) => prev ? { ...prev, buyer_agent_viewed: true } : prev);
    });
  }, [match, buyerExchange, user]);

  const loadData = async () => {
    // 1. Fetch match
    const { data: matchData, error: matchErr } = await supabase
      .from("matches").select("*").eq("id", id!).single();
    if (matchErr || !matchData) { setLoading(false); return; }
    setMatch(matchData);

    // 2. Verify access & fetch all data
    const [sellerPropRes, sellerFinRes, sellerImgRes, exchangeRes] = await Promise.all([
      supabase.from("pledged_properties").select("*").eq("id", matchData.seller_property_id).single(),
      supabase.from("property_financials").select("*").eq("property_id", matchData.seller_property_id).maybeSingle(),
      supabase.from("property_images").select("*").eq("property_id", matchData.seller_property_id).order("sort_order"),
      supabase.from("exchanges").select("*").eq("id", matchData.buyer_exchange_id).single(),
    ]);

    setSellerProp(sellerPropRes.data);
    setSellerFin(sellerFinRes.data);
    setSellerImages(sellerImgRes.data ?? []);
    setBuyerExchange(exchangeRes.data);

    if (exchangeRes.data) {
      const ex = exchangeRes.data;
      const [criteriaRes, relPropRes, clientRes] = await Promise.all([
        ex.criteria_id ? supabase.from("replacement_criteria").select("*").eq("id", ex.criteria_id).single() : Promise.resolve({ data: null }),
        ex.relinquished_property_id ? supabase.from("pledged_properties").select("*").eq("id", ex.relinquished_property_id).single() : Promise.resolve({ data: null }),
        supabase.from("agent_clients").select("client_name").eq("id", ex.client_id).single(),
      ]);
      setCriteria(criteriaRes.data);
      setRelinquishedProp(relPropRes.data);
      setClientName(clientRes.data?.client_name || "Client");

      // Fetch relinquished property financials
      if (relPropRes.data) {
        const { data: relFinData } = await supabase.from("property_financials").select("*").eq("property_id", relPropRes.data.id).maybeSingle();
        setRelinquishedFin(relFinData);
      }
    }

    setLoading(false);
  };

  // ── Computed metrics ──
  const metrics = useMemo(() => {
    if (!sellerFin) return null;
    const price = sellerFin.asking_price ? Number(sellerFin.asking_price) : null;
    const noi = sellerFin.noi ? Number(sellerFin.noi) : null;
    const occ = sellerFin.occupancy_rate ? Number(sellerFin.occupancy_rate) : null;
    const units = sellerProp?.units;
    const sf = sellerProp?.building_square_footage ? Number(sellerProp.building_square_footage) : null;
    const loanAmt = sellerFin.loan_balance ? Number(sellerFin.loan_balance) : null;
    const loanRate = sellerFin.loan_rate ? Number(sellerFin.loan_rate) : null;
    const debtSvc = sellerFin.annual_debt_service ? Number(sellerFin.annual_debt_service) : (loanAmt && loanRate ? loanAmt * loanRate / 100 : null);
    const equity = price && loanAmt ? price - loanAmt : null;
    const revenue = sellerFin.gross_scheduled_income ? Number(sellerFin.gross_scheduled_income) : sellerFin.effective_gross_income ? Number(sellerFin.effective_gross_income) : null;
    const expenses = [sellerFin.real_estate_taxes, sellerFin.insurance, sellerFin.utilities, sellerFin.management_fee, sellerFin.maintenance_repairs, sellerFin.capex_reserves, sellerFin.other_expenses]
      .filter(Boolean).reduce((s, v) => s + Number(v), 0) || null;

    const capRate = noi && price ? (noi / price) * 100 : sellerFin.cap_rate ? Number(sellerFin.cap_rate) : null;
    const grm = revenue && price ? price / revenue : null;
    const expenseRatio = expenses && revenue ? (expenses / revenue) * 100 : null;
    const noiPerUnit = noi && units ? noi / units : null;
    const pricePerUnit = price && units ? price / units : null;
    const noiPerSf = noi && sf ? noi / sf : null;
    const pricePerSf = price && sf ? price / sf : null;
    const breakEvenOcc = expenses && revenue ? (expenses / revenue) * 100 : null;
    const dscr = noi && debtSvc ? noi / debtSvc : null;
    const coc = noi && debtSvc && equity && equity > 0 ? ((noi - debtSvc) / equity) * 100 : sellerFin.cash_on_cash ? Number(sellerFin.cash_on_cash) : null;
    const preTaxCashFlow = noi && debtSvc ? noi - debtSvc : null;
    const gsi = sellerFin.gross_scheduled_income ? Number(sellerFin.gross_scheduled_income) : null;
    const egi = sellerFin.effective_gross_income ? Number(sellerFin.effective_gross_income) : null;
    const vacRate = sellerFin.vacancy_rate ? Number(sellerFin.vacancy_rate) : null;

    return { capRate, grm, expenseRatio, noiPerUnit, pricePerUnit, noiPerSf, pricePerSf, breakEvenOcc, dscr, coc, preTaxCashFlow, debtSvc, equity, price, noi, revenue, expenses, occ, loanAmt, loanRate, gsi, egi, vacRate };
  }, [sellerFin, sellerProp]);

  // Relinquished property metrics
  const reqMetrics = useMemo(() => {
    if (!relinquishedProp) return null;
    const fin = relinquishedFin;
    const price = fin?.asking_price ? Number(fin.asking_price) : null;
    const noi = fin?.noi ? Number(fin.noi) : null;
    const capRate = fin?.cap_rate ? Number(fin.cap_rate) : (noi && price ? (noi / price) * 100 : null);
    const occ = fin?.occupancy_rate ? Number(fin.occupancy_rate) : null;
    const units = relinquishedProp.units ?? null;
    const sf = relinquishedProp.building_square_footage ? Number(relinquishedProp.building_square_footage) : null;
    const pricePerUnit = price && units ? price / units : null;
    const noiPerUnit = noi && units ? noi / units : null;
    const loanBal = fin?.loan_balance ? Number(fin.loan_balance) : null;
    const equity = price && loanBal ? price - loanBal : buyerExchange?.estimated_equity ? Number(buyerExchange.estimated_equity) : null;
    const proceeds = buyerExchange?.exchange_proceeds ? Number(buyerExchange.exchange_proceeds) : null;
    const debtSvc = fin?.annual_debt_service ? Number(fin.annual_debt_service) : null;
    const gsi = fin?.gross_scheduled_income ? Number(fin.gross_scheduled_income) : null;
    const egi = fin?.effective_gross_income ? Number(fin.effective_gross_income) : null;
    const expenses = fin ? [fin.real_estate_taxes, fin.insurance, fin.utilities, fin.management_fee, fin.maintenance_repairs, fin.capex_reserves, fin.other_expenses]
      .filter(Boolean).reduce((s, v) => s + Number(v), 0) || null : null;
    const revenue = gsi || egi || null;
    const expenseRatio = expenses && revenue ? (expenses / revenue) * 100 : null;

    return { price, noi, capRate, occ, units, sf, pricePerUnit, noiPerUnit, equity, proceeds, debtSvc, loanBal, gsi, egi, expenses, revenue, expenseRatio };
  }, [relinquishedProp, relinquishedFin, buyerExchange]);

  const imgUrls = sellerImages.map((img) => resolvePropertyImageUrl(img.storage_path));

  // Check existing connection state
  useEffect(() => {
    if (!match || !user) return;
    supabase
      .from("exchange_connections")
      .select("id, status")
      .eq("match_id", match.id)
      .or(`buyer_agent_id.eq.${user.id},seller_agent_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const conn = data[0];
          setConnectionId(conn.id);
          if (conn.status === "pending") setConnectionState("pending");
          else if (conn.status === "accepted" || conn.status === "completed") setConnectionState("accepted");
          else if (conn.status === "declined") setConnectionState("declined");
        }
      });
  }, [match, user]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!match || !sellerProp) return <p className="py-20 text-center text-muted-foreground">Match not found or access denied.</p>;

  const totalScore = Math.round(Number(match.total_score));
  const contextText = `Match for: ${clientName}'s ${[relinquishedProp?.city, relinquishedProp?.state].filter(Boolean).join(", ") || ""} exchange`;

  const handleStartExchange = () => {
    if (connectionState === "accepted" && connectionId) {
      navigate(`/agent/connections/${connectionId}`);
      return;
    }
    setModalOpen(true);
  };

  const handleSendRequest = async () => {
    if (!match || !user || !sellerProp) return;
    setSubmitting(true);
    try {
      const sellerAgentId = sellerProp.agent_id;
      const sellerExchangeId = sellerProp.exchange_id || null;

      const { data: connData, error: connErr } = await supabase
        .from("exchange_connections")
        .insert({
          match_id: match.id,
          buyer_exchange_id: match.buyer_exchange_id,
          seller_exchange_id: sellerExchangeId,
          buyer_agent_id: user.id,
          seller_agent_id: sellerAgentId,
          initiated_by: "buyer_agent",
          status: "pending",
          facilitation_fee_agreed: true,
        })
        .select("id")
        .single();

      if (connErr) throw connErr;

      // Insert notification for seller agent
      await supabase.from("notifications").insert({
        user_id: sellerAgentId,
        type: "connection_request",
        title: "New Connection Request",
        message: `An agent wants to connect on your property ${sellerProp.property_name || "listing"} for their client's 1031 exchange.`,
        link_to: "/agent/connections",
      });

      // Insert timeline entry
      await supabase.from("exchange_timeline").insert({
        exchange_id: match.buyer_exchange_id,
        event_type: "connection_initiated",
        description: `Connection requested for ${sellerProp.property_name || "a replacement property"}`,
        actor_id: user.id,
      });

      setConnectionState("pending");
      setConnectionId(connData.id);
      setModalOpen(false);
      trackEvent("connection_initiated", { matchId: match.id, connectionId: connData.id });
      toast({ title: "Request sent!", description: "You'll be notified when they respond." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* ═══ Context Banner ═══ */}
      <button
        onClick={() => navigate("/agent/matches")}
        className="mb-4 -mx-6 block w-[calc(100%+3rem)] border-b bg-muted/50 px-6 py-2 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-1.5 inline h-3 w-3" />{contextText}
      </button>

      {/* ═══ Sticky Action Bar ═══ */}
      {showStickyBar && (
        <div className="sticky top-0 z-30 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <p className="font-semibold text-foreground truncate">{sellerProp.property_name || "Property"}</p>
              <span className="text-sm text-muted-foreground">{fmt(sellerFin?.asking_price)}</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white ${scoreColor(totalScore)}`}>
                {totalScore}
              </span>
              <Badge className={`text-[10px] ${BOOT_STATUS_COLORS[match.boot_status] || ""}`}>
                {BOOT_STATUS_LABELS[match.boot_status] || match.boot_status}
              </Badge>
            </div>
            {connectionState === "none" && <Button onClick={handleStartExchange} size="sm">Start Exchange</Button>}
            {connectionState === "pending" && <Button size="sm" variant="secondary" disabled>Request Sent</Button>}
            {connectionState === "accepted" && <Button size="sm" variant="default" onClick={() => navigate(`/agent/connections/${connectionId}`)}>Connected — View</Button>}
            {connectionState === "declined" && <Button size="sm" onClick={handleStartExchange}>Request Again</Button>}
          </div>
        </div>
      )}

      <button onClick={() => navigate("/agent/matches")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Matches
      </button>

      {/* ═══ SECTION 1: PROPERTY HERO ═══ */}
      {imgUrls.length > 0 ? (
        <div className="relative rounded-xl overflow-hidden">
          <div className={`grid gap-1 ${imgUrls.length === 1 ? "" : imgUrls.length <= 3 ? "grid-cols-2" : "grid-cols-4 grid-rows-2"}`} style={{ maxHeight: 420 }}>
            <div className={`overflow-hidden ${imgUrls.length > 3 ? "col-span-2 row-span-2" : imgUrls.length > 1 ? "row-span-1" : ""}`}>
              <img src={imgUrls[0]} alt="Primary" className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105" style={{ maxHeight: 420 }} onClick={() => { setLightboxIdx(0); setLightboxOpen(true); }} />
            </div>
            {imgUrls.slice(1, 5).map((url, i) => (
              <div key={i} className="overflow-hidden hidden sm:block">
                <img src={url} alt={`Photo ${i + 2}`} className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105" style={{ maxHeight: imgUrls.length > 3 ? 208 : 420 }} onClick={() => { setLightboxIdx(i + 1); setLightboxOpen(true); }} />
              </div>
            ))}
          </div>
          <button onClick={() => { setLightboxIdx(0); setLightboxOpen(true); }} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-sm font-medium text-white hover:bg-black/80">
            <Camera className="h-4 w-4" /> View all {sellerImages.length} photos
          </button>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-xl bg-muted">
          <Building2 className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightboxOpen(false)}>
          <button className="absolute right-4 top-4 text-white hover:text-white/80"><X className="h-8 w-8" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + imgUrls.length) % imgUrls.length); }}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <img src={imgUrls[lightboxIdx]} alt="" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30" onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % imgUrls.length); }}>
            <ArrowLeft className="h-6 w-6 rotate-180" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">{lightboxIdx + 1} / {imgUrls.length}</p>
        </div>
      )}

      {/* Property Header */}
      <div ref={headerRef} className="mt-6 rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{sellerProp.property_name || sellerProp.address || "Replacement Property"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[sellerProp.address, sellerProp.city, sellerProp.state, sellerProp.zip].filter(Boolean).join(", ") || "—"}</span>
              {sellerProp.asset_type && <Badge variant="secondary" className="text-xs">{ASSET_TYPE_LABELS[sellerProp.asset_type as Enums<"asset_type">]}</Badge>}
              {sellerProp.strategy_type && <Badge variant="outline" className="text-xs">{STRATEGY_TYPE_LABELS[sellerProp.strategy_type as Enums<"strategy_type">]}</Badge>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-2xl font-bold text-primary">{fmt(sellerFin?.asking_price)}</span>
              {metrics?.capRate != null && <StatPill label="Cap Rate" value={`${metrics.capRate.toFixed(1)}%`} />}
              {metrics?.noi != null && <StatPill label="NOI" value={fmt(metrics.noi)} />}
              {sellerProp.units && <StatPill label="Units" value={String(sellerProp.units)} />}
              {sellerProp.building_square_footage && !sellerProp.units && <StatPill label="SF" value={num(sellerProp.building_square_footage)} />}
              {sellerProp.year_built && <StatPill label="Built" value={String(sellerProp.year_built)} />}
              {metrics?.occ != null && <StatPill label="Occupancy" value={`${Number(metrics.occ).toFixed(1)}%`} />}
            </div>
            {/* Agent identity hidden */}
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Listed by a verified agent in the ExchangeUp network</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-white font-bold ${scoreColor(totalScore)}`}>
              Match Score: {totalScore}/100
            </div>
            <Badge className={BOOT_STATUS_COLORS[match.boot_status] || "bg-muted text-muted-foreground"}>
              {BOOT_STATUS_LABELS[match.boot_status] || match.boot_status}
              {match.estimated_total_boot ? ` · ${fmt(match.estimated_total_boot)}` : ""}
            </Badge>
            {connectionState === "none" && <Button onClick={handleStartExchange} className="gap-1.5">Start Exchange</Button>}
            {connectionState === "pending" && <Button variant="secondary" disabled className="gap-1.5">Request Sent — Awaiting Response</Button>}
            {connectionState === "accepted" && <Button onClick={() => navigate(`/agent/connections/${connectionId}`)} className="gap-1.5 bg-green-600 hover:bg-green-700">Connected — View Connection</Button>}
            {connectionState === "declined" && <Button onClick={handleStartExchange} className="gap-1.5">Request Again</Button>}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 2: EXCHANGE COMPARISON ═══ */}
      {relinquishedProp && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Exchange Comparison</h2>
          <p className="mt-1 text-sm text-muted-foreground">How this property compares to the one being exchanged.</p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Metric</th>
                  <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Your Property</th>
                  <th className="pb-2 text-center text-xs font-medium text-muted-foreground w-28">Change</th>
                  <th className="pb-2 text-right text-xs font-medium text-muted-foreground">This Property</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <CompRow label="Est. Value / Asking Price" yours={fmt(reqMetrics?.price)} theirs={fmt(metrics?.price)} delta={calcDelta(reqMetrics?.price, metrics?.price)} positive="neutral" />
                <CompRow label="Net Operating Income" yours={fmt(reqMetrics?.noi)} theirs={fmt(metrics?.noi)} delta={calcDelta(reqMetrics?.noi, metrics?.noi)} positive="up" />
                <CompRow label="Cap Rate" yours={pct(reqMetrics?.capRate)} theirs={pct(metrics?.capRate)} delta={absDeltaPct(reqMetrics?.capRate, metrics?.capRate)} positive="up" />
                <CompRow label={sellerProp.units ? "Units" : "Square Footage"} yours={sellerProp.units ? num(reqMetrics?.units) : num(reqMetrics?.sf)} theirs={sellerProp.units ? num(sellerProp.units) : num(sellerProp.building_square_footage)} delta={calcDelta(reqMetrics?.units ?? reqMetrics?.sf, sellerProp.units ?? sellerProp.building_square_footage)} positive="up" />
                <CompRow label="Year Built" yours={relinquishedProp.year_built ? String(relinquishedProp.year_built) : "—"} theirs={sellerProp.year_built ? String(sellerProp.year_built) : "—"} delta={yearDelta(relinquishedProp.year_built, sellerProp.year_built)} positive="up" />
                <CompRow label="Occupancy" yours={pct(reqMetrics?.occ)} theirs={pct(metrics?.occ)} delta={absDeltaPct(reqMetrics?.occ, metrics?.occ)} positive="up" />
                <CompRow label="Asset Type" yours={relinquishedProp.asset_type ? ASSET_TYPE_LABELS[relinquishedProp.asset_type as Enums<"asset_type">] || "—" : "—"} theirs={sellerProp.asset_type ? ASSET_TYPE_LABELS[sellerProp.asset_type as Enums<"asset_type">] : "—"} />
                <CompRow label="Strategy" yours={relinquishedProp.strategy_type ? STRATEGY_TYPE_LABELS[relinquishedProp.strategy_type as Enums<"strategy_type">] || "—" : "—"} theirs={sellerProp.strategy_type ? STRATEGY_TYPE_LABELS[sellerProp.strategy_type as Enums<"strategy_type">] : "—"} />
                {(reqMetrics?.pricePerUnit != null || metrics?.pricePerUnit != null) && (
                  <CompRow label="Price / Unit" yours={fmt(reqMetrics?.pricePerUnit)} theirs={fmt(metrics?.pricePerUnit)} delta={calcDelta(reqMetrics?.pricePerUnit, metrics?.pricePerUnit)} positive="down" />
                )}
                {(reqMetrics?.noiPerUnit != null || metrics?.noiPerUnit != null) && (
                  <CompRow label="NOI / Unit" yours={fmt(reqMetrics?.noiPerUnit)} theirs={fmt(metrics?.noiPerUnit)} delta={calcDelta(reqMetrics?.noiPerUnit, metrics?.noiPerUnit)} positive="up" />
                )}
              </tbody>
            </table>
          </div>

          {/* Position Cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <PositionCard
              label="Equity Position"
              content={(() => {
                const equity = reqMetrics?.equity ?? reqMetrics?.proceeds;
                const price = metrics?.price;
                const replacementDebt = metrics?.loanAmt;
                if (equity == null || price == null) return { text: "Not enough data", color: "muted" as const };
                const equityNeeded = replacementDebt ? price - replacementDebt : price;
                const gap = equity - equityNeeded;
                return { text: `Your equity: ${fmt(equity)} → Needed: ${fmt(equityNeeded)}`, badge: gap >= 0 ? "Covered" : `Gap: ${fmt(Math.abs(gap))}`, color: gap >= 0 ? "green" as const : "amber" as const };
              })()}
            />
            <PositionCard
              label="Cash Flow Shift"
              content={(() => {
                const yourNoi = reqMetrics?.noi;
                const theirNoi = metrics?.noi;
                if (yourNoi == null || theirNoi == null) return { text: "NOI data not available", color: "muted" as const };
                const diff = theirNoi - yourNoi;
                const pctChange = (diff / Math.abs(yourNoi)) * 100;
                return { text: `NOI change: ${diff >= 0 ? "+" : ""}${fmt(diff)} (${diff >= 0 ? "+" : ""}${pctChange.toFixed(1)}%)`, color: diff >= 0 ? "green" as const : "red" as const };
              })()}
            />
            <PositionCard
              label="Scale Change"
              content={(() => {
                const yourUnits = reqMetrics?.units;
                const theirUnits = sellerProp.units;
                const yourSf = reqMetrics?.sf;
                const theirSf = sellerProp.building_square_footage;
                if (yourUnits && theirUnits) return { text: `${yourUnits} units → ${theirUnits} units`, color: (theirUnits >= yourUnits ? "green" : "amber") as "green" | "amber" };
                if (yourSf && theirSf) return { text: `${num(yourSf)} SF → ${num(theirSf)} SF`, color: (theirSf >= yourSf ? "green" : "amber") as "green" | "amber" };
                return { text: "Scale data not available", color: "muted" as const };
              })()}
            />
          </div>
        </div>
      )}

      {/* ═══ SECTION 3: BOOT ANALYSIS ═══ */}
      <div className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Boot Analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground mb-5">Tax exposure from this exchange.</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Estimated Cash Boot</p>
            <p className="mt-1 text-lg font-bold text-foreground">{match.estimated_cash_boot ? fmt(match.estimated_cash_boot) : "None"}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Estimated Mortgage Boot</p>
            <p className="mt-1 text-lg font-bold text-foreground">{match.estimated_mortgage_boot ? fmt(match.estimated_mortgage_boot) : "None"}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Total Boot Exposure</p>
            <p className={`mt-1 text-lg font-bold ${match.estimated_total_boot && Number(match.estimated_total_boot) > 0 ? "text-red-600" : "text-green-600"}`}>
              {match.estimated_total_boot ? fmt(match.estimated_total_boot) : "$0"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-xs text-muted-foreground">Estimated Tax on Boot</p>
            <p className="mt-1 text-lg font-bold text-foreground">{match.estimated_boot_tax ? fmt(match.estimated_boot_tax) : "$0"}</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2">
          <Badge className={`shrink-0 ${BOOT_STATUS_COLORS[match.boot_status] || "bg-muted text-muted-foreground"}`}>
            {BOOT_STATUS_LABELS[match.boot_status] || match.boot_status}
          </Badge>
        </div>

        <div className="mt-4 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Boot is the taxable portion of your exchange. To avoid boot, the replacement property must be of equal or greater value, and you must replace your existing debt.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 4: DETAILED FINANCIAL COMPARISON (Collapsible) ═══ */}
      {relinquishedProp && metrics && (
        <div className="mt-6">
          <Collapsible open={detailedOpen} onOpenChange={setDetailedOpen}>
            <div className="rounded-xl border bg-card overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Detailed Financial Comparison</h2>
                    <p className="text-sm text-muted-foreground">Deep dive into the financial impact of this exchange.</p>
                  </div>
                  {detailedOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t px-5 pb-6 pt-5 space-y-8">
                  {/* Operating Income Comparison */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Operating Income Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Line Item</th>
                            <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Your Property</th>
                            <th className="pb-2 text-right text-xs font-medium text-muted-foreground">This Property</th>
                            <th className="pb-2 text-right text-xs font-medium text-muted-foreground w-20">Change</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <OpRow label="Gross Revenue" yours={reqMetrics?.gsi ?? reqMetrics?.revenue} theirs={metrics?.gsi ?? metrics?.revenue} bold />
                          <OpRow label="Effective Gross Income" yours={reqMetrics?.egi} theirs={metrics?.egi} />
                          <OpRow label="Operating Expenses" yours={reqMetrics?.expenses} theirs={metrics?.expenses} bold invert />
                          <OpRow label="  Taxes" yours={relinquishedFin?.real_estate_taxes} theirs={sellerFin?.real_estate_taxes} indent invert />
                          <OpRow label="  Insurance" yours={relinquishedFin?.insurance} theirs={sellerFin?.insurance} indent invert />
                          <OpRow label="  Utilities" yours={relinquishedFin?.utilities} theirs={sellerFin?.utilities} indent invert />
                          <OpRow label="  Management" yours={relinquishedFin?.management_fee} theirs={sellerFin?.management_fee} indent invert />
                          <OpRow label="  Maintenance" yours={relinquishedFin?.maintenance_repairs} theirs={sellerFin?.maintenance_repairs} indent invert />
                          <OpRow label="  CapEx Reserves" yours={relinquishedFin?.capex_reserves} theirs={sellerFin?.capex_reserves} indent invert />
                          <OpRow label="  Other" yours={relinquishedFin?.other_expenses} theirs={sellerFin?.other_expenses} indent invert />
                          <OpRow label="Net Operating Income" yours={reqMetrics?.noi} theirs={metrics?.noi} bold highlight />
                          <OpRow label="Debt Service" yours={reqMetrics?.debtSvc} theirs={metrics?.debtSvc} invert />
                          <OpRow label="Pre-Tax Cash Flow" yours={reqMetrics?.noi != null && reqMetrics?.debtSvc != null ? reqMetrics.noi - reqMetrics.debtSvc : null} theirs={metrics?.preTaxCashFlow} bold highlight />
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Exchange Economics */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Exchange Economics</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <EconItem label="Exchange Proceeds" value={fmt(reqMetrics?.proceeds)} />
                      <EconItem label="Estimated Equity" value={fmt(reqMetrics?.equity)} />
                      <EconItem label="Replacement Property Price" value={fmt(metrics?.price)} />
                      <EconItem label="Equity Required" value={fmt(metrics?.price && metrics?.loanAmt ? metrics.price - metrics.loanAmt : metrics?.price)} />
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {reqMetrics?.noi != null && metrics?.noi != null && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">NOI Comparison</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={[
                            { name: "Your Property", value: reqMetrics.noi },
                            { name: "This Property", value: metrics.noi },
                          ]} margin={{ left: 20, right: 20 }}>
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} fontSize={11} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              <Cell fill="hsl(215 20% 65%)" />
                              <Cell fill="hsl(221 83% 53%)" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {metrics?.noi != null && metrics?.expenses != null && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue Breakdown</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "NOI", value: metrics.noi },
                                ...(sellerFin?.real_estate_taxes ? [{ name: "Taxes", value: Number(sellerFin.real_estate_taxes) }] : []),
                                ...(sellerFin?.insurance ? [{ name: "Insurance", value: Number(sellerFin.insurance) }] : []),
                                ...(sellerFin?.management_fee ? [{ name: "Management", value: Number(sellerFin.management_fee) }] : []),
                                ...(sellerFin?.maintenance_repairs ? [{ name: "Maintenance", value: Number(sellerFin.maintenance_repairs) }] : []),
                                ...(sellerFin?.utilities ? [{ name: "Utilities", value: Number(sellerFin.utilities) }] : []),
                                ...((sellerFin?.capex_reserves || sellerFin?.other_expenses) ? [{ name: "Other", value: Number(sellerFin?.capex_reserves ?? 0) + Number(sellerFin?.other_expenses ?? 0) }] : []),
                              ].filter(d => d.value > 0)}
                              cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={10}
                            >
                              <Cell fill="hsl(221 83% 53%)" />
                              <Cell fill="hsl(0 72% 51%)" />
                              <Cell fill="hsl(25 95% 53%)" />
                              <Cell fill="hsl(45 93% 47%)" />
                              <Cell fill="hsl(142 71% 45%)" />
                              <Cell fill="hsl(199 89% 48%)" />
                              <Cell fill="hsl(215 14% 70%)" />
                            </Pie>
                            <Tooltip formatter={(v: number) => fmt(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {(reqMetrics?.capRate != null || metrics?.capRate != null) && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Profile</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={[
                            ...(reqMetrics?.capRate != null && metrics?.capRate != null ? [{ metric: "Cap Rate", yours: reqMetrics.capRate, theirs: metrics.capRate }] : []),
                            ...(metrics?.coc != null ? [{ metric: "Cash-on-Cash", yours: 0, theirs: metrics.coc }] : []),
                            ...(reqMetrics?.expenseRatio != null && metrics?.expenseRatio != null ? [{ metric: "Expense Ratio", yours: reqMetrics.expenseRatio, theirs: metrics.expenseRatio }] : []),
                          ]} margin={{ left: 20, right: 20 }}>
                            <XAxis dataKey="metric" fontSize={11} />
                            <YAxis tickFormatter={(v) => `${v}%`} fontSize={11} />
                            <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                            <Bar dataKey="yours" name="Your Property" fill="hsl(215 20% 65%)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="theirs" name="This Property" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                            <Legend fontSize={11} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {reqMetrics?.price != null && metrics?.price != null && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exchange Position</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={[
                            { name: "Your Value", value: reqMetrics.price },
                            { name: "Proceeds", value: reqMetrics.proceeds ?? reqMetrics.price },
                            { name: "Replacement", value: metrics.price },
                            { name: reqMetrics.proceeds && metrics.price ? (reqMetrics.proceeds >= metrics.price ? "Surplus" : "Gap") : "Gap",
                              value: Math.abs((reqMetrics.proceeds ?? reqMetrics.price) - metrics.price) },
                          ]} margin={{ left: 20, right: 20 }}>
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} fontSize={11} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              <Cell fill="hsl(215 20% 65%)" />
                              <Cell fill="hsl(221 83% 53%)" />
                              <Cell fill="hsl(25 95% 53%)" />
                              <Cell fill={(reqMetrics.proceeds ?? reqMetrics.price) >= metrics.price ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"} />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      )}

      {/* ═══ SECTION 5: PROPERTY DEEP DIVE ═══ */}
      {metrics && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Property Details</h2>
          <p className="mt-1 text-sm text-muted-foreground mb-5">Standalone analysis of this replacement property.</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {metrics.capRate != null && <HealthMetric label="Cap Rate" value={`${metrics.capRate.toFixed(1)}%`} dot={metricHealthDot(metrics.capRate, [4, 6])} />}
            {metrics.grm != null && <HealthMetric label="Gross Rent Multiplier" value={`${metrics.grm.toFixed(2)}x`} />}
            {metrics.expenseRatio != null && <HealthMetric label="Expense Ratio" value={`${metrics.expenseRatio.toFixed(1)}%`} dot={metricHealthDot(metrics.expenseRatio, [40, 55], true)} />}
            {metrics.noiPerUnit != null && <HealthMetric label="NOI / Unit" value={fmt(metrics.noiPerUnit)} />}
            {metrics.pricePerUnit != null && <HealthMetric label="Price / Unit" value={fmt(metrics.pricePerUnit)} />}
            {metrics.pricePerSf != null && <HealthMetric label="Price / SF" value={fmt(metrics.pricePerSf)} />}
            {metrics.breakEvenOcc != null && <HealthMetric label="Break-Even Occupancy" value={`${metrics.breakEvenOcc.toFixed(1)}%`} dot={metricHealthDot(metrics.breakEvenOcc, [70, 85], true)} />}
            {metrics.dscr != null && <HealthMetric label="DSCR" value={`${metrics.dscr.toFixed(2)}x`} dot={metricHealthDot(metrics.dscr, [1.0, 1.25])} />}
            {metrics.coc != null && <HealthMetric label="Cash-on-Cash" value={`${metrics.coc.toFixed(1)}%`} dot={metricHealthDot(metrics.coc, [5, 8])} />}
          </div>
        </div>
      )}

      {/* Physical Details */}
      <div className="mt-6 rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Property Details</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sellerProp.asset_type && <Detail label="Asset Type" value={ASSET_TYPE_LABELS[sellerProp.asset_type as Enums<"asset_type">]} />}
          {sellerProp.asset_subtype && <Detail label="Subtype" value={sellerProp.asset_subtype} />}
          {sellerProp.strategy_type && <Detail label="Strategy" value={STRATEGY_TYPE_LABELS[sellerProp.strategy_type as Enums<"strategy_type">]} />}
          {sellerProp.units && <Detail label="Units" value={num(sellerProp.units)} />}
          {sellerProp.building_square_footage && <Detail label="Square Footage" value={`${num(sellerProp.building_square_footage)} SF`} />}
          {sellerProp.year_built && <Detail label="Year Built" value={String(sellerProp.year_built)} />}
        </div>
        {sellerProp.description && <p className="mt-4 border-t pt-4 text-sm text-muted-foreground leading-relaxed">{sellerProp.description}</p>}
      </div>

      {/* Operating Statement */}
      {sellerFin && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Operating Statement</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <FinRow label="Gross Scheduled Income" value={fmt(sellerFin.gross_scheduled_income)} bold />
              {sellerFin.vacancy_rate != null && <FinRow label="Less: Vacancy" value={`(${Number(sellerFin.vacancy_rate).toFixed(1)}%)`} indent />}
              <FinRow label="Effective Gross Income" value={fmt(sellerFin.effective_gross_income)} indent />
              <tr><td colSpan={2} className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Expenses</td></tr>
              <FinRow label="Real Estate Taxes" value={fmt(sellerFin.real_estate_taxes)} indent />
              <FinRow label="Insurance" value={fmt(sellerFin.insurance)} indent />
              <FinRow label="Utilities" value={fmt(sellerFin.utilities)} indent />
              <FinRow label="Management" value={fmt(sellerFin.management_fee)} indent />
              <FinRow label="Maintenance / Repairs" value={fmt(sellerFin.maintenance_repairs)} indent />
              <FinRow label="CapEx Reserves" value={fmt(sellerFin.capex_reserves)} indent />
              <FinRow label="Other Expenses" value={fmt(sellerFin.other_expenses)} indent />
              <FinRow label="Net Operating Income" value={fmt(sellerFin.noi)} bold highlight />
              {metrics?.debtSvc && (
                <>
                  <tr><td colSpan={2} className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Debt Service</td></tr>
                  <FinRow label="Loan Balance" value={fmt(metrics.loanAmt)} indent />
                  <FinRow label="Interest Rate" value={pct(metrics.loanRate)} indent />
                  <FinRow label="Annual Debt Service" value={fmt(metrics.debtSvc)} indent />
                  <tr><td colSpan={2} className="py-1" /></tr>
                  <FinRow label="Pre-Tax Cash Flow" value={fmt(metrics.preTaxCashFlow)} bold highlight />
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ SECTION 6: MATCH SCORE BREAKDOWN ═══ */}
      <div className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Why This Property Was Matched</h2>
        <p className="mt-1 text-sm text-muted-foreground mb-5">Our matching engine scored this property against your criteria across 8 dimensions.</p>

        <div className="mb-6 flex items-center gap-3">
          <div className={`flex items-center justify-center rounded-lg px-4 py-2 text-2xl font-bold text-white ${scoreColor(totalScore)}`}>
            {totalScore}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Overall Match Score</p>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </div>
        </div>

        <div className="space-y-4">
          {SCORE_DIMENSIONS.map((dim) => {
            const score = Math.round(Number(match[dim.key] ?? 0));
            const explanation = getScoreExplanation(dim.key, score, sellerProp, sellerFin, metrics, criteria);
            return (
              <div key={dim.key}>
                <div className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm font-medium text-foreground">{dim.label}</span>
                  <div className="flex-1">
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>
                  <span className={`w-10 text-right text-sm font-bold ${scoreTextColor(score)}`}>{score}</span>
                  <span className="w-12 text-right text-[10px] text-muted-foreground">{dim.weight}</span>
                </div>
                {explanation && <p className="mt-1 ml-[calc(5rem+0.75rem)] text-xs text-muted-foreground">{explanation}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SECTION 7: BOTTOM CTA ═══ */}
      <div className="mt-8 rounded-xl border bg-card p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 className="font-semibold text-foreground">
              {connectionState === "accepted" ? "You're connected!" : "Interested in this property?"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {connectionState === "accepted"
                ? "View the connection to see agent details and manage the exchange."
                : "Start an exchange connection to reveal the listing agent."}
            </p>
          </div>
          {connectionState === "none" && <Button onClick={handleStartExchange} className="gap-1.5">Start Exchange</Button>}
          {connectionState === "pending" && <Button variant="secondary" disabled className="gap-1.5">Request Sent — Awaiting Response</Button>}
          {connectionState === "accepted" && <Button onClick={() => navigate(`/agent/connections/${connectionId}`)} className="gap-1.5 bg-green-600 hover:bg-green-700">View Connection</Button>}
          {connectionState === "declined" && <Button onClick={handleStartExchange} className="gap-1.5">Request Again</Button>}
        </div>
      </div>

      {/* ═══ START EXCHANGE MODAL ═══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Start Exchange Connection</DialogTitle>
            <DialogDescription>
              You're requesting to connect with the listing agent for{" "}
              <span className="font-medium text-foreground">{sellerProp.property_name || "this property"}</span>
              {sellerProp.city && sellerProp.state ? ` in ${sellerProp.city}, ${sellerProp.state}` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 py-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${scoreColor(totalScore)}`}>
              {totalScore}
            </span>
            <Badge className={BOOT_STATUS_COLORS[match.boot_status] || ""}>
              {BOOT_STATUS_LABELS[match.boot_status] || match.boot_status}
            </Badge>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id="fee-agree"
                checked={feeAgreed}
                onCheckedChange={(v) => setFeeAgreed(v === true)}
              />
              <label htmlFor="fee-agree" className="text-sm leading-snug cursor-pointer">
                I acknowledge that completed exchanges facilitated through 1031ExchangeUp are subject to the platform's facilitation fee as outlined in the Terms of Service.
              </label>
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              The facilitation fee applies only when an exchange is completed.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Add a message for the other agent (optional)
            </label>
            <Textarea
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              placeholder="Hi, my client is interested in this property for their 1031 exchange..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendRequest}
              disabled={!feeAgreed || submitting}
            >
              {submitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{value}</span> {label}
    </span>
  );
}

function CompRow({ label, yours, theirs, delta, positive }: {
  label: string; yours: string; theirs: string; delta?: { pct?: number | null; abs?: number | null; dir: DeltaDir; text?: string }; positive?: "up" | "down" | "neutral";
}) {
  const getDeltaColor = () => {
    if (!delta?.dir || delta.dir === "same" || !positive || positive === "neutral") return "text-muted-foreground";
    if (positive === "up") return delta.dir === "up" ? "text-green-600" : "text-red-500";
    if (positive === "down") return delta.dir === "down" ? "text-green-600" : "text-red-500";
    return "text-muted-foreground";
  };
  const getDeltaIcon = () => {
    if (!delta?.dir || delta.dir === "same") return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (delta.dir === "up") return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };
  const deltaText = delta?.text ?? (delta?.pct != null ? `${delta.pct > 0 ? "+" : ""}${delta.pct.toFixed(1)}%` : delta?.abs != null ? `${delta.abs > 0 ? "+" : ""}${delta.abs.toFixed(1)}` : null);

  return (
    <tr>
      <td className="py-2.5 text-muted-foreground">{label}</td>
      <td className="py-2.5 text-right font-medium text-foreground">{yours}</td>
      <td className="py-2.5 text-center">
        {deltaText ? (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${getDeltaColor()}`}>
            {getDeltaIcon()} {deltaText}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 text-right font-medium text-foreground">{theirs}</td>
    </tr>
  );
}

function PositionCard({ label, content }: { label: string; content: { text: string; badge?: string; color: "green" | "amber" | "red" | "muted" } }) {
  const bgMap = { green: "bg-green-50 border-green-200", amber: "bg-amber-50 border-amber-200", red: "bg-red-50 border-red-200", muted: "bg-muted/50 border-border" };
  const badgeMap = { green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-800", red: "bg-red-100 text-red-800", muted: "bg-muted text-muted-foreground" };
  return (
    <div className={`rounded-lg border p-4 ${bgMap[content.color]}`}>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground">{content.text}</p>
      {content.badge && <Badge className={`mt-2 ${badgeMap[content.color]}`}>{content.badge}</Badge>}
    </div>
  );
}

function HealthMetric({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-2">
        {dot && <div className={`h-2 w-2 rounded-full ${dot}`} />}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function OpRow({ label, yours, theirs, bold, indent, highlight, invert }: {
  label: string; yours: number | null | undefined; theirs: number | null | undefined; bold?: boolean; indent?: boolean; highlight?: boolean; invert?: boolean;
}) {
  if (yours == null && theirs == null) return null;
  const y = yours != null ? Number(yours) : null;
  const t = theirs != null ? Number(theirs) : null;
  let change = "";
  if (y != null && t != null && y !== 0) {
    const p = ((t - y) / Math.abs(y)) * 100;
    change = `${p > 0 ? "+" : ""}${p.toFixed(1)}%`;
  }
  return (
    <tr>
      <td className={`py-2 ${indent ? "pl-4 text-muted-foreground" : ""} ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</td>
      <td className={`py-2 text-right ${bold ? "font-semibold" : "font-medium"} text-foreground`}>{y != null ? fmt(y) : "—"}</td>
      <td className={`py-2 text-right ${bold ? "font-semibold" : "font-medium"} ${highlight ? "text-primary" : "text-foreground"}`}>{t != null ? fmt(t) : "—"}</td>
      <td className="py-2 text-right text-xs text-muted-foreground">{change}</td>
    </tr>
  );
}

function EconItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FinRow({ label, value, bold, indent, highlight }: { label: string; value: string; bold?: boolean; indent?: boolean; highlight?: boolean }) {
  if (value === "—") return null;
  return (
    <tr>
      <td className={`py-2 ${indent ? "pl-4" : ""} ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</td>
      <td className={`py-2 text-right ${bold ? "font-semibold" : "font-medium"} ${highlight ? "text-primary" : "text-foreground"}`}>{value}</td>
    </tr>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

// ── Score explanations (8 dimensions) ──

function getScoreExplanation(
  key: string, score: number,
  property: any, financials: any, metrics: any,
  criteria: any,
): string | null {
  if (!criteria && !property) return null;
  const c = criteria;
  const assetLabel = property?.asset_type ? ASSET_TYPE_LABELS[property.asset_type as Enums<"asset_type">] : null;
  const stratLabel = property?.strategy_type ? STRATEGY_TYPE_LABELS[property.strategy_type as Enums<"strategy_type">] : null;

  switch (key) {
    case "price_score": {
      const price = financials?.asking_price;
      const min = c?.target_price_min;
      const max = c?.target_price_max;
      if (price && min && max) return `Asking price of ${fmt(price)} is ${Number(price) >= Number(min) && Number(price) <= Number(max) ? "within" : "outside"} your target range of ${fmt(min)}–${fmt(max)}.`;
      if (price) return `Asking price of ${fmt(price)}.`;
      return null;
    }
    case "geo_score": {
      const state = property?.state;
      const targets = c?.target_states;
      if (state && targets?.length) return `Located in ${state} — ${targets.includes(state) ? "one of your target states" : "not in your target states"}.`;
      if (state) return `Located in ${state}.`;
      return null;
    }
    case "asset_score": {
      const targets = c?.target_asset_types;
      if (assetLabel && targets?.length) return `${assetLabel} ${targets.includes(property.asset_type) ? "matches" : "doesn't match"} your target asset types.`;
      if (assetLabel) return `Asset type: ${assetLabel}.`;
      return null;
    }
    case "strategy_score": {
      const targets = c?.target_strategies;
      if (stratLabel && targets?.length) return `${stratLabel} strategy ${targets.includes(property.strategy_type) ? "matches" : "doesn't match"} your target strategies.`;
      if (stratLabel) return `Strategy: ${stratLabel}.`;
      return null;
    }
    case "financial_score": {
      const capRate = metrics?.capRate;
      const occupancy = metrics?.occupancyRate;
      const yearBuilt = property?.year_built;
      const minYear = c?.target_year_built_min;
      const parts: string[] = [];
      if (capRate != null) parts.push(`cap rate ${capRate.toFixed(1)}%`);
      if (occupancy != null) parts.push(`${Number(occupancy).toFixed(0)}% occupancy`);
      if (yearBuilt) {
        if (minYear != null) {
          parts.push(`built ${yearBuilt} (${yearBuilt >= Number(minYear) ? "meets" : "below"} your ${minYear}+ preference)`);
        } else {
          parts.push(`built ${yearBuilt}`);
        }
      }
      return parts.length ? `Property quality: ${parts.join(", ")}.` : null;
    }
    default:
      return null;
  }
}
