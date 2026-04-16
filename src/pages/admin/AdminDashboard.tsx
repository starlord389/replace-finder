import { useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Handshake,
  LifeBuoy,
  ArrowLeftRight,
  Activity,
  ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  in_identification: "In Identification",
  in_closing: "In Closing",
  completed: "Completed",
  canceled: "Canceled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  in_identification: "bg-amber-100 text-amber-800",
  in_closing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-muted text-muted-foreground",
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
  const { data, isLoading } = useQuery({
    queryKey: ["admin-monitoring-dashboard"],
    queryFn: async () => {
      const [
        activeExchanges,
        activeMatches,
        openConnections,
        openTickets,
        allExchanges,
        timelineEvents,
      ] = await Promise.all([
        supabase.from("exchanges").select("id", { count: "exact", head: true }).in("status", ["active", "in_identification", "in_closing"]),
        supabase.from("matches").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("exchange_connections").select("id", { count: "exact", head: true }).in("status", ["pending", "accepted", "under_contract"]),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("exchanges").select("status"),
        supabase
          .from("exchange_timeline")
          .select("id, exchange_id, event_type, description, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      return {
        kpis: [
          { label: "Active Exchanges", value: activeExchanges.count, icon: ArrowLeftRight, color: "bg-primary/10 text-primary" },
          { label: "Active Matches", value: activeMatches.count, icon: Handshake, color: "bg-green-50 text-green-600" },
          { label: "Open Connections", value: openConnections.count, icon: Activity, color: "bg-amber-50 text-amber-600" },
          { label: "Open Support Tickets", value: openTickets.count, icon: LifeBuoy, color: "bg-purple-50 text-purple-600" },
        ] satisfies KPI[],
        allExchanges: allExchanges.data ?? [],
        activity: (timelineEvents.data ?? []).map((event) => ({
          id: event.id,
          text: event.description,
          timestamp: event.created_at,
          linkTo: `/agent/exchanges/${event.exchange_id}`,
        })) satisfies ActivityItem[],
      };
    },
  });

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = {
      draft: 0,
      active: 0,
      in_identification: 0,
      in_closing: 0,
      completed: 0,
      canceled: 0,
    };
    data?.allExchanges.forEach((exchange: { status: string }) => {
      if (exchange.status in counts) counts[exchange.status]++;
    });
    return counts;
  }, [data?.allExchanges]);

  if (isLoading) {
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
        <p className="text-muted-foreground">Monitoring overview for platform health and automation signals.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {data?.kpis.map((kpi) => (
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
          <Link to="/admin/support">
            <LifeBuoy className="mr-1.5 h-3.5 w-3.5" />
            Review Support
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/agent">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            View Agent Workspace
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
              <div key={status} className="flex items-center gap-2 rounded-lg border px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                  {pipeline[status] ?? 0}
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
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
          {(data?.activity.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {data?.activity.map((item) => (
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
