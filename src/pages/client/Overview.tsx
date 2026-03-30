import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS, ASSET_TYPE_LABELS } from "@/lib/constants";
import { ArrowRight, AlertTriangle, Clock, TrendingUp, Users, CalendarClock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

export default function Overview() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Tables<"exchange_requests">[]>([]);
  const [history, setHistory] = useState<(Tables<"exchange_request_status_history"> & { reqLabel?: string })[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [reqRes, matchRes] = await Promise.all([
        supabase.from("exchange_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("matched_property_access").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      const reqs = reqRes.data ?? [];
      setRequests(reqs);
      setMatchCount(matchRes.count ?? 0);

      if (reqs.length > 0) {
        const ids = reqs.map((r) => r.id);
        const { data: hist } = await supabase
          .from("exchange_request_status_history")
          .select("*")
          .in("request_id", ids)
          .order("created_at", { ascending: false })
          .limit(10);

        const labelMap = Object.fromEntries(reqs.map((r) => [r.id, r.relinquished_city && r.relinquished_state ? `${r.relinquished_city}, ${r.relinquished_state}` : "Exchange"]));
        setHistory((hist ?? []).map((h) => ({ ...h, reqLabel: labelMap[h.request_id] })));
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currency = (v: number | null) => (v ? `$${Number(v).toLocaleString()}` : "—");

  const activeCount = requests.filter((r) => r.status === "active" || r.status === "under_review").length;
  const totalProceeds = requests.reduce((s, r) => s + (Number(r.exchange_proceeds) || 0), 0);

  // Deadlines within 60 days
  const now = new Date();
  const deadlines: { label: string; type: string; date: Date; reqId: string }[] = [];
  requests.forEach((r) => {
    const label = r.relinquished_city && r.relinquished_state ? `${r.relinquished_city}, ${r.relinquished_state}` : "Exchange";
    if (r.identification_deadline) {
      const d = new Date(r.identification_deadline);
      if (d > now && (d.getTime() - now.getTime()) / 86400000 <= 60) deadlines.push({ label, type: "ID Deadline", date: d, reqId: r.id });
    }
    if (r.close_deadline) {
      const d = new Date(r.close_deadline);
      if (d > now && (d.getTime() - now.getTime()) / 86400000 <= 60) deadlines.push({ label, type: "Close Deadline", date: d, reqId: r.id });
    }
  });
  deadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

  const daysUntilNext = deadlines.length > 0 ? Math.ceil((deadlines[0].date.getTime() - now.getTime()) / 86400000) : null;

  const daysUntil = (d: Date) => Math.ceil((d.getTime() - now.getTime()) / 86400000);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your exchange portfolio at a glance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Exchanges</p>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">$</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Proceeds</p>
              <p className="text-2xl font-bold text-foreground">{totalProceeds ? `$${(totalProceeds / 1000).toFixed(0)}K` : "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Matches Received</p>
              <p className="text-2xl font-bold text-foreground">{matchCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarClock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Next Deadline</p>
              <p className="text-2xl font-bold text-foreground">{daysUntilNext !== null ? `${daysUntilNext}d` : "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      {deadlines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {deadlines.map((dl, i) => {
              const days = daysUntil(dl.date);
              const urgency = days <= 14 ? "text-destructive bg-destructive/10" : days <= 30 ? "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20" : "text-muted-foreground bg-muted";
              return (
                <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${urgency}`}>
                      {days}d
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{dl.label}</p>
                      <p className="text-xs text-muted-foreground">{dl.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{dl.date.toLocaleDateString()}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* My Exchanges Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My Exchanges</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No exchange requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Est. Value</TableHead>
                  <TableHead className="text-right">Proceeds</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">
                      {req.relinquished_city && req.relinquished_state
                        ? `${req.relinquished_city}, ${req.relinquished_state}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${REQUEST_STATUS_COLORS[req.status]}`}>
                        {REQUEST_STATUS_LABELS[req.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {req.relinquished_asset_type ? ASSET_TYPE_LABELS[req.relinquished_asset_type] : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">{currency(req.relinquished_estimated_value)}</TableCell>
                    <TableCell className="text-right text-sm">{currency(req.exchange_proceeds)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/dashboard/exchanges/${req.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{h.reqLabel}</span>
                    {" moved to "}
                    <span className="font-medium">{REQUEST_STATUS_LABELS[h.new_status]}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
