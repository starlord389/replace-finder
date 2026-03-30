import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Building2, Calendar, Check, X, MessageSquare,
  Camera, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  ArrowRight, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS, SCORE_DIMENSIONS,
} from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";
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

function metricColor(value: number, thresholds: [number, number], invert = false) {
  const [low, high] = thresholds;
  if (invert) return value <= low ? "text-green-600" : value <= high ? "text-amber-600" : "text-red-500";
  return value >= high ? "text-green-600" : value >= low ? "text-amber-600" : "text-red-500";
}

// Delta helpers for comparison
type DeltaDir = "up" | "down" | "same" | null;
function calcDelta(yours: number | null | undefined, theirs: number | null | undefined): { pct: number | null; dir: DeltaDir } {
  if (yours == null || theirs == null || yours === 0) return { pct: null, dir: null };
  const d = ((Number(theirs) - Number(yours)) / Math.abs(Number(yours))) * 100;
  return { pct: d, dir: Math.abs(d) < 0.05 ? "same" : d > 0 ? "up" : "down" };
}
function absDelta(yours: number | null | undefined, theirs: number | null | undefined): { abs: number | null; dir: DeltaDir } {
  if (yours == null || theirs == null) return { abs: null, dir: null };
  const d = Number(theirs) - Number(yours);
  return { abs: d, dir: Math.abs(d) < 0.01 ? "same" : d > 0 ? "up" : "down" };
}

