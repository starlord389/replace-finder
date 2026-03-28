import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Zap } from "lucide-react";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
} from "@/lib/constants";
import type { Tables, Enums } from "@/integrations/supabase/types";

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

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("exchange_requests").select("*").eq("id", id).single(),
      supabase.from("exchange_request_preferences").select("*").eq("request_id", id).maybeSingle(),
      supabase.from("exchange_request_status_history").select("*").eq("request_id", id).order("created_at", { ascending: false }),
      supabase.from("admin_notes").select("*").eq("request_id", id).order("created_at", { ascending: false }),
      supabase.from("match_runs").select("*").eq("request_id", id).order("created_at", { ascending: false }),
    ]).then(([reqRes, prefRes, histRes, noteRes, runsRes]) => {
      setRequest(reqRes.data);
      setPrefs(prefRes.data);
      setHistory(histRes.data ?? []);
      setNotes(noteRes.data ?? []);
      setMatchRuns(runsRes.data ?? []);
      setLoading(false);
    });
  }, [id]);

  const runMatching = async () => {
    if (!id || !user) return;
    setRunningMatch(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("run-matching", {
        body: { request_id: id },
      });
      if (res.error) throw res.error;
      toast({ title: "Matching complete", description: `Scored ${res.data.total_scored} properties` });
      // Refresh match runs
      const { data: runs } = await supabase.from("match_runs").select("*").eq("request_id", id).order("created_at", { ascending: false });
      setMatchRuns(runs ?? []);
    } catch (err: any) {
      toast({ title: "Matching failed", description: err.message, variant: "destructive" });
    } finally {
      setRunningMatch(false);
    }
  };

  const changeStatus = async (newStatus: Enums<"request_status">) => {
    if (!request || !user || !id) return;
    const oldStatus = request.status;

    await supabase.from("exchange_requests").update({ status: newStatus }).eq("id", id);
    await supabase.from("exchange_request_status_history").insert({
      request_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: user.id,
    });

    setRequest({ ...request, status: newStatus });
    setHistory((prev) => [
      { id: crypto.randomUUID(), request_id: id, old_status: oldStatus, new_status: newStatus, changed_by: user.id, note: null, created_at: new Date().toISOString() },
      ...prev,
    ]);
    toast({ title: "Status updated", description: `Changed to ${REQUEST_STATUS_LABELS[newStatus]}` });
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

  const currency = (v: number | null) => v ? `$${Number(v).toLocaleString()}` : "—";

  return (
    <div>
      <button onClick={() => navigate("/admin/requests")} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Requests
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {request.relinquished_city && request.relinquished_state
              ? `${request.relinquished_city}, ${request.relinquished_state}`
              : "Exchange Request"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${REQUEST_STATUS_COLORS[request.status]}`}>
          {REQUEST_STATUS_LABELS[request.status]}
        </span>
      </div>

      {/* Status actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["submitted", "under_review", "active", "closed"] as const).map((s) => (
          <Button
            key={s}
            variant={request.status === s ? "default" : "outline"}
            size="sm"
            disabled={request.status === s}
            onClick={() => changeStatus(s)}
          >
            {REQUEST_STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Relinquished */}
          <Section title="Relinquished Property">
            <Grid>
              <Item label="Address" value={[request.relinquished_address, request.relinquished_city, request.relinquished_state, request.relinquished_zip].filter(Boolean).join(", ")} />
              <Item label="Type" value={request.relinquished_asset_type ? ASSET_TYPE_LABELS[request.relinquished_asset_type] : "—"} />
              <Item label="Estimated Value" value={currency(request.relinquished_estimated_value)} />
              {request.relinquished_description && <Item label="Description" value={request.relinquished_description} />}
            </Grid>
          </Section>

          {/* Economics */}
          <Section title="Exchange Economics">
            <Grid>
              <Item label="Equity" value={currency(request.estimated_equity)} />
              <Item label="Debt" value={currency(request.estimated_debt)} />
              <Item label="Proceeds" value={currency(request.exchange_proceeds)} />
              <Item label="Basis" value={currency(request.estimated_basis)} />
            </Grid>
          </Section>

          {/* Replacement Goals */}
          {prefs && (
            <Section title="Replacement Goals">
              <Grid>
                <Item label="Price Range" value={`${currency(prefs.target_price_min)} – ${currency(prefs.target_price_max)}`} />
                <Item label="Asset Types" value={prefs.target_asset_types?.map((t) => ASSET_TYPE_LABELS[t]).join(", ") || "—"} />
                <Item label="Strategies" value={prefs.target_strategies?.map((s) => STRATEGY_TYPE_LABELS[s]).join(", ") || "—"} />
                <Item label="Cap Rate" value={prefs.target_cap_rate_min || prefs.target_cap_rate_max ? `${prefs.target_cap_rate_min ?? "—"}% – ${prefs.target_cap_rate_max ?? "—"}%` : "—"} />
                <Item label="States" value={prefs.target_states?.join(", ") || "—"} />
                <Item label="Metros" value={prefs.target_metros?.join(", ") || "—"} />
                {prefs.additional_notes && <Item label="Notes" value={prefs.additional_notes} />}
              </Grid>
            </Section>
          )}

          {/* Timing */}
          <Section title="Timing">
            <Grid>
              <Item label="Sale Timeline" value={request.sale_timeline || "—"} />
              <Item label="45-Day ID Deadline" value={request.identification_deadline || "—"} />
              <Item label="180-Day Close" value={request.close_deadline || "—"} />
              <Item label="Urgency" value={request.urgency || "—"} />
            </Grid>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Matching */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground">Property Matching</h3>
            <Button
              className="mt-3 w-full"
              onClick={runMatching}
              disabled={runningMatch}
            >
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
                      <p className="font-medium text-foreground">
                        {run.total_properties_scored ?? 0} properties scored
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.created_at).toLocaleString()}
                      </p>
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

          {/* Admin notes */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground">Admin Notes</h3>
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Add a note…"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </div>
            {notes.length > 0 && (
              <div className="mt-4 space-y-3 border-t pt-4">
                {notes.map((n) => (
                  <div key={n.id}>
                    <p className="text-sm text-foreground">{n.content}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status history */}
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
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
