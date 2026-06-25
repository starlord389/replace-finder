import { useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Handshake, LifeBuoy, ArrowLeftRight, Activity, ArrowRight,
  Users, Building2, Inbox, CalendarClock, TrendingUp, Briefcase,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  in_identification: "In Identification",
  in_closing: "In Closing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  in_identification: "bg-amber-100 text-amber-800",
  in_closing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-muted text-muted-foreground",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface KPI { label: string; value: number | null; icon: React.ElementType; color: string; }
interface ActivityItem { id: string; text: string; timestamp: string; linkTo?: string; }

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-monitoring-dashboard"],
    queryFn: async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const head = { count: "exact" as const, head: true };

      // The admin dashboard reflects LIVE data only. exchanges / pledged_properties
      // carry is_demo, so filter them directly. matches / exchange_connections /
      // exchange_timeline have no is_demo column, so scope them to the set of live
      // (is_demo = false) exchange ids they each reference.
      const { data: liveExRows } = await supabase
        .from("exchanges")
        .select("id")
        .eq("is_demo", false);
      const liveExchangeIds = (liveExRows ?? []).map((r) => r.id as string);
      // Guard the .in() filters: a non-empty array with an impossible id matches
      // nothing when there are no live exchanges (instead of relying on empty-IN).
      const scopeIds = liveExchangeIds.length
        ? liveExchangeIds
        : ["00000000-0000-0000-0000-000000000000"];

      // Demo counterparty agents are real auth users seeded with @replacefinder.test
      // emails (no is_demo column on profiles/user_roles), so subtract them from the
      // user/agent counts. All demo profiles are given the agent role.
      const DEMO_EMAIL = "%@replacefinder.test";

      const [
        activeExchanges, activeMatches, openConnections, openTickets,
        totalUsers, totalAgents, totalProperties, newDemos, newContact,
        newUsersWeek, newExchangesWeek, newDemosWeek,
        allExchanges, timelineEvents, demoUsers, demoUsersWeek,
      ] = await Promise.all([
        supabase.from("exchanges").select("id", head).eq("is_demo", false).in("status", ["active", "in_identification", "in_closing"]),
        supabase.from("matches").select("id", head).eq("status", "active").in("buyer_exchange_id", scopeIds),
        supabase.from("exchange_connections").select("id", head).in("status", ["pending", "accepted"]).in("buyer_exchange_id", scopeIds),
        supabase.from("support_tickets").select("id", head).eq("status", "open"),
        supabase.from("profiles").select("id", head),
        supabase.from("user_roles").select("user_id", head).eq("role", "agent"),
        supabase.from("pledged_properties").select("id", head).eq("is_demo", false),
        supabase.from("demo_requests").select("id", head).eq("status", "new"),
        supabase.from("contact_submissions").select("id", head).eq("status", "new"),
        supabase.from("profiles").select("id", head).gte("created_at", weekAgo),
        supabase.from("exchanges").select("id", head).eq("is_demo", false).gte("created_at", weekAgo),
        supabase.from("demo_requests").select("id", head).gte("created_at", weekAgo),
        supabase.from("exchanges").select("status").eq("is_demo", false),
        supabase.from("exchange_timeline").select("id, exchange_id, event_type, description, created_at").in("exchange_id", scopeIds).order("created_at", { ascending: false }).limit(10),
        supabase.from("profiles").select("id", head).ilike("email", DEMO_EMAIL),
        supabase.from("profiles").select("id", head).ilike("email", DEMO_EMAIL).gte("created_at", weekAgo),
      ]);

      const demoUserCount = demoUsers.count ?? 0;

      return {
        kpis: [
          { label: "Active Exchanges", value: activeExchanges.count, icon: ArrowLeftRight, color: "bg-primary/10 text-primary" },
          { label: "Active Matches", value: activeMatches.count, icon: Handshake, color: "bg-green-50 text-green-600" },
          { label: "Open Connections", value: openConnections.count, icon: Activity, color: "bg-amber-50 text-amber-600" },
          { label: "Properties", value: totalProperties.count, icon: Building2, color: "bg-blue-50 text-blue-600" },
          { label: "Total Users", value: Math.max(0, (totalUsers.count ?? 0) - demoUserCount), icon: Users, color: "bg-indigo-50 text-indigo-600" },
          { label: "Agents", value: Math.max(0, (totalAgents.count ?? 0) - demoUserCount), icon: ShieldCheck, color: "bg-teal-50 text-teal-600" },
          { label: "New Leads", value: (newDemos.count ?? 0) + (newContact.count ?? 0), icon: Inbox, color: "bg-rose-50 text-rose-600" },
          { label: "Open Tickets", value: openTickets.count, icon: LifeBuoy, color: "bg-purple-50 text-purple-600" },
        ] satisfies KPI[],
        growth: [
          { label: "New users", value: Math.max(0, (newUsersWeek.count ?? 0) - (demoUsersWeek.count ?? 0)), icon: Users },
          { label: "New exchanges", value: newExchangesWeek.count ?? 0, icon: ArrowLeftRight },
          { label: "New demo requests", value: newDemosWeek.count ?? 0, icon: CalendarClock },
        ],
        allExchanges: allExchanges.data ?? [],
        activity: (timelineEvents.data ?? []).map((event) => ({
          id: event.id,
          text: event.description,
          timestamp: event.created_at,
          linkTo: `/admin/deals/exchanges/${event.exchange_id}`,
        })) satisfies ActivityItem[],
      };
    },
  });

  const pipeline = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, active: 0, in_identification: 0, in_closing: 0, completed: 0, failed: 0, cancelled: 0 };
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Platform health, growth, and activity at a glance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      {/* Growth this week */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" /> Last 7 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {data?.growth.map((g) => (
              <div key={g.label} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <g.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xl font-bold leading-none">{g.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{g.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/deals"><Briefcase className="mr-1.5 h-3.5 w-3.5" />Deal Oversight</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/users"><Users className="mr-1.5 h-3.5 w-3.5" />Manage Users</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/demos"><CalendarClock className="mr-1.5 h-3.5 w-3.5" />Demos</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/admin/support"><LifeBuoy className="mr-1.5 h-3.5 w-3.5" />Support</Link>
        </Button>
      </div>

      {/* Pipeline Summary */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Exchange Pipeline</CardTitle></CardHeader>
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
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {(data?.activity.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {data?.activity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5"><ArrowRight className="h-3 w-3 text-muted-foreground" /></div>
                    <div>
                      {item.linkTo ? (
                        <Link to={item.linkTo} className="text-sm transition-colors hover:text-primary">{item.text}</Link>
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
