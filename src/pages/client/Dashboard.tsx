import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Plus, Building2, MapPin, TrendingUp, Clock, ChevronRight } from "lucide-react";
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
} from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

interface MatchedProperty {
  id: string;
  property_id: string;
  request_id: string;
  match_result_id: string;
  granted_at: string;
  inventory_properties: Tables<"inventory_properties"> | null;
  inventory_financials?: Tables<"inventory_financials"> | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Tables<"exchange_requests">[]>([]);
  const [matches, setMatches] = useState<MatchedProperty[]>([]);
  const [statusHistory, setStatusHistory] = useState<Record<string, Tables<"exchange_request_status_history">[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const [reqRes, accessRes] = await Promise.all([
      supabase
        .from("exchange_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("matched_property_access")
        .select("*, inventory_properties(*)")
        .eq("user_id", user!.id)
        .order("granted_at", { ascending: false }),
    ]);

    const reqs = reqRes.data ?? [];
    setRequests(reqs);

    // Load financials for matched properties and status history for requests
    const matchData = (accessRes.data ?? []) as unknown as MatchedProperty[];

    if (matchData.length > 0) {
      const propertyIds = matchData
        .map((m) => m.property_id)
        .filter(Boolean);
      if (propertyIds.length > 0) {
        const { data: fins } = await supabase
          .from("inventory_financials")
          .select("*")
          .in("property_id", propertyIds);
        const finMap = new Map((fins ?? []).map((f) => [f.property_id, f]));
        matchData.forEach((m) => {
          m.inventory_financials = finMap.get(m.property_id) ?? null;
        });
      }
    }
    setMatches(matchData);

    // Load status history for all requests
    if (reqs.length > 0) {
      const reqIds = reqs.map((r) => r.id);
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
  };

  const currency = (v: number | null) =>
    v ? `$${Number(v).toLocaleString()}` : "—";

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
            Track your exchange requests and review approved matches.
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
        <div className="mt-8 space-y-10">
          {requests.map((req) => {
            const reqMatches = matches.filter((m) => m.request_id === req.id);
            const timeline = statusHistory[req.id] ?? [];

            return (
              <div key={req.id} className="space-y-4">
                {/* Request card */}
                <div className="rounded-xl border bg-card p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-foreground">
                          {req.relinquished_city && req.relinquished_state
                            ? `${req.relinquished_city}, ${req.relinquished_state}`
                            : "Exchange Request"}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REQUEST_STATUS_COLORS[req.status]}`}
                        >
                          {REQUEST_STATUS_LABELS[req.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {req.relinquished_asset_type
                          ? ASSET_TYPE_LABELS[req.relinquished_asset_type]
                          : ""}
                        {req.relinquished_estimated_value
                          ? ` · ${currency(req.relinquished_estimated_value)}`
                          : ""}
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
                        <p className="text-sm font-semibold text-foreground">
                          {currency(req.exchange_proceeds)}
                        </p>
                      </div>
                      {req.estimated_equity && (
                        <div>
                          <p className="text-xs text-muted-foreground">Equity</p>
                          <p className="text-sm font-semibold text-foreground">
                            {currency(req.estimated_equity)}
                          </p>
                        </div>
                      )}
                      {req.identification_deadline && (
                        <div>
                          <p className="text-xs text-muted-foreground">ID Deadline</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(req.identification_deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {req.close_deadline && (
                        <div>
                          <p className="text-xs text-muted-foreground">Close Deadline</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(req.close_deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  {timeline.length > 0 && (
                    <div className="mt-5 border-t pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Timeline
                        </p>
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {/* Initial submission */}
                        <TimelineStep
                          label="Submitted"
                          date={new Date(req.created_at).toLocaleDateString()}
                          active
                        />
                        {timeline.map((h, i) => (
                          <TimelineStep
                            key={h.id}
                            label={REQUEST_STATUS_LABELS[h.new_status]}
                            date={new Date(h.created_at).toLocaleDateString()}
                            active={i === timeline.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Matched properties */}
                {reqMatches.length > 0 && (
                  <div>
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Approved Matches ({reqMatches.length})
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {reqMatches.map((match) => {
                        const prop = match.inventory_properties;
                        const fin = match.inventory_financials;
                        if (!prop) return null;

                        return (
                          <Link
                            key={match.id}
                            to={`/dashboard/match/${match.id}`}
                            className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                  {prop.name || prop.address || "Property"}
                                </h5>
                                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">
                                    {[prop.city, prop.state]
                                      .filter(Boolean)
                                      .join(", ") || "—"}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              {prop.asset_type && (
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Type
                                  </p>
                                  <p className="text-sm font-medium text-foreground">
                                    {ASSET_TYPE_LABELS[prop.asset_type] ?? prop.asset_type}
                                  </p>
                                </div>
                              )}
                              {prop.strategy_type && (
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Strategy
                                  </p>
                                  <p className="text-sm font-medium text-foreground">
                                    {STRATEGY_TYPE_LABELS[prop.strategy_type] ?? prop.strategy_type}
                                  </p>
                                </div>
                              )}
                              {fin?.asking_price && (
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Price
                                  </p>
                                  <p className="text-sm font-medium text-foreground">
                                    {currency(fin.asking_price)}
                                  </p>
                                </div>
                              )}
                              {fin?.cap_rate && (
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Cap Rate
                                  </p>
                                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    {Number(fin.cap_rate).toFixed(1)}%
                                  </p>
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
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

function TimelineStep({
  label,
  date,
  active,
}: {
  label: string;
  date: string;
  active: boolean;
}) {
  return (
    <>
      <div className="flex flex-col items-center min-w-[80px]">
        <div
          className={`h-2.5 w-2.5 rounded-full ${
            active ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        />
        <p
          className={`mt-1.5 text-xs font-medium ${
            active ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">{date}</p>
      </div>
      <div className="h-px w-6 bg-border last:hidden" />
    </>
  );
}
