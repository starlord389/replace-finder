import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Zap, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
  URGENCY_OPTIONS,
} from "@/lib/constants";
import type { Tables, Enums } from "@/integrations/supabase/types";

// --- Pipeline transition config ---
type StatusAction = {
  label: string;
  target: Enums<"request_status">;
  variant: "default" | "outline" | "secondary" | "destructive";
  placeholder: string;
};

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  draft: [{ label: "Mark as Submitted", target: "submitted", variant: "default", placeholder: "Any notes about this submission?" }],
  submitted: [{ label: "Begin Review", target: "under_review", variant: "default", placeholder: "What are you looking for as you review this request?" }],
  under_review: [
    { label: "Activate", target: "active", variant: "default", placeholder: "Any notes before activating and running matches?" },
    { label: "Close Request", target: "closed", variant: "outline", placeholder: "Reason for closing this request..." },
  ],
  active: [{ label: "Close Request", target: "closed", variant: "outline", placeholder: "Reason for closing this request..." }],
  closed: [{ label: "Reopen", target: "active", variant: "secondary", placeholder: "Why is this request being reopened?" }],
};

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [request, setRequest] = useState<Tables<"exchange_requests"> | null>(null);
  const [prefs, setPrefs] = useState<Tables<"exchange_request_preferences"> | null>(null);
  const [history, setHistory] = useState<Tables<"exchange_request_status_history">[]>([]);
  const [notes, setNotes] = useState<Tables<"admin_notes">[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [runningMatch, setRunningMatch] = useState(false);
  const [matchRuns, setMatchRuns] = useState<any[]>([]);
  const [responseSummary, setResponseSummary] = useState({ total: 0, interested: 0, passed: 0, awaiting: 0 });
  const [photos, setPhotos] = useState<Tables<"request_images">[]>([]);

  // Status dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const [statusNote, setStatusNote] = useState("");

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("exchange_requests").select("*").eq("id", id).single(),
      supabase.from("exchange_request_preferences").select("*").eq("request_id", id).maybeSingle(),
      supabase.from("exchange_request_status_history").select("*").eq("request_id", id).order("created_at", { ascending: false }),
      supabase.from("admin_notes").select("*").eq("request_id", id).order("created_at", { ascending: false }),
      supabase.from("match_runs").select("*").eq("request_id", id).order("created_at", { ascending: false }),
      supabase.from("request_images").select("*").eq("request_id", id).order("sort_order"),
    ]).then(async ([reqRes, prefRes, histRes, noteRes, runsRes, photosRes]) => {
      setRequest(reqRes.data);
      setPrefs(prefRes.data);
      setHistory(histRes.data ?? []);
      setNotes(noteRes.data ?? []);
      setMatchRuns(runsRes.data ?? []);
      setPhotos(photosRes.data ?? []);

      const { data: matchResultsData } = await supabase
        .from("match_results")
        .select("id, status, client_response")
        .eq("request_id", id)
        .eq("status", "approved");
      const mr = matchResultsData ?? [];
      setResponseSummary({
        total: mr.length,
        interested: mr.filter((r) => r.client_response === "interested").length,
        passed: mr.filter((r) => r.client_response === "passed").length,
        awaiting: mr.filter((r) => !r.client_response).length,
      });

      setLoading(false);
    });
  }, [id]);

  const runMatching = async () => {
    if (!id || !user) return;
    setRunningMatch(true);
    try {
      const res = await supabase.functions.invoke("run-matching", { body: { request_id: id } });
      if (res.error) throw res.error;
      toast({ title: "Matching complete", description: `Scored ${res.data.total_scored} properties` });
      const { data: runs } = await supabase.from("match_runs").select("*").eq("request_id", id).order("created_at", { ascending: false });
      setMatchRuns(runs ?? []);
    } catch (err: any) {
      toast({ title: "Matching failed", description: err.message, variant: "destructive" });
    } finally {
      setRunningMatch(false);
    }
  };

  const openStatusDialog = (action: StatusAction) => {
    setPendingAction(action);
    setStatusNote("");
    setStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!request || !user || !id || !pendingAction || !statusNote.trim()) return;
    const oldStatus = request.status;
    const newStatus = pendingAction.target;

    await supabase.from("exchange_requests").update({ status: newStatus }).eq("id", id);
    await supabase.from("exchange_request_status_history").insert({
      request_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: user.id,
      note: statusNote.trim(),
    });

    setRequest({ ...request, status: newStatus });
    setHistory((prev) => [
      { id: crypto.randomUUID(), request_id: id, old_status: oldStatus, new_status: newStatus, changed_by: user.id, note: statusNote.trim(), created_at: new Date().toISOString() },
      ...prev,
    ]);
    toast({ title: "Status updated", description: `Changed to ${REQUEST_STATUS_LABELS[newStatus]}` });
    setStatusDialogOpen(false);
    setPendingAction(null);
    setStatusNote("");
  };

  const addNote = async () => {
    if (!newNote.trim() || !user || !id) return;
    const { data } = await supabase.from("admin_notes").insert({
      request_id: id,
      author_id: user.id,
      content: newNote.trim(),
    }).select().single();
    if (data) setNotes((prev) => [data, ...prev]);
    setNewNote("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!request) {
    return <p className="py-20 text-center text-muted-foreground">Request not found.</p>;
  }

  const currency = (v: number | null | undefined) => (v != null ? `$${Number(v).toLocaleString()}` : null);
  const pct = (v: number | null | undefined) => (v != null ? `${Number(v)}%` : null);
  const num = (v: number | null | undefined) => (v != null ? Number(v).toLocaleString() : null);
  const yesNo = (v: boolean | null | undefined) => (v == null ? null : v ? "Yes" : "No");

  const calculatedCapRate =
    request.current_cap_rate != null
      ? pct(request.current_cap_rate)
      : request.current_noi != null && request.relinquished_estimated_value
        ? `${((Number(request.current_noi) / Number(request.relinquished_estimated_value)) * 100).toFixed(2)}% (calc)`
        : null;

  const urgencyLabel = URGENCY_OPTIONS.find((o) => o.value === request.urgency)?.label || request.urgency;

  // Income & Expenses data
  const incomeExpenseItems: [string, string | null][] = [
    ["Gross Scheduled Income", currency(request.gross_scheduled_income)],
    ["Effective Gross Income", currency(request.effective_gross_income)],
    ["Real Estate Taxes", currency(request.real_estate_taxes)],
    ["Insurance", currency(request.insurance)],
    ["Utilities", currency(request.utilities)],
    ["Management Fee", currency(request.management_fee)],
    ["Maintenance / Repairs", currency(request.maintenance_repairs)],
    ["CapEx Reserves", currency(request.capex_reserves)],
    ["Other Expenses", currency(request.other_expenses)],
  ].filter(([, v]) => v != null) as [string, string][];

  // Debt data
  const hasDebtData = [
    request.current_loan_balance, request.current_interest_rate, request.loan_type,
    request.loan_maturity_date, request.annual_debt_service, request.has_prepayment_penalty,
  ].some((v) => v != null);

  // Physical fields — only render those with data
  const physicalItems: [string, string][] = (
    [
      ["Units", request.unit_suite],
      ["Building SF", num(request.building_square_footage)],
      ["Land Area", request.land_area_acres != null ? `${Number(request.land_area_acres)} acres` : null],
      ["Year Built", null], // not on exchange_requests
      ["Num Buildings", num(request.num_buildings)],
      ["Num Stories", num(request.num_stories)],
      ["Parking", [request.parking_spaces != null ? `${request.parking_spaces} spaces` : null, request.parking_type].filter(Boolean).join(" — ") || null],
      ["Construction Type", request.construction_type],
      ["Roof Type", request.roof_type],
      ["HVAC Type", request.hvac_type],
      ["Property Condition", request.property_condition],
      ["Zoning", request.zoning],
    ] as [string, string | null | undefined][]
  ).filter(([, v]) => v != null && v !== "") as [string, string][];

  const hasPhysical = physicalItems.length > 0 || (request.recent_renovations) || (request.amenities && request.amenities.length > 0);

  // Photo URLs
  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("request-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const actions = STATUS_ACTIONS[request.status] ?? [];

  return (
    <div>
      <button onClick={() => navigate("/admin/requests")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {request.property_name || (request.relinquished_city && request.relinquished_state
              ? `${request.relinquished_city}, ${request.relinquished_state}`
              : "Exchange Request")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${REQUEST_STATUS_COLORS[request.status]}`}>
          {REQUEST_STATUS_LABELS[request.status]}
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* ===== MAIN CONTENT ===== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Relinquished Property (expanded) */}
          <Section title="Relinquished Property">
            <Grid>
              <Item label="Address" value={[request.relinquished_address, request.relinquished_city, request.relinquished_state, request.relinquished_zip].filter(Boolean).join(", ") || "—"} />
              <Item label="Type" value={request.relinquished_asset_type ? ASSET_TYPE_LABELS[request.relinquished_asset_type] : "—"} />
              <Item label="Estimated Value" value={currency(request.relinquished_estimated_value) || "—"} />
              {request.property_name && <Item label="Property Name" value={request.property_name} />}
              {request.asset_subtype && <Item label="Asset Subtype" value={request.asset_subtype} />}
              {request.property_class && <Item label="Property Class" value={request.property_class} />}
              {request.relinquished_description && <Item label="Description" value={request.relinquished_description} />}
            </Grid>
          </Section>

          {/* Physical Description */}
          {hasPhysical && (
            <Section title="Physical Description">
              {physicalItems.length > 0 && (
                <Grid>
                  {physicalItems.map(([label, value]) => (
                    <Item key={label} label={label} value={value} />
                  ))}
                </Grid>
              )}
              {request.recent_renovations && (
                <div className={physicalItems.length > 0 ? "mt-4" : ""}>
                  <p className="text-xs text-muted-foreground">Recent Renovations</p>
                  <p className="mt-0.5 text-sm text-foreground">{request.recent_renovations}</p>
                </div>
              )}
              {request.amenities && request.amenities.length > 0 && (
                <div className={physicalItems.length > 0 || request.recent_renovations ? "mt-4" : ""}>
                  <p className="mb-2 text-xs text-muted-foreground">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.amenities.map((a) => (
                      <Badge key={a} variant="secondary" className="rounded-full bg-primary/10 text-primary border-0 text-xs">
                        {a}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Exchange Economics (expanded) */}
          <Section title="Exchange Economics">
            <Grid>
              <Item label="Equity" value={currency(request.estimated_equity) || "—"} />
              <Item label="Debt" value={currency(request.estimated_debt) || "—"} />
              <Item label="Proceeds" value={currency(request.exchange_proceeds) || "—"} />
              <Item label="Basis" value={currency(request.estimated_basis) || "—"} />
              {(request.current_noi != null) && <Item label="Current NOI" value={currency(request.current_noi)!} />}
              {calculatedCapRate && <Item label="Current Cap Rate" value={calculatedCapRate} />}
              {request.current_occupancy_rate != null && <Item label="Current Occupancy" value={pct(request.current_occupancy_rate)!} />}
              {request.average_rent_per_unit != null && <Item label="Avg Rent / Unit" value={currency(request.average_rent_per_unit)!} />}
            </Grid>
          </Section>

          {/* Income & Expenses */}
          {incomeExpenseItems.length > 0 && (
            <Section title="Income & Expenses">
              <div className="space-y-1">
                {incomeExpenseItems.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Debt Details */}
          {hasDebtData && (
            <Section title="Debt Details">
              <Grid>
                {request.current_loan_balance != null && <Item label="Loan Balance" value={currency(request.current_loan_balance)!} />}
                {request.current_interest_rate != null && <Item label="Interest Rate" value={pct(request.current_interest_rate)!} />}
                {request.loan_type && <Item label="Loan Type" value={request.loan_type} />}
                {request.loan_maturity_date && <Item label="Maturity Date" value={new Date(request.loan_maturity_date).toLocaleDateString()} />}
                {request.annual_debt_service != null && <Item label="Annual Debt Service" value={currency(request.annual_debt_service)!} />}
                {request.has_prepayment_penalty != null && <Item label="Prepayment Penalty" value={yesNo(request.has_prepayment_penalty)!} />}
                {request.has_prepayment_penalty && request.prepayment_penalty_details && (
                  <Item label="Penalty Details" value={request.prepayment_penalty_details} />
                )}
              </Grid>
            </Section>
          )}

          {/* Replacement Goals (expanded) */}
          {prefs && (
            <Section title="Replacement Goals">
              <Grid>
                <Item label="Price Range" value={`${currency(prefs.target_price_min) || "—"} – ${currency(prefs.target_price_max) || "—"}`} />
                <Item label="Asset Types" value={prefs.target_asset_types?.map((t) => ASSET_TYPE_LABELS[t]).join(", ") || "—"} />
                <Item label="Strategies" value={prefs.target_strategies?.map((s) => STRATEGY_TYPE_LABELS[s]).join(", ") || "—"} />
                <Item label="Cap Rate" value={prefs.target_cap_rate_min || prefs.target_cap_rate_max ? `${prefs.target_cap_rate_min ?? "—"}% – ${prefs.target_cap_rate_max ?? "—"}%` : "—"} />
                <Item label="States" value={prefs.target_states?.join(", ") || "—"} />
                <Item label="Metros" value={prefs.target_metros?.join(", ") || "—"} />
                {prefs.target_occupancy_min != null && <Item label="Min Occupancy" value={pct(prefs.target_occupancy_min)!} />}
                {prefs.target_year_built_min != null && <Item label="Min Year Built" value={String(prefs.target_year_built_min)} />}
              </Grid>
              {/* Badges row */}
              <div className="mt-4 flex flex-wrap gap-2">
                {prefs.target_property_classes && prefs.target_property_classes.length > 0 && prefs.target_property_classes.map((c) => (
                  <Badge key={c} variant="secondary" className="rounded-full text-xs">{c}</Badge>
                ))}
                {prefs.open_to_dsts != null && (
                  <Badge variant={prefs.open_to_dsts ? "default" : "outline"} className="rounded-full text-xs">
                    DSTs: {yesNo(prefs.open_to_dsts)}
                  </Badge>
                )}
                {prefs.open_to_tics != null && (
                  <Badge variant={prefs.open_to_tics ? "default" : "outline"} className="rounded-full text-xs">
                    TICs: {yesNo(prefs.open_to_tics)}
                  </Badge>
                )}
              </div>
              {request.urgency && (
                <div className="mt-3">
                  <Item label="Urgency" value={urgencyLabel || "—"} />
                </div>
              )}
              {prefs.additional_notes && (
                <div className="mt-3">
                  <Item label="Notes" value={prefs.additional_notes} />
                </div>
              )}
            </Section>
          )}

          {/* Timing */}
          <Section title="Timing">
            <Grid>
              <Item label="Sale Timeline" value={request.sale_timeline || "—"} />
              <Item label="45-Day ID Deadline" value={request.identification_deadline ? new Date(request.identification_deadline).toLocaleDateString() : "—"} />
              <Item label="180-Day Close" value={request.close_deadline ? new Date(request.close_deadline).toLocaleDateString() : "—"} />
              <Item label="Urgency" value={urgencyLabel || "—"} />
            </Grid>
          </Section>

          {/* Client Photos */}
          {photos.length > 0 && (
            <Section title={`Client Photos (${photos.length})`}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p) => {
                  const url = getPhotoUrl(p.storage_path);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setLightboxPhoto(url)}
                      className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                    >
                      <img
                        src={url}
                        alt={p.file_name || "Property photo"}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  );
                })}
              </div>
            </Section>
          )}
        </div>

        {/* ===== SIDEBAR ===== */}
        <div className="space-y-6">
          {/* Status Actions */}
          {actions.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-foreground">Status Actions</h3>
              <div className="mt-3 space-y-2">
                {actions.map((action) => (
                  <Button
                    key={action.target}
                    variant={action.variant}
                    className="w-full"
                    onClick={() => openStatusDialog(action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Matching */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground">Property Matching</h3>
            <Button className="mt-3 w-full" onClick={runMatching} disabled={runningMatch}>
              <Zap className="mr-2 h-4 w-4" />
              {runningMatch ? "Running…" : "Run Matching Engine"}
            </Button>
            {matchRuns.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-3">
                {matchRuns.map((run: any) => (
                  <button
                    key={run.id}
                    onClick={() => navigate(`/admin/matches/${run.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium text-foreground">{run.total_properties_scored ?? 0} properties scored</p>
                      <p className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      run.status === "completed" ? "bg-green-100 text-green-800" :
                      run.status === "failed" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {run.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Match Response Summary */}
          {responseSummary.total > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-foreground">Match Response Summary</h3>
              <div className="mt-3 space-y-2">
                <SummaryRow label="Total Approved" value={responseSummary.total} />
                <SummaryRow label="Interested" value={responseSummary.interested} color="text-green-700" />
                <SummaryRow label="Passed" value={responseSummary.passed} color="text-red-700" />
                <SummaryRow label="Awaiting Response" value={responseSummary.awaiting} color="text-amber-700" />
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground">Admin Notes</h3>
            <div className="mt-4 space-y-2">
              <Textarea placeholder="Add a note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>Add Note</Button>
            </div>
            {notes.length > 0 && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {notes.map((n) => (
                  <div key={n.id}>
                    <p className="text-sm text-foreground">{n.content}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status History */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground">Status History</h3>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No changes yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="text-sm">
                    <p className="text-foreground">
                      {h.old_status ? `${REQUEST_STATUS_LABELS[h.old_status]} → ` : ""}
                      {REQUEST_STATUS_LABELS[h.new_status]}
                    </p>
                    {h.note && <p className="mt-0.5 text-xs italic text-muted-foreground">{h.note}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Change status to {pendingAction ? REQUEST_STATUS_LABELS[pendingAction.target] : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Add a note about this status change. This will be recorded in the status history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={pendingAction?.placeholder}
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={!statusNote.trim()} onClick={confirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo Lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
        <DialogContent className="max-w-3xl p-2">
          {lightboxPhoto && (
            <img src={lightboxPhoto} alt="Property photo" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Helper components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}
