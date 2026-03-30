import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock } from "lucide-react";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

export default function Overview() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Tables<"exchange_requests">[]>([]);
  const [statusHistory, setStatusHistory] = useState<Record<string, Tables<"exchange_request_status_history">[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: reqs } = await supabase
        .from("exchange_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const reqData = reqs ?? [];
      setRequests(reqData);

      if (reqData.length > 0) {
        const reqIds = reqData.map((r) => r.id);
        const { data: histData } = await supabase
          .from("exchange_request_status_history")
          .select("*")
          .in("request_id", reqIds)
          .order("created_at", { ascending: true });
        const histMap: Record<string, Tables<"exchange_request_status_history">[]> = {};
        (histData ?? []).forEach((h) => {
          if (!histMap[h.request_id]) histMap[h.request_id] = [];
          histMap[h.request_id].push(h);
        });
        setStatusHistory(histMap);
      }
      setLoading(false);
    })();
  }, [user]);

  const currency = (v: number | null) => (v ? `$${Number(v).toLocaleString()}` : "—");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track all your exchange requests and their current status.</p>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No exchange requests yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((req) => {
            const timeline = statusHistory[req.id] ?? [];
            return (
              <div key={req.id} className="rounded-xl border bg-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {req.relinquished_city && req.relinquished_state
                          ? `${req.relinquished_city}, ${req.relinquished_state}`
                          : "Exchange Request"}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REQUEST_STATUS_COLORS[req.status]}`}>
                        {REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {req.relinquished_asset_type ? ASSET_TYPE_LABELS[req.relinquished_asset_type] : ""}
                      {req.relinquished_estimated_value ? ` · ${currency(req.relinquished_estimated_value)}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                </div>

                {req.exchange_proceeds && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Proceeds</p>
                      <p className="text-sm font-semibold text-foreground">{currency(req.exchange_proceeds)}</p>
                    </div>
                    {req.estimated_equity && (
                      <div>
                        <p className="text-xs text-muted-foreground">Equity</p>
                        <p className="text-sm font-semibold text-foreground">{currency(req.estimated_equity)}</p>
                      </div>
                    )}
                    {req.identification_deadline && (
                      <div>
                        <p className="text-xs text-muted-foreground">ID Deadline</p>
                        <p className="text-sm font-semibold text-foreground">{new Date(req.identification_deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                    {req.close_deadline && (
                      <div>
                        <p className="text-xs text-muted-foreground">Close Deadline</p>
                        <p className="text-sm font-semibold text-foreground">{new Date(req.close_deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {timeline.length > 0 && (
                  <div className="mt-5 border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Timeline</p>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto">
                      <TimelineStep label="Submitted" date={new Date(req.created_at).toLocaleDateString()} active />
                      {timeline.map((h, i) => (
                        <TimelineStep key={h.id} label={REQUEST_STATUS_LABELS[h.new_status]} date={new Date(h.created_at).toLocaleDateString()} active={i === timeline.length - 1} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimelineStep({ label, date, active }: { label: string; date: string; active: boolean }) {
  return (
    <>
      <div className="flex flex-col items-center min-w-[80px]">
        <div className={`h-2.5 w-2.5 rounded-full ${active ? "bg-primary" : "bg-muted-foreground/30"}`} />
        <p className={`mt-1.5 text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</p>
        <p className="text-[10px] text-muted-foreground">{date}</p>
      </div>
      <div className="h-px w-6 bg-border last:hidden" />
    </>
  );
}
