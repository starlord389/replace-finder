import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Building2, Calendar, TrendingUp, Ruler, Users,
  Check, X, MessageSquare, Camera, ChevronUp, ChevronDown,
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
  ASSET_TYPE_LABELS, STRATEGY_TYPE_LABELS, SCORE_DIMENSIONS,
} from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

// ── Helpers ──

const fmt = (v: number | null | undefined) => (v ? `$${Number(v).toLocaleString()}` : "—");
const pct = (v: number | null | undefined, d = 1) => (v != null ? `${Number(v).toFixed(d)}%` : "—");
const num = (v: number | null | undefined) => (v != null ? Number(v).toLocaleString() : "—");

function metricColor(value: number, thresholds: [number, number], invert = false) {
  const [low, high] = thresholds;
  if (invert) return value <= low ? "text-green-600" : value <= high ? "text-amber-600" : "text-red-500";
  return value >= high ? "text-green-600" : value >= low ? "text-amber-600" : "text-red-500";
}

function MetricCard({ label, value, sub, colorClass }: { label: string; value: string; sub?: string; colorClass?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${colorClass || "text-foreground"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-5 text-left">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

// ── Main Component ──

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
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);

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

  useEffect(() => {
    if (!id || !user) return;
    loadData();
  }, [id, user]);

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

    const [propRes, finRes, imgRes, matchRes, reqRes] = await Promise.all([
      supabase.from("inventory_properties").select("*").eq("id", accessData.property_id).single(),
      supabase.from("inventory_financials").select("*").eq("property_id", accessData.property_id).maybeSingle(),
      supabase.from("inventory_images").select("*").eq("property_id", accessData.property_id).order("sort_order"),
      supabase.from("match_results").select("*").eq("id", accessData.match_result_id).single(),
      supabase.from("exchange_requests").select("*").eq("id", accessData.request_id).single(),
    ]);

    setProperty(propRes.data);
    setFinancials(finRes.data);
    setImages(imgRes.data ?? []);
    setMatchResult(matchRes.data);
    setExchangeReq(reqRes.data);
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
    const price = financials.asking_price;
    const noi = financials.noi;
    const revenue = financials.annual_revenue;
    const expenses = financials.annual_expenses;
    const occ = financials.occupancy_rate;
    const units = property?.units;
    const sf = property?.square_footage;
    const debtSvc = financials.annual_debt_service ?? (financials.debt_amount && financials.debt_rate ? financials.debt_amount * financials.debt_rate / 100 : null);
    const equity = price && financials.debt_amount ? price - financials.debt_amount : null;

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

    return { capRate, grm, expenseRatio, noiPerUnit, pricePerUnit, noiPerSf, pricePerSf, breakEvenOcc, dscr, coc, preTaxCashFlow, debtSvc, equity };
  }, [financials, property]);

  const hasResponded = !!matchResult?.client_response;
  const showButtons = !hasResponded || showChangeResponse;

  const imgUrls = images.map((img) => supabase.storage.from("inventory-images").getPublicUrl(img.storage_path).data.publicUrl);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!access || !property) return <p className="py-20 text-center text-muted-foreground">Match not found or access denied.</p>;

  const openInterest = () => { setResponseNote(""); setInterestDialogOpen(true); };
  const openPass = () => { setResponseNote(""); setPassDialogOpen(true); };

  return (
    <div className="relative">
      {/* Sticky bar */}
      {showStickyBar && (
        <div className="sticky top-0 z-30 -mx-6 border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <p className="font-semibold text-foreground truncate">{property.name || "Property"}</p>
              <span className="text-sm text-muted-foreground">{fmt(financials?.asking_price)}</span>
            </div>
            <ResponseButtons show={showButtons} matchResult={matchResult} onInterest={openInterest} onPass={openPass} />
          </div>
        </div>
      )}

      <button onClick={() => navigate("/dashboard/matches")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Matches
      </button>

      {/* ═══ Section 1: Photo Gallery Hero ═══ */}
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

      {/* ═══ Section 2: Property Header ═══ */}
      <div ref={headerRef} className="mt-6 rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{property.name || property.address || "Replacement Property"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[property.address, property.city, property.state, property.zip].filter(Boolean).join(", ")}</span>
              {property.asset_type && <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{ASSET_TYPE_LABELS[property.asset_type]}</span>}
              {property.year_built && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Built {property.year_built}</span>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="text-2xl font-bold text-primary">{fmt(financials?.asking_price)}</span>
              {metrics?.capRate != null && <span className="text-sm text-muted-foreground">{metrics.capRate.toFixed(1)}% Cap</span>}
              {financials?.noi && <span className="text-sm text-muted-foreground">{fmt(financials.noi)} NOI</span>}
              {property.units && <span className="text-sm text-muted-foreground">{property.units} units</span>}
              {matchResult && <Badge variant="outline" className="ml-2">Match Score: {Math.round(matchResult.total_score)}/100</Badge>}
            </div>
          </div>
          <ResponseArea matchResult={matchResult} hasResponded={hasResponded} showButtons={showButtons} onInterest={openInterest} onPass={openPass} onChangeResponse={() => setShowChangeResponse(true)} />
        </div>
      </div>

      {/* ═══ Section 3: Financial Overview Cards ═══ */}
      {financials && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricCard label="Asking Price" value={fmt(financials.asking_price)} />
          <MetricCard label="NOI" value={fmt(financials.noi)} />
          <MetricCard label="Cap Rate" value={pct(metrics?.capRate)} colorClass={metrics?.capRate ? metricColor(metrics.capRate, [4, 6]) : undefined} />
          <MetricCard label="Cash-on-Cash" value={metrics?.coc != null ? pct(metrics.coc) : "—"} colorClass={metrics?.coc != null ? metricColor(metrics.coc, [5, 8]) : undefined} />
          <MetricCard label={property.units ? "Price / Unit" : "Price / SF"} value={property.units ? fmt(metrics?.pricePerUnit) : fmt(metrics?.pricePerSf)} />
          <MetricCard label="Occupancy" value={pct(financials.occupancy_rate)} colorClass={financials.occupancy_rate ? metricColor(Number(financials.occupancy_rate), [85, 93]) : undefined} />
        </div>
      )}

      {/* ═══ Section 4: Investment Analysis ═══ */}
      {metrics && (
        <div className="mt-6">
          <SectionHeader title="Investment Analysis">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Metrics grid */}
              <div className="space-y-3">
                {[
                  { label: "Cap Rate", value: pct(metrics.capRate), color: metrics.capRate ? metricColor(metrics.capRate, [4, 6]) : "" },
                  { label: "Gross Rent Multiplier", value: metrics.grm ? metrics.grm.toFixed(2) + "x" : "—", color: "" },
                  { label: "Expense Ratio", value: pct(metrics.expenseRatio), color: metrics.expenseRatio ? metricColor(metrics.expenseRatio, [40, 55], true) : "" },
                  { label: property.units ? "NOI / Unit" : "NOI / SF", value: property.units ? fmt(metrics.noiPerUnit) : fmt(metrics.noiPerSf), color: "" },
                  { label: property.units ? "Price / Unit" : "Price / SF", value: property.units ? fmt(metrics.pricePerUnit) : fmt(metrics.pricePerSf), color: "" },
                  { label: "Break-Even Occupancy", value: pct(metrics.breakEvenOcc), color: "" },
                  { label: "DSCR", value: metrics.dscr ? metrics.dscr.toFixed(2) + "x" : "—", color: metrics.dscr ? metricColor(metrics.dscr, [1.0, 1.25]) : "" },
                  { label: "Cash-on-Cash Return", value: pct(metrics.coc), color: metrics.coc != null ? metricColor(metrics.coc, [5, 8]) : "" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                    <span className="text-sm text-muted-foreground">{m.label}</span>
                    <span className={`text-sm font-semibold ${m.color || "text-foreground"}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="space-y-6">
                {/* Revenue vs Expenses */}
                {financials.annual_revenue && financials.annual_expenses && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue vs Expenses</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[
                        { name: "Revenue", value: Number(financials.annual_revenue) },
                        { name: "NOI", value: Number(financials.noi ?? 0) },
                        { name: "Expenses", value: Number(financials.annual_expenses) },
                      ]} layout="vertical" margin={{ left: 70, right: 20 }}>
                        <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} fontSize={11} />
                        <YAxis type="category" dataKey="name" fontSize={12} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          <Cell fill="hsl(var(--primary))" />
                          <Cell fill="hsl(142 71% 45%)" />
                          <Cell fill="hsl(var(--muted-foreground))" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Returns comparison */}
                {(metrics.capRate || metrics.coc) && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Profile</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={[
                        ...(metrics.capRate ? [{ name: "Cap Rate", value: metrics.capRate }] : []),
                        ...(metrics.coc != null ? [{ name: "Cash-on-Cash", value: metrics.coc }] : []),
                      ]} margin={{ left: 20, right: 20 }}>
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis tickFormatter={(v) => `${v}%`} fontSize={11} />
                        <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Occupancy gauge */}
                {financials.occupancy_rate && metrics.breakEvenOcc && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Occupancy vs Break-Even</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Occupancy</span>
                        <span className="font-semibold text-foreground">{pct(financials.occupancy_rate)}</span>
                      </div>
                      <Progress value={Number(financials.occupancy_rate)} className="h-3" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Break-Even</span>
                        <span className="font-semibold text-muted-foreground">{pct(metrics.breakEvenOcc)}</span>
                      </div>
                      <Progress value={metrics.breakEvenOcc} className="h-3 [&>div]:bg-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Spread: <span className="font-medium text-green-600">{(Number(financials.occupancy_rate) - metrics.breakEvenOcc).toFixed(1)}pp</span> above break-even
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionHeader>
        </div>
      )}

      {/* ═══ Section 5: Exchange Fit ═══ */}
      {exchangeReq && (
        <div className="mt-6">
          <SectionHeader title="Exchange Fit">
            {/* Side-by-side comparison */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left text-xs font-medium text-muted-foreground">Metric</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">Your Property</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground">This Property</th>
                    <th className="pb-2 text-right text-xs font-medium text-muted-foreground w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <CompRow label="Est. Value / Price" yours={fmt(exchangeReq.relinquished_estimated_value)} theirs={fmt(financials?.asking_price)} better={financials?.asking_price && exchangeReq.relinquished_estimated_value ? null : null} />
                  <CompRow label="NOI" yours={fmt(exchangeReq.current_noi)} theirs={fmt(financials?.noi)} better={financials?.noi && exchangeReq.current_noi ? (Number(financials.noi) > Number(exchangeReq.current_noi) ? "up" : Number(financials.noi) < Number(exchangeReq.current_noi) ? "down" : null) : null} />
                  <CompRow label="Cap Rate" yours={exchangeReq.current_cap_rate ? pct(exchangeReq.current_cap_rate) : "—"} theirs={metrics?.capRate ? pct(metrics.capRate) : "—"} better={metrics?.capRate && exchangeReq.current_cap_rate ? (metrics.capRate > Number(exchangeReq.current_cap_rate) ? "up" : metrics.capRate < Number(exchangeReq.current_cap_rate) ? "down" : null) : null} />
                  <CompRow label="Units / SF" yours={exchangeReq.units ? num(exchangeReq.units) : num(exchangeReq.building_square_footage)} theirs={property.units ? num(property.units) : num(property.square_footage)} />
                  <CompRow label="Year Built" yours={exchangeReq.year_built ?? "—"} theirs={property.year_built ? String(property.year_built) : "—"} better={property.year_built && exchangeReq.year_built ? (property.year_built > Number(exchangeReq.year_built) ? "up" : property.year_built < Number(exchangeReq.year_built) ? "down" : null) : null} />
                  <CompRow label="Occupancy" yours={exchangeReq.current_occupancy_rate ? pct(exchangeReq.current_occupancy_rate) : "—"} theirs={financials?.occupancy_rate ? pct(financials.occupancy_rate) : "—"} better={financials?.occupancy_rate && exchangeReq.current_occupancy_rate ? (Number(financials.occupancy_rate) > Number(exchangeReq.current_occupancy_rate) ? "up" : Number(financials.occupancy_rate) < Number(exchangeReq.current_occupancy_rate) ? "down" : null) : null} />
                  <CompRow label="Asset Type" yours={exchangeReq.relinquished_asset_type ? ASSET_TYPE_LABELS[exchangeReq.relinquished_asset_type as keyof typeof ASSET_TYPE_LABELS] || exchangeReq.relinquished_asset_type : "—"} theirs={property.asset_type ? ASSET_TYPE_LABELS[property.asset_type] : "—"} />
                  <CompRow label="Strategy" yours={exchangeReq.sale_timeline ? STRATEGY_TYPE_LABELS[exchangeReq.sale_timeline as keyof typeof STRATEGY_TYPE_LABELS] || exchangeReq.sale_timeline : "—"} theirs={property.strategy_type ? STRATEGY_TYPE_LABELS[property.strategy_type] : "—"} />
                </tbody>
              </table>
            </div>

            {/* Match score breakdown */}
            {matchResult && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match Score Breakdown</p>
                {SCORE_DIMENSIONS.map((dim) => {
                  const score = Number(matchResult[dim.key] ?? 0);
                  return (
                    <div key={dim.key} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">{dim.label} ({dim.weight})</span>
                      <div className="flex-1">
                        <Progress value={score} className="h-2" />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-foreground">{Math.round(score)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionHeader>
        </div>
      )}

      {/* ═══ Section 6: Property Details ═══ */}
      <div className="mt-6">
        <SectionHeader title="Property Details">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {property.asset_type && <Detail label="Asset Type" value={ASSET_TYPE_LABELS[property.asset_type]} />}
            {(property as any).asset_subtype && <Detail label="Subtype" value={(property as any).asset_subtype} />}
            {property.strategy_type && <Detail label="Strategy" value={STRATEGY_TYPE_LABELS[property.strategy_type]} />}
            {(property as any).property_class && <Detail label="Class" value={(property as any).property_class} />}
            {property.units && <Detail label="Units" value={num(property.units)} />}
            {property.square_footage && <Detail label="Square Footage" value={num(property.square_footage) + " SF"} />}
            {(property as any).land_area_acres && <Detail label="Land Area" value={(property as any).land_area_acres + " acres"} />}
            {property.year_built && <Detail label="Year Built" value={String(property.year_built)} />}
            {(property as any).num_stories && <Detail label="Stories" value={String((property as any).num_stories)} />}
            {(property as any).num_buildings && <Detail label="Buildings" value={String((property as any).num_buildings)} />}
            {(property as any).parking_spaces && <Detail label="Parking" value={[(property as any).parking_spaces + " spaces", (property as any).parking_type].filter(Boolean).join(" · ")} />}
            {(property as any).construction_type && <Detail label="Construction" value={(property as any).construction_type} />}
            {(property as any).roof_type && <Detail label="Roof" value={(property as any).roof_type} />}
            {(property as any).hvac_type && <Detail label="HVAC" value={(property as any).hvac_type} />}
            {(property as any).property_condition && <Detail label="Condition" value={(property as any).property_condition} />}
            {(property as any).zoning && <Detail label="Zoning" value={(property as any).zoning} />}
          </div>
          {(property as any).amenities?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs text-muted-foreground">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {(property as any).amenities.map((a: string) => (
                  <span key={a} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">{a}</span>
                ))}
              </div>
            </div>
          )}
          {property.description && <p className="mt-4 border-t pt-4 text-sm text-muted-foreground leading-relaxed">{property.description}</p>}
        </SectionHeader>
      </div>

      {/* ═══ Section 7: Financial Detail (Operating Statement) ═══ */}
      {financials && (
        <div className="mt-6">
          <SectionHeader title="Financial Detail" defaultOpen={false}>
            <table className="w-full text-sm">
              <tbody className="divide-y">
                <FinRow label="Gross Scheduled Income" value={fmt(financials.gross_scheduled_income ?? financials.annual_revenue)} bold />
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
                    <FinRow label="Loan Amount" value={fmt(financials.debt_amount ?? (financials as any).loan_amount)} indent />
                    <FinRow label="Interest Rate" value={pct(financials.debt_rate ?? (financials as any).loan_rate)} indent />
                    <FinRow label="Annual Debt Service" value={fmt(metrics.debtSvc)} indent />
                    <tr><td colSpan={2} className="py-1" /></tr>
                    <FinRow label="Pre-Tax Cash Flow" value={fmt(metrics.preTaxCashFlow)} bold highlight />
                  </>
                )}
              </tbody>
            </table>
          </SectionHeader>
        </div>
      )}

      {/* ═══ Section 8: Location ═══ */}
      <div className="mt-6">
        <SectionHeader title="Location" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="City" value={property.city || "—"} />
            <Detail label="State" value={property.state || "—"} />
            <Detail label="ZIP" value={property.zip || "—"} />
            <Detail label="Address" value={property.address || "—"} />
          </div>
        </SectionHeader>
      </div>

      {/* ═══ Section 9: Bottom CTA ═══ */}
      <div className="mt-8 rounded-xl border bg-card p-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 className="font-semibold text-foreground">Interested in this property?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Let your advisor know and we'll take it from here.</p>
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

// ── Sub-components ──

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

function CompRow({ label, yours, theirs, better }: { label: string; yours: string; theirs: string; better?: "up" | "down" | null }) {
  return (
    <tr>
      <td className="py-2.5 text-muted-foreground">{label}</td>
      <td className="py-2.5 text-right font-medium text-foreground">{yours}</td>
      <td className="py-2.5 text-right font-medium text-foreground">{theirs}</td>
      <td className="py-2.5 text-right">
        {better === "up" && <span className="text-green-600 text-xs font-medium">▲</span>}
        {better === "down" && <span className="text-amber-500 text-xs font-medium">▼</span>}
      </td>
    </tr>
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
