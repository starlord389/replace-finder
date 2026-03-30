import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  Building2,
  Handshake,
  MessageSquare,
  HourglassIcon,
  Plus,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import type { Tables, Enums } from "@/integrations/supabase/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  active: "Active",
  closed: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  closed: "bg-muted text-muted-foreground",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface KPI {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
}

interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
  linkTo?: string;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [pipeline, setPipeline] = useState<Record<string, number>>({});
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const [
      activeReqs,
      pendingReview,
      activeInventory,
      pendingMatches,
      clientResponses,
      awaitingResponse,
      allRequests,
      recentHistory,
    ] = await Promise.all([
      supabase.from("exchange_requests").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("exchange_requests").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      supabase.from("inventory_properties").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("match_results").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("match_results").select("id", { count: "exact", head: true }).eq("status", "approved").not("client_response", "is", null),
      supabase.from("match_results").select("id", { count: "exact", head: true }).eq("status", "approved").is("client_response", null),
      supabase.from("exchange_requests").select("status"),
      supabase
        .from("exchange_request_status_history")
        .select("id, request_id, old_status, new_status, note, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    setKpis([
      { label: "Active Requests", value: activeReqs.count, icon: FileText, color: "bg-blue-50 text-blue-600" },
      { label: "Pending Review", value: pendingReview.count, icon: Clock, color: "bg-blue-50 text-blue-600" },
      { label: "Properties in Inventory", value: activeInventory.count, icon: Building2, color: "bg-green-50 text-green-600" },
      { label: "Matches Pending Review", value: pendingMatches.count, icon: Handshake, color: "bg-amber-50 text-amber-600" },
      { label: "Client Responses", value: clientResponses.count, icon: MessageSquare, color: "bg-amber-50 text-amber-600" },
      { label: "Awaiting Response", value: awaitingResponse.count, icon: HourglassIcon, color: "bg-amber-50 text-amber-600" },
    ]);

    // Pipeline counts
    const counts: Record<string, number> = { draft: 0, submitted: 0, under_review: 0, active: 0, closed: 0 };
    allRequests.data?.forEach((r) => {
      if (r.status in counts) counts[r.status]++;
    });
    setPipeline(counts);

    // Activity feed from status history
    if (recentHistory.data) {
      // Fetch request context for display
      const requestIds = [...new Set(recentHistory.data.map((h) => h.request_id))];
      const { data: requests } = await supabase
        .from("exchange_requests")
        .select("id, relinquished_city, relinquished_state, relinquished_asset_type")
        .in("id", requestIds);

      const reqMap = new Map(requests?.map((r) => [r.id, r]) ?? []);

      setActivity(
        recentHistory.data.map((h) => {
          const req = reqMap.get(h.request_id);
          const loc = [req?.relinquished_city, req?.relinquished_state].filter(Boolean).join(", ") || "Unknown";
          return {
            id: h.id,
            text: `${loc} moved to ${STATUS_LABELS[h.new_status] ?? h.new_status}`,
            timestamp: h.created_at,
            linkTo: `/admin/requests/${h.request_id}`,
          };
        })
      );
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Operational overview of your exchange platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className={`mb-2 inline-flex rounded-lg p-2 ${kpi.color}`}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold">{kpi.value ?? 0}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/inventory/new">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Property
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/requests">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            View Requests
          </Link>
        </Button>
      </div>

      {/* Pipeline Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Request Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <Link
                key={status}
                to={`/admin/requests?status=${status}`}
                className="flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                  {pipeline[status] ?? 0}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div>
                      {item.linkTo ? (
                        <Link to={item.linkTo} className="text-sm hover:text-primary transition-colors">
                          {item.text}
                        </Link>
                      ) : (
                        <p className="text-sm">{item.text}</p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(item.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
