import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Tables<"exchange_requests">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("exchange_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRequests(data ?? []);
        setLoading(false);
      });
  }, [user]);

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
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your exchange request and review approved matches.
          </p>
        </div>
        <Link to="/dashboard/new-request">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            You haven't submitted an exchange request yet.
          </p>
          <Link to="/dashboard/new-request" className="mt-4 inline-block">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Submit Your First Request
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="rounded-xl border bg-card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-foreground">
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
                    {req.relinquished_estimated_value ? ` · $${Number(req.relinquished_estimated_value).toLocaleString()}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>
              {req.exchange_proceeds && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Proceeds</p>
                    <p className="text-sm font-semibold">${Number(req.exchange_proceeds).toLocaleString()}</p>
                  </div>
                  {req.estimated_equity && (
                    <div>
                      <p className="text-xs text-muted-foreground">Equity</p>
                      <p className="text-sm font-semibold">${Number(req.estimated_equity).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