// ── Main Component ──────────────────────────────────────

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [access, setAccess] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [images, setImages] = useState<Tables<"inventory_images">[]>([]);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [exchangeReq, setExchangeReq] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [detailedOpen, setDetailedOpen] = useState(false);

  const [interestDialogOpen, setInterestDialogOpen] = useState(false);
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showChangeResponse, setShowChangeResponse] = useState(false);

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

  useEffect(() => {
    if (!matchResult || viewTracked.current) return;
    if (matchResult.client_viewed_at) { viewTracked.current = true; return; }
    viewTracked.current = true;
    supabase.from("match_results").update({ client_viewed_at: new Date().toISOString() }).eq("id", matchResult.id).select()
      .then(({ data }) => { if (data?.length) setMatchResult((p: any) => p ? { ...p, client_viewed_at: new Date().toISOString() } : p); });
  }, [matchResult]);

  const loadData = async () => {
    const { data: accessData } = await supabase
      .from("matched_property_access").select("*").eq("id", id!).eq("user_id", user!.id).single();
    if (!accessData) { setLoading(false); return; }
    setAccess(accessData);

    const [propRes, finRes, imgRes, matchRes, reqRes, prefRes] = await Promise.all([
      supabase.from("inventory_properties").select("*").eq("id", accessData.property_id).single(),
      supabase.from("inventory_financials").select("*").eq("property_id", accessData.property_id).maybeSingle(),
      supabase.from("inventory_images").select("*").eq("property_id", accessData.property_id).order("sort_order"),
      supabase.from("match_results").select("*").eq("id", accessData.match_result_id).single(),
      supabase.from("exchange_requests").select("*").eq("id", accessData.request_id).single(),
      supabase.from("exchange_request_preferences").select("*").eq("request_id", accessData.request_id).maybeSingle(),
    ]);

    setProperty(propRes.data);
    setFinancials(finRes.data);
    setImages(imgRes.data ?? []);
    setMatchResult(matchRes.data);
    setExchangeReq(reqRes.data);
    setPreferences(prefRes.data);
    setLoading(false);
  };

  const submitResponse = async (response: "interested" | "passed") => {
    if (!matchResult) return;
    setSubmitting(true);
    const updates = { client_response: response, client_response_at: new Date().toISOString(), client_response_note: responseNote.trim() || null };
    const { data, error } = await supabase.from("match_results").update(updates).eq("id", matchResult.id).select();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else if (!data?.length) { toast({ title: "Error", description: "Unable to save response.", variant: "destructive" }); }
    else { setMatchResult((p: any) => ({ ...p, ...updates })); setShowChangeResponse(false); toast({ title: response === "interested" ? "Interest expressed" : "Property passed", description: response === "interested" ? "Your advisor has been notified." : "Your response has been recorded." }); }
    setSubmitting(false); setInterestDialogOpen(false); setPassDialogOpen(false); setResponseNote("");
  };

  // ── Computed financial metrics ──
  const metrics = useMemo(() => {
    if (!financials) return null;
    const price = financials.asking_price ? Number(financials.asking_price) : null;
    const noi = financials.noi ? Number(financials.noi) : null;
    const revenue = financials.annual_revenue ? Number(financials.annual_revenue) : null;
    const expenses = financials.annual_expenses ? Number(financials.annual_expenses) : null;
    const occ = financials.occupancy_rate ? Number(financials.occupancy_rate) : null;
    const units = property?.units;
    const sf = property?.square_footage;
    const loanAmt = financials.loan_amount ? Number(financials.loan_amount) : financials.debt_amount ? Number(financials.debt_amount) : null;
    const loanRate = financials.loan_rate ? Number(financials.loan_rate) : financials.debt_rate ? Number(financials.debt_rate) : null;
    const debtSvc = financials.annual_debt_service ? Number(financials.annual_debt_service) : (loanAmt && loanRate ? loanAmt * loanRate / 100 : null);
    const equity = price && loanAmt ? price - loanAmt : null;

    const capRate = noi && price ? (noi / price) * 100 : financials.cap_rate ? Number(financials.cap_rate) : null;
    const grm = revenue && price ? price / revenue : null;
    const expenseRatio = expenses && revenue ? (expenses / revenue) * 100 : null;
    const noiPerUnit = noi && units ? noi / units : null;
    const pricePerUnit = price && units ? price / units : null;
    const noiPerSf = noi && sf ? noi / sf : null;
    const pricePerSf = price && sf ? price / sf : null;
    const breakEvenOcc = expenses && revenue ? (expenses / revenue) * 100 : null;
    const dscr = noi && debtSvc ? noi / debtSvc : null;
    const coc = noi && debtSvc && equity && equity > 0 ? ((noi - debtSvc) / equity) * 100 : financials.cash_on_cash ? Number(financials.cash_on_cash) : null;
    const preTaxCashFlow = noi && debtSvc ? noi - debtSvc : null;
    const gsi = financials.gross_scheduled_income ? Number(financials.gross_scheduled_income) : null;
    const egi = financials.effective_gross_income ? Number(financials.effective_gross_income) : null;
    const vacRate = financials.vacancy_rate ? Number(financials.vacancy_rate) : null;

    return { capRate, grm, expenseRatio, noiPerUnit, pricePerUnit, noiPerSf, pricePerSf, breakEvenOcc, dscr, coc, preTaxCashFlow, debtSvc, equity, price, noi, revenue, expenses, occ, loanAmt, loanRate, gsi, egi, vacRate };
  }, [financials, property]);

  // Relinquished property metrics
  const reqMetrics = useMemo(() => {
    if (!exchangeReq) return null;
    const price = exchangeReq.relinquished_estimated_value ? Number(exchangeReq.relinquished_estimated_value) : null;
    const noi = exchangeReq.current_noi ? Number(exchangeReq.current_noi) : null;
    const capRate = exchangeReq.current_cap_rate ? Number(exchangeReq.current_cap_rate) : (noi && price ? (noi / price) * 100 : null);
    const occ = exchangeReq.current_occupancy_rate ? Number(exchangeReq.current_occupancy_rate) : null;
    const units = exchangeReq.units ?? null;
    const sf = exchangeReq.building_square_footage ? Number(exchangeReq.building_square_footage) : null;
    const pricePerUnit = price && units ? price / units : null;
    const noiPerUnit = noi && units ? noi / units : null;
    const equity = exchangeReq.estimated_equity ? Number(exchangeReq.estimated_equity) : null;
    const proceeds = exchangeReq.exchange_proceeds ? Number(exchangeReq.exchange_proceeds) : null;
    const debtSvc = exchangeReq.annual_debt_service ? Number(exchangeReq.annual_debt_service) : null;
    const loanBal = exchangeReq.current_loan_balance ? Number(exchangeReq.current_loan_balance) : null;
    const gsi = exchangeReq.gross_scheduled_income ? Number(exchangeReq.gross_scheduled_income) : null;
    const egi = exchangeReq.effective_gross_income ? Number(exchangeReq.effective_gross_income) : null;
    const expenses = [exchangeReq.real_estate_taxes, exchangeReq.insurance, exchangeReq.utilities, exchangeReq.management_fee, exchangeReq.maintenance_repairs, exchangeReq.capex_reserves, exchangeReq.other_expenses]
      .filter(Boolean).reduce((s, v) => s + Number(v), 0) || null;
    const revenue = gsi || egi || null;
    const expenseRatio = expenses && revenue ? (expenses / revenue) * 100 : null;

    return { price, noi, capRate, occ, units, sf, pricePerUnit, noiPerUnit, equity, proceeds, debtSvc, loanBal, gsi, egi, expenses, revenue, expenseRatio };
  }, [exchangeReq]);

  const hasResponded = !!matchResult?.client_response;
  const showButtons = !hasResponded || showChangeResponse;
  const imgUrls = images.map((img) => supabase.storage.from("inventory-images").getPublicUrl(img.storage_path).data.publicUrl);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!access || !property) return <p className="py-20 text-center text-muted-foreground">Match not found or access denied.</p>;

  const openInterest = () => { setResponseNote(""); setInterestDialogOpen(true); };
  const openPass = () => { setResponseNote(""); setPassDialogOpen(true); };

  // Context banner text
  const contextText = (() => {
    if (!exchangeReq) return null;
    const addr = [exchangeReq.relinquished_address, exchangeReq.relinquished_city, exchangeReq.relinquished_state].filter(Boolean).join(", ");
    const assetLabel = exchangeReq.relinquished_asset_type ? ASSET_TYPE_LABELS[exchangeReq.relinquished_asset_type as keyof typeof ASSET_TYPE_LABELS] : null;
    if (addr) return `Match for: ${addr}${assetLabel ? ` — ${assetLabel} Exchange` : ""}`;
    return `Match for: Exchange Request #${exchangeReq.id.slice(0, 8)}`;
  })();

  const totalScore = matchResult ? Math.round(Number(matchResult.total_score)) : 0;

  return (
    <div className="relative">
      {/* ═══ Context Banner ═══ */}
      {contextText && (
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-4 -mx-6 block w-[calc(100%+3rem)] border-b bg-muted/50 px-6 py-2 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 inline h-3 w-3" />{contextText}
        </button>
      )}

      {/* ═══ Sticky Action Bar ═══ */}
      {showStickyBar && (
        <div className="sticky top-0 z-30 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <p className="font-semibold text-foreground truncate">{property.name || "Property"}</p>
              <span className="text-sm text-muted-foreground">{fmt(financials?.asking_price)}</span>
              {matchResult && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white ${scoreColor(totalScore)}`}>
                  {totalScore}
                </span>
              )}
            </div>
            <ResponseButtons show={showButtons} matchResult={matchResult} onInterest={openInterest} onPass={openPass} />
          </div>
        </div>
      )}

      <button onClick={() => navigate("/dashboard/matches")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Matches
      </button>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 1: PROPERTY HERO                                */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* Photo Gallery */}
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
            <Camera className="h-4 w-4" /> View all {images.length} photos
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
            <h1 className="text-2xl font-bold text-foreground">{property.name || property.address || "Replacement Property"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[property.address, property.city, property.state, property.zip].filter(Boolean).join(", ") || "—"}</span>
              {property.asset_type && <Badge variant="secondary" className="text-xs">{ASSET_TYPE_LABELS[property.asset_type]}</Badge>}
              {property.strategy_type && <Badge variant="outline" className="text-xs">{STRATEGY_TYPE_LABELS[property.strategy_type]}</Badge>}
            </div>
            {/* Key Metrics Row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-2xl font-bold text-primary">{fmt(financials?.asking_price)}</span>
              {metrics?.capRate != null && <StatPill label="Cap Rate" value={`${metrics.capRate.toFixed(1)}%`} />}
              {metrics?.noi != null && <StatPill label="NOI" value={fmt(metrics.noi)} />}
              {property.units && <StatPill label="Units" value={String(property.units)} />}
              {property.square_footage && !property.units && <StatPill label="SF" value={num(property.square_footage)} />}
              {property.year_built && <StatPill label="Built" value={String(property.year_built)} />}
              {metrics?.occ != null && <StatPill label="Occupancy" value={`${Number(metrics.occ).toFixed(1)}%`} />}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            {matchResult && (
              <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-white font-bold ${scoreColor(totalScore)}`}>
                Match Score: {totalScore}/100
              </div>
            )}
            <ResponseArea matchResult={matchResult} hasResponded={hasResponded} showButtons={showButtons} onInterest={openInterest} onPass={openPass} onChangeResponse={() => setShowChangeResponse(true)} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 2: EXCHANGE COMPARISON                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      {exchangeReq && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Exchange Comparison</h2>
          <p className="mt-1 text-sm text-muted-foreground">How this property compares to the one you're exchanging.</p>

          {/* Comparison Table */}
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
                <CompRow label={property.units ? "Units" : "Square Footage"} yours={property.units ? num(reqMetrics?.units) : num(reqMetrics?.sf)} theirs={property.units ? num(property.units) : num(property.square_footage)} delta={calcDelta(reqMetrics?.units ?? reqMetrics?.sf, property.units ?? property.square_footage)} positive="up" />
                <CompRow label="Year Built" yours={exchangeReq.year_built ? String(exchangeReq.year_built) : "—"} theirs={property.year_built ? String(property.year_built) : "—"} delta={yearDelta(exchangeReq.year_built, property.year_built)} positive="up" />
                <CompRow label="Occupancy" yours={pct(reqMetrics?.occ)} theirs={pct(metrics?.occ)} delta={absDeltaPct(reqMetrics?.occ, metrics?.occ)} positive="up" />
                <CompRow label="Asset Type" yours={exchangeReq.relinquished_asset_type ? ASSET_TYPE_LABELS[exchangeReq.relinquished_asset_type as keyof typeof ASSET_TYPE_LABELS] || "—" : "—"} theirs={property.asset_type ? ASSET_TYPE_LABELS[property.asset_type] : "—"} />
                <CompRow label="Strategy" yours={exchangeReq.sale_timeline ? STRATEGY_TYPE_LABELS[exchangeReq.sale_timeline as keyof typeof STRATEGY_TYPE_LABELS] || exchangeReq.sale_timeline : "—"} theirs={property.strategy_type ? STRATEGY_TYPE_LABELS[property.strategy_type] : "—"} />
                {(reqMetrics?.pricePerUnit != null || metrics?.pricePerUnit != null) && (
                  <CompRow label="Price / Unit" yours={fmt(reqMetrics?.pricePerUnit)} theirs={fmt(metrics?.pricePerUnit)} delta={calcDelta(reqMetrics?.pricePerUnit, metrics?.pricePerUnit)} positive="down" />
                )}
                {(reqMetrics?.noiPerUnit != null || metrics?.noiPerUnit != null) && (
                  <CompRow label="NOI / Unit" yours={fmt(reqMetrics?.noiPerUnit)} theirs={fmt(metrics?.noiPerUnit)} delta={calcDelta(reqMetrics?.noiPerUnit, metrics?.noiPerUnit)} positive="up" />
                )}
              </tbody>
            </table>
          </div>

          {/* Exchange Position Summary Cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {/* Equity Position */}
            <PositionCard
              label="Equity Position"
              content={(() => {
                const equity = reqMetrics?.equity ?? reqMetrics?.proceeds;
                const price = metrics?.price;
                const replacementDebt = metrics?.loanAmt;
                if (equity == null || price == null) return { text: "Not enough data", color: "muted" as const };
                const equityNeeded = replacementDebt ? price - replacementDebt : price;
                const gap = equity - equityNeeded;
                return {
                  text: `Your equity: ${fmt(equity)} → Needed: ${fmt(equityNeeded)}`,
                  badge: gap >= 0 ? "Covered" : `Gap: ${fmt(Math.abs(gap))}`,
                  color: gap >= 0 ? "green" as const : "amber" as const,
                };
              })()}
            />
            {/* Cash Flow Shift */}
            <PositionCard
              label="Cash Flow Shift"
              content={(() => {
                const yourNoi = reqMetrics?.noi;
                const theirNoi = metrics?.noi;
                if (yourNoi == null || theirNoi == null) return { text: "NOI data not available", color: "muted" as const };
                const diff = theirNoi - yourNoi;
                const pctChange = (diff / Math.abs(yourNoi)) * 100;
                return {
                  text: `NOI change: ${diff >= 0 ? "+" : ""}${fmt(diff)} (${diff >= 0 ? "+" : ""}${pctChange.toFixed(1)}%)`,
                  color: diff >= 0 ? "green" as const : "red" as const,
                };
              })()}
            />
            {/* Scale Change */}
            <PositionCard
              label="Scale Change"
              content={(() => {
                const yourUnits = reqMetrics?.units;
                const theirUnits = property.units;
                const yourSf = reqMetrics?.sf;
                const theirSf = property.square_footage;
                if (yourUnits && theirUnits) return { text: `${yourUnits} units → ${theirUnits} units`, color: (theirUnits >= yourUnits ? "green" : "amber") as const };
                if (yourSf && theirSf) return { text: `${num(yourSf)} SF → ${num(theirSf)} SF`, color: (theirSf >= yourSf ? "green" : "amber") as const };
                return { text: "Scale data not available", color: "muted" as const };
              })()}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 3: DETAILED EXCHANGE ANALYSIS (Collapsed)       */}
      {/* ═══════════════════════════════════════════════════════ */}
      {exchangeReq && metrics && (
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
                  {/* 3A: Operating Income Comparison */}
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
                          <OpRow label="  Taxes" yours={exchangeReq.real_estate_taxes} theirs={financials?.real_estate_taxes} indent invert />
                          <OpRow label="  Insurance" yours={exchangeReq.insurance} theirs={financials?.insurance} indent invert />
                          <OpRow label="  Utilities" yours={exchangeReq.utilities} theirs={financials?.utilities} indent invert />
                          <OpRow label="  Management" yours={exchangeReq.management_fee} theirs={financials?.management_fee} indent invert />
                          <OpRow label="  Maintenance" yours={exchangeReq.maintenance_repairs} theirs={financials?.maintenance_repairs} indent invert />
                          <OpRow label="  CapEx Reserves" yours={exchangeReq.capex_reserves} theirs={financials?.capex_reserves} indent invert />
                          <OpRow label="  Other" yours={exchangeReq.other_expenses} theirs={financials?.other_expenses} indent invert />
                          <OpRow label="Net Operating Income" yours={reqMetrics?.noi} theirs={metrics?.noi} bold highlight />
                          <OpRow label="Debt Service" yours={reqMetrics?.debtSvc} theirs={metrics?.debtSvc} invert />
                          <OpRow label="Pre-Tax Cash Flow" yours={reqMetrics?.noi != null && reqMetrics?.debtSvc != null ? reqMetrics.noi - reqMetrics.debtSvc : null} theirs={metrics?.preTaxCashFlow} bold highlight />
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3B: Exchange Economics */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Exchange Economics</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <EconItem label="Exchange Proceeds" value={fmt(reqMetrics?.proceeds)} />
                      <EconItem label="Estimated Equity" value={fmt(reqMetrics?.equity)} />
                      <EconItem label="Replacement Property Price" value={fmt(metrics?.price)} />
                      <EconItem label="Equity Required" value={fmt(metrics?.price && metrics?.loanAmt ? metrics.price - metrics.loanAmt : metrics?.price)} />
                      {/* Boot estimate */}
                      {reqMetrics?.proceeds != null && metrics?.price != null && (
                        <div className="sm:col-span-2 rounded-lg border p-4">
                          {Number(reqMetrics.proceeds) >= Number(metrics.price) ? (
                            <p className="text-sm text-green-600 font-medium">✓ No boot — exchange is fully tax-deferred. Proceeds ({fmt(reqMetrics.proceeds)}) cover the replacement price ({fmt(metrics.price)}).</p>
                          ) : (
                            <p className="text-sm text-amber-600 font-medium">⚠ Potential boot (taxable): {fmt(Number(metrics.price) - Number(reqMetrics.proceeds))}. Replacement price exceeds exchange proceeds.</p>
                          )}
                        </div>
                      )}
                      {/* Debt replacement */}
                      {reqMetrics?.loanBal != null && metrics?.loanAmt != null && (
                        <div className="sm:col-span-2 rounded-lg border p-4">
                          {Number(metrics.loanAmt) >= Number(reqMetrics.loanBal) ? (
                            <p className="text-sm text-green-600 font-medium">✓ Debt replacement met. New debt ({fmt(metrics.loanAmt)}) ≥ relinquished debt ({fmt(reqMetrics.loanBal)}).</p>
                          ) : (
                            <p className="text-sm text-amber-600 font-medium">⚠ Debt replacement shortfall: {fmt(Number(reqMetrics.loanBal) - Number(metrics.loanAmt))}. May trigger taxable boot.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3C: Charts */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Chart 1: NOI Comparison */}
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

                    {/* Chart 2: Revenue & Expense Breakdown (replacement only) */}
                    {metrics?.noi != null && metrics?.expenses != null && (
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue Breakdown</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "NOI", value: metrics.noi },
                                ...(financials?.real_estate_taxes ? [{ name: "Taxes", value: Number(financials.real_estate_taxes) }] : []),
                                ...(financials?.insurance ? [{ name: "Insurance", value: Number(financials.insurance) }] : []),
                                ...(financials?.management_fee ? [{ name: "Management", value: Number(financials.management_fee) }] : []),
                                ...(financials?.maintenance_repairs ? [{ name: "Maintenance", value: Number(financials.maintenance_repairs) }] : []),
                                ...(financials?.utilities ? [{ name: "Utilities", value: Number(financials.utilities) }] : []),
                                ...((financials?.capex_reserves || financials?.other_expenses) ? [{ name: "Other", value: Number(financials?.capex_reserves ?? 0) + Number(financials?.other_expenses ?? 0) }] : []),
                              ].filter(d => d.value > 0)}
                              cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              fontSize={10}
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

                    {/* Chart 3: Return Profile Comparison */}
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

                    {/* Chart 4: Exchange Position Waterfall */}
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 4: PROPERTY DEEP DIVE                           */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* 4A: Calculated Financial Metrics */}
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

      {/* 4B: Physical Property Details */}
      <div className="mt-6 rounded-xl border bg-card p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Physical Details</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {property.asset_type && <Detail label="Asset Type" value={ASSET_TYPE_LABELS[property.asset_type]} />}
          {property.asset_subtype && <Detail label="Subtype" value={property.asset_subtype} />}
          {property.strategy_type && <Detail label="Strategy" value={STRATEGY_TYPE_LABELS[property.strategy_type]} />}
          {property.property_class && <Detail label="Class" value={property.property_class} />}
          {property.units && <Detail label="Units" value={num(property.units)} />}
          {property.square_footage && <Detail label="Square Footage" value={`${num(property.square_footage)} SF`} />}
          {property.land_area_acres && <Detail label="Land Area" value={`${property.land_area_acres} acres`} />}
          {property.year_built && <Detail label="Year Built" value={String(property.year_built)} />}
          {property.num_stories && <Detail label="Stories" value={String(property.num_stories)} />}
          {property.num_buildings && <Detail label="Buildings" value={String(property.num_buildings)} />}
          {property.parking_spaces && <Detail label="Parking" value={[property.parking_spaces + " spaces", property.parking_type].filter(Boolean).join(" · ")} />}
          {property.construction_type && <Detail label="Construction" value={property.construction_type} />}
          {property.roof_type && <Detail label="Roof" value={property.roof_type} />}
          {property.hvac_type && <Detail label="HVAC" value={property.hvac_type} />}
          {property.property_condition && <Detail label="Condition" value={property.property_condition} />}
          {property.zoning && <Detail label="Zoning" value={property.zoning} />}
        </div>
        {property.amenities?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">Amenities</p>
            <div className="flex flex-wrap gap-1.5">
              {property.amenities.map((a: string) => (
                <span key={a} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">{a}</span>
              ))}
            </div>
          </div>
        )}
        {property.description && <p className="mt-4 border-t pt-4 text-sm text-muted-foreground leading-relaxed">{property.description}</p>}
        {property.recent_renovations && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-muted-foreground mb-1">Recent Renovations</p>
            <p className="text-sm text-foreground">{property.recent_renovations}</p>
          </div>
        )}
      </div>

      {/* 4C: Operating Statement */}
      {financials && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Operating Statement</h3>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <FinRow label="Gross Scheduled Income" value={fmt(financials.gross_scheduled_income ?? financials.annual_revenue)} bold />
              {financials.vacancy_rate != null && <FinRow label="Less: Vacancy" value={`(${Number(financials.vacancy_rate).toFixed(1)}%)`} indent />}
              <FinRow label="Effective Gross Income" value={fmt(financials.effective_gross_income)} indent />
              <tr><td colSpan={2} className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Expenses</td></tr>
              <FinRow label="Real Estate Taxes" value={fmt(financials.real_estate_taxes)} indent />
              <FinRow label="Insurance" value={fmt(financials.insurance)} indent />
              <FinRow label="Utilities" value={fmt(financials.utilities)} indent />
              <FinRow label="Management" value={fmt(financials.management_fee)} indent />
              <FinRow label="Maintenance / Repairs" value={fmt(financials.maintenance_repairs)} indent />
              <FinRow label="CapEx Reserves" value={fmt(financials.capex_reserves)} indent />
              <FinRow label="Other Expenses" value={fmt(financials.other_expenses)} indent />
              <FinRow label="Total Expenses" value={fmt(financials.annual_expenses)} bold />
              <tr><td colSpan={2} className="py-1" /></tr>
              <FinRow label="Net Operating Income" value={fmt(financials.noi)} bold highlight />
              {metrics?.debtSvc && (
                <>
                  <tr><td colSpan={2} className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Debt Service</td></tr>
                  <FinRow label="Loan Amount" value={fmt(metrics.loanAmt)} indent />
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 5: MATCH SCORE BREAKDOWN                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {matchResult && (
        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Why This Property Was Matched</h2>
          <p className="mt-1 text-sm text-muted-foreground mb-5">Our matching engine scored this property against your criteria across 6 dimensions.</p>

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
              const score = Math.round(Number(matchResult[dim.key] ?? 0));
              const explanation = getScoreExplanation(dim.key, score, property, financials, metrics, exchangeReq, preferences);
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
                  </div>
                  {explanation && <p className="mt-1 ml-[calc(5rem+0.75rem)] text-xs text-muted-foreground">{explanation}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SECTION 6: BOTTOM CTA                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="mt-8 rounded-xl border bg-card p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 className="font-semibold text-foreground">Interested in this property?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Let your advisor know and we'll arrange next steps.</p>
          </div>
          <ResponseArea matchResult={matchResult} hasResponded={hasResponded} showButtons={showButtons} onInterest={openInterest} onPass={openPass} onChangeResponse={() => setShowChangeResponse(true)} />
        </div>
      </div>

      {/* ═══ Dialogs ═══ */}
      <AlertDialog open={interestDialogOpen} onOpenChange={setInterestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Express Interest</AlertDialogTitle>
            <AlertDialogDescription>Your advisor will be notified. This does not create any binding commitment.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Add a note for your advisor (optional)…" value={responseNote} onChange={(e) => setResponseNote(e.target.value)} rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={(e) => { e.preventDefault(); submitResponse("interested"); }} className="bg-green-600 hover:bg-green-700 text-white">
              {submitting ? "Submitting…" : "Confirm Interest"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={passDialogOpen} onOpenChange={setPassDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pass on This Property</AlertDialogTitle>
            <AlertDialogDescription>This property will be marked as passed. You can change your mind later.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Reason for passing (optional)…" value={responseNote} onChange={(e) => setResponseNote(e.target.value)} rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={(e) => { e.preventDefault(); submitResponse("passed"); }} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {submitting ? "Submitting…" : "Confirm Pass"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function ResponseButtons({ show, matchResult, onInterest, onPass }: { show: boolean; matchResult: any; onInterest: () => void; onPass: () => void }) {
  if (!show || !matchResult || matchResult.status !== "approved") return null;
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button onClick={onInterest} className="bg-green-600 hover:bg-green-700 text-white gap-1.5" size="sm"><Check className="h-4 w-4" /> Interest</Button>
      <Button variant="outline" onClick={onPass} className="gap-1.5" size="sm"><X className="h-4 w-4" /> Pass</Button>
    </div>
  );
}

function ResponseArea({ matchResult, hasResponded, showButtons, onInterest, onPass, onChangeResponse }: {
  matchResult: any; hasResponded: boolean; showButtons: boolean; onInterest: () => void; onPass: () => void; onChangeResponse: () => void;
}) {
  if (!matchResult || matchResult.status !== "approved") return null;
  if (showButtons) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Button onClick={onInterest} className="bg-green-600 hover:bg-green-700 text-white gap-1.5"><Check className="h-4 w-4" /> Express Interest</Button>
        <Button variant="outline" onClick={onPass} className="gap-1.5"><X className="h-4 w-4" /> Pass</Button>
      </div>
    );
  }
  if (hasResponded) {
    const isInterested = matchResult.client_response === "interested";
    return (
      <div className="text-right shrink-0">
        <Badge className={isInterested ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-muted text-muted-foreground hover:bg-muted"}>
          {isInterested ? <><Check className="mr-1 h-3 w-3" /> You expressed interest</> : "You passed"}
        </Badge>
        {matchResult.client_response_note && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground justify-end"><MessageSquare className="h-3 w-3" />{matchResult.client_response_note}</p>}
        <button onClick={onChangeResponse} className="mt-1 text-xs text-primary hover:underline">Change response</button>
      </div>
    );
  }
  return null;
}

// Comparison row with delta
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
    const isGood = invert ? p < 0 : p > 0;
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

// Dynamic score explanations
function getScoreExplanation(
  key: string, score: number,
  property: any, financials: any, metrics: any,
  exchangeReq: any, preferences: any
): string | null {
  if (!preferences && !exchangeReq) return null;
  const p = preferences;
  const assetLabel = property?.asset_type ? ASSET_TYPE_LABELS[property.asset_type] : null;
  const stratLabel = property?.strategy_type ? STRATEGY_TYPE_LABELS[property.strategy_type] : null;

  switch (key) {
    case "price_score": {
      const price = financials?.asking_price;
      const min = p?.target_price_min;
      const max = p?.target_price_max;
      if (price && min && max) return `Asking price of ${fmt(price)} is ${Number(price) >= Number(min) && Number(price) <= Number(max) ? "within" : "outside"} your target range of ${fmt(min)}–${fmt(max)}.`;
      if (price) return `Asking price of ${fmt(price)}.`;
      return null;
    }
    case "geo_score": {
      const state = property?.state;
      const targets = p?.target_states;
      if (state && targets?.length) return `Located in ${state} — ${targets.includes(state) ? "one of your target states" : "not in your target states"}.`;
      if (state) return `Located in ${state}.`;
      return null;
    }
    case "asset_score": {
      const targets = p?.target_asset_types;
      if (assetLabel && targets?.length) return `${assetLabel} ${targets.includes(property.asset_type) ? "matches" : "doesn't match"} your target asset types.`;
      if (assetLabel) return `Asset type: ${assetLabel}.`;
      return null;
    }
    case "strategy_score": {
      const targets = p?.target_strategies;
      if (stratLabel && targets?.length) return `${stratLabel} strategy ${targets.includes(property.strategy_type) ? "matches" : "doesn't match"} your target strategies.`;
      if (stratLabel) return `Strategy: ${stratLabel}.`;
      return null;
    }
    case "financial_score": {
      const capRate = metrics?.capRate;
      const min = p?.target_cap_rate_min;
      const max = p?.target_cap_rate_max;
      if (capRate != null && min != null && max != null) return `Cap rate of ${capRate.toFixed(1)}% is ${capRate >= Number(min) && capRate <= Number(max) ? "within" : "outside"} your target range of ${Number(min).toFixed(1)}%–${Number(max).toFixed(1)}%.`;
      if (capRate != null) return `Cap rate of ${capRate.toFixed(1)}%.`;
      return null;
    }
    case "timing_score": {
      const idDeadline = exchangeReq?.identification_deadline;
      if (idDeadline) return `Identification deadline: ${new Date(idDeadline).toLocaleDateString()}. Property is currently available.`;
      return "Based on property availability and your exchange timeline.";
    }
    default:
      return null;
  }
}
