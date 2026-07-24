import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Handshake,
  Inbox,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatAdminRelativeTime,
  type AdminAttentionPriority,
  useAdminCommandCenter,
} from "@/features/admin/hooks/useAdminCommandCenter";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  in_identification: "Identification",
  in_closing: "Closing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/15 text-primary",
  in_identification: "bg-amber-100 text-amber-800",
  in_closing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-muted text-muted-foreground",
};

const priorityStyles: Record<AdminAttentionPriority, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
};

function formatUpdatedAt(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AdminDashboard() {
  const { data, isLoading, error, refetch, isFetching } = useAdminCommandCenter();

  if (isLoading) return <CommandCenterSkeleton />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">Run the business from one place.</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">The command center could not load live data.</p>
              <p className="text-sm text-red-700">{error instanceof Error ? error.message : "Please try again."}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpis = [
    { label: "Active Exchanges", value: data.kpis.activeExchanges, icon: ArrowLeftRight, color: "bg-primary/10 text-primary" },
    { label: "Active Matches", value: data.kpis.activeMatches, icon: Handshake, color: "bg-green-50 text-green-700" },
    { label: "Open Connections", value: data.kpis.openConnections, icon: Activity, color: "bg-amber-50 text-amber-700" },
    { label: "Properties", value: data.kpis.properties, icon: Building2, color: "bg-blue-50 text-blue-700" },
    { label: "Total Users", value: data.kpis.users, icon: Users, color: "bg-indigo-50 text-indigo-700" },
    { label: "Agents", value: data.kpis.agents, icon: ShieldCheck, color: "bg-teal-50 text-teal-700" },
    { label: "New Leads", value: data.kpis.newLeads, icon: Inbox, color: "bg-rose-50 text-rose-700" },
    { label: "Open Tickets", value: data.kpis.openTickets, icon: LifeBuoy, color: "bg-purple-50 text-purple-700" },
  ];

  const criticalCount = data.attentionItems.filter((item) => item.priority === "critical").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6" data-testid="admin-command-center">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500" />
              Live
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">What needs attention across the business right now.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Updated {formatUpdatedAt(data.lastUpdatedAt)}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white shadow-sm">
        <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Today’s operating picture</p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <div>
                <p className="text-4xl font-semibold tracking-tight">{data.attentionItems.length}</p>
                <p className="text-sm text-slate-400">items need attention</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-red-300">{criticalCount}</p>
                <p className="text-sm text-slate-400">critical</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-amber-200">{data.overdueDeadlineCount}</p>
                <p className="text-sm text-slate-400">overdue deadlines</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:max-w-[360px] md:justify-end">
            <Button asChild size="sm" className="bg-white text-slate-950 hover:bg-slate-100">
              <Link to="/admin/intake"><Inbox className="mr-1.5 h-3.5 w-3.5" />Review leads</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white">
              <Link to="/admin/deals"><ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />Review deals</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white">
              <Link to="/admin/support"><LifeBuoy className="mr-1.5 h-3.5 w-3.5" />Open support</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="shadow-none">
            <CardContent className="p-3.5">
              <div className={`mb-2 inline-flex rounded-lg p-1.5 ${kpi.color}`}>
                <kpi.icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-xl font-bold">{kpi.value}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Needs attention</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Deadlines and unresolved operational work, prioritized for you.</p>
            </div>
            <Badge variant="secondary">{data.attentionItems.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {data.attentionItems.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <CheckCircle2 className="mb-3 h-9 w-9 text-green-600" />
                <p className="font-semibold">You’re all caught up</p>
                <p className="text-sm text-muted-foreground">No active items need attention.</p>
              </div>
            ) : (
              <div>
                {data.attentionItems.slice(0, 10).map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className="group flex items-start gap-3 border-t px-5 py-3.5 transition-colors hover:bg-muted/50"
                  >
                    <Badge variant="outline" className={`mt-0.5 shrink-0 capitalize ${priorityStyles[item.priority]}`}>
                      {item.priority}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="hidden text-[11px] text-muted-foreground sm:inline">
                        {formatAdminRelativeTime(item.timestamp)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarClock className="h-4 w-4 text-primary" />
                Upcoming demos
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Link to="/admin/demos">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.upcomingDemos.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No demos scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {data.upcomingDemos.map((demo) => (
                    <Link key={demo.id} to={`/admin/demos?q=${encodeURIComponent(demo.work_email)}`} className="flex gap-3 rounded-lg border p-3 hover:bg-muted/50">
                      <div className="rounded-md bg-primary/10 p-2 text-primary"><Clock3 className="h-4 w-4" /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{demo.full_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{demo.company}</p>
                        <p className="mt-1 text-[11px] font-medium text-primary">
                          {new Date(demo.scheduled_at!).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platform pulse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <HealthRow label="Supabase data" status="Connected" healthy />
              <HealthRow
                label="Operational queue"
                status={data.attentionItems.length ? `${data.attentionItems.length} active` : "Clear"}
                healthy={data.attentionItems.length === 0}
              />
              <HealthRow
                label="Deadlines"
                status={data.overdueDeadlineCount ? `${data.overdueDeadlineCount} overdue` : "On track"}
                healthy={data.overdueDeadlineCount === 0}
              />
              <p className="border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
                Worker, email, and audit-log health will appear here after the Phase 1 database foundation is applied.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" />
              Growth in the last 7 days
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <GrowthMetric label="New users" value={data.growth.users} />
            <GrowthMetric label="New exchanges" value={data.growth.exchanges} />
            <GrowthMetric label="Demo requests" value={data.growth.demos} />
            <GrowthMetric label="Event signups" value={data.growth.events} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Exchange pipeline</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <Link
                key={status}
                to={`/admin/deals?q=${encodeURIComponent(status)}`}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <span className={`inline-flex min-w-7 justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
                  {data.pipeline[status] ?? 0}
                </span>
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent marketplace activity</CardTitle></CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No recent marketplace activity.</p>
          ) : (
            <div className="divide-y">
              {data.recentActivity.map((event) => (
                <Link
                  key={event.id}
                  to={`/admin/deals/exchanges/${event.exchange_id}`}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5"><ArrowRight className="h-3 w-3 text-muted-foreground" /></div>
                    <p className="truncate text-sm hover:text-primary">{event.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatAdminRelativeTime(event.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HealthRow({ label, status, healthy }: { label: string; status: string; healthy: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={`h-2 w-2 rounded-full ${healthy ? "bg-green-500" : "bg-amber-500"}`} />
        {label}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{status}</span>
    </div>
  );
}

function GrowthMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CommandCenterSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-24" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[420px]" />
      </div>
    </div>
  );
}
