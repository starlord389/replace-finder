import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Tables, Enums } from "@/integrations/supabase/types";

export default function RequestQueue() {
  const [requests, setRequests] = useState<(Tables<"exchange_requests"> & { profiles: { full_name: string | null; email: string | null } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Enums<"request_status"> | "all">("all");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const { data } = await supabase
      .from("exchange_requests")
      .select("*, profiles!exchange_requests_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false });
    setRequests((data as any) ?? []);
    setLoading(false);
  };

  const filtered = statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchange Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and manage incoming 1031 exchange requests.
          </p>
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">All statuses</option>
          {Object.entries(REQUEST_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No requests found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((req) => (
            <Link key={req.id} to={`/admin/requests/${req.id}`} className="block">
              <div className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-foreground">
                        {req.profiles?.full_name || req.profiles?.email || "Unknown"}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REQUEST_STATUS_COLORS[req.status]}`}>
                        {REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {req.relinquished_city && req.relinquished_state
                        ? `${req.relinquished_city}, ${req.relinquished_state} · `
                        : ""}
                      {req.relinquished_asset_type ? ASSET_TYPE_LABELS[req.relinquished_asset_type] : ""}
                      {req.relinquished_estimated_value ? ` · $${Number(req.relinquished_estimated_value).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
