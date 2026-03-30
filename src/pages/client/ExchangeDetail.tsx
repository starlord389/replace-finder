import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

export default function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [request, setRequest] = useState<Tables<"exchange_requests"> | null>(null);
  const [timeline, setTimeline] = useState<Tables<"exchange_request_status_history">[]>([]);
  const [prefs, setPrefs] = useState<Tables<"exchange_request_preferences"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const [reqRes, histRes, prefRes] = await Promise.all([
        supabase.from("exchange_requests").select("*").eq("id", id).eq("user_id", user.id).single(),
        supabase.from("exchange_request_status_history").select("*").eq("request_id", id).order("created_at", { ascending: true }),
        supabase.from("exchange_request_preferences").select("*").eq("request_id", id).maybeSingle(),
      ]);
      setRequest(reqRes.data);
      setTimeline(histRes.data ?? []);
      setPrefs(prefRes.data);
      setLoading(false);
    })();
  }, [user, id]);

  const currency = (v: number | null) => (v ? `$${Number(v).toLocaleString()}` : "—");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Exchange request not found.</p>
        <Link to="/dashboard/exchanges" className="mt-4 inline-block">
          <Button variant="outline">Back to Exchanges</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link to="/dashboard/exchanges" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Exchanges
      </Link>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">
                {request.relinquished_city && request.relinquished_state
                  ? `${request.relinquished_city}, ${request.relinquished_state}`
                  : "Exchange Request"}
              </h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REQUEST_STATUS_COLORS[request.status]}`}>
                {REQUEST_STATUS_LABELS[request.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {request.relinquished_asset_type ? ASSET_TYPE_LABELS[request.relinquished_asset_type] : ""}
              {request.relinquished_address ? ` · ${request.relinquished_address}` : ""}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
        </div>

        {/* Financials */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Estimated Value</p>
            <p className="text-sm font-semibold text-foreground">{currency(request.relinquished_estimated_value)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Proceeds</p>
            <p className="text-sm font-semibold text-foreground">{currency(request.exchange_proceeds)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Equity</p>
            <p className="text-sm font-semibold text-foreground">{currency(request.estimated_equity)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Basis</p>
            <p className="text-sm font-semibold text-foreground">{currency(request.estimated_basis)}</p>
          </div>
        </div>

        {/* Deadlines */}
        {(request.identification_deadline || request.close_deadline) && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {request.identification_deadline && (
              <div>
                <p className="text-xs text-muted-foreground">ID Deadline</p>
                <p className="text-sm font-semibold text-foreground">{new Date(request.identification_deadline).toLocaleDateString()}</p>
              </div>
            )}
            {request.close_deadline && (
              <div>
                <p className="text-xs text-muted-foreground">Close Deadline</p>
                <p className="text-sm font-semibold text-foreground">{new Date(request.close_deadline).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Timeline</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm text-foreground">Submitted</p>
                <p className="text-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
              </div>
              {timeline.map((h) => (
                <div key={h.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <p className="text-sm text-foreground">{REQUEST_STATUS_LABELS[h.new_status]}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences */}
        {prefs && (
          <div className="mt-6 border-t pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Target Preferences</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {prefs.target_states && prefs.target_states.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">States</p>
                  <p className="text-sm font-medium text-foreground">{prefs.target_states.join(", ")}</p>
                </div>
              )}
              {prefs.target_price_min != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Min Price</p>
                  <p className="text-sm font-medium text-foreground">{currency(prefs.target_price_min)}</p>
                </div>
              )}
              {prefs.target_price_max != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Max Price</p>
                  <p className="text-sm font-medium text-foreground">{currency(prefs.target_price_max)}</p>
                </div>
              )}
              {prefs.additional_notes && (
                <div className="col-span-full">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{prefs.additional_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
