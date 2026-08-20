import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BriefcaseBusiness, Handshake, Home, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAdminCommandCenter, formatAdminRelativeTime } from "@/features/admin/hooks/useAdminCommandCenter";
import { useCrmUsers } from "../data/useCrmUsers";
import { CrmError, CrmLoading, CrmPageHeader, MetricTile, RoleBadge } from "../components/CrmPrimitives";
import { formatDate } from "../lib/crmFormat";

export default function CrmDashboard() {
  const command = useAdminCommandCenter();
  const users = useCrmUsers({ page: 1, pageSize: 6, sort: "recent" });
  const refresh = () => { void Promise.all([command.refetch(), users.refetch()]); };
  if (command.isError) return <CrmError title="The CRM dashboard is unavailable" message={command.error instanceof Error ? command.error.message : "The operational snapshot could not be loaded."} onRetry={refresh} />;

  const data = command.data;
  const recentUsers = users.data?.users ?? [];
  return (
    <div className="space-y-6">
      <CrmPageHeader
        eyebrow="Admin CRM"
        title="Dashboard"
        description="A focused operating view of the people, workspaces, and deal activity across ExchangeUp."
        actions={<><Button variant="outline" size="sm" onClick={refresh} disabled={command.isFetching || users.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${command.isFetching || users.isFetching ? "animate-spin" : ""}`} />Refresh</Button><Button asChild size="sm"><Link to="/admin/users">Open users CRM</Link></Button></>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricTile label="Registered users" value={data?.kpis.users ?? "—"} icon={Users} detail={`+${data?.growth.users ?? 0} this week`} tone="blue" />
        <MetricTile label="Agents" value={data?.kpis.agents ?? "—"} icon={BriefcaseBusiness} tone="slate" />
        <MetricTile label="Property owners" value={data?.kpis.investors ?? "—"} icon={Home} tone="green" />
        <MetricTile label="Active exchanges" value={data?.kpis.activeExchanges ?? "—"} icon={RefreshCw} tone="blue" />
        <MetricTile label="Open conversations" value={data?.kpis.openConnections ?? "—"} icon={Handshake} tone="green" />
        <MetricTile label="Needs attention" value={data?.attentionItems.length ?? "—"} icon={AlertCircle} tone={(data?.attentionItems.length ?? 0) ? "amber" : "slate"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,.7fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-semibold text-slate-950">Recent users</h2><p className="text-xs text-slate-500">New platform accounts and their workspace footprint</p></div><Button asChild variant="ghost" size="sm"><Link to="/admin/users">View all <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
          {users.isError ? <div className="p-5"><CrmError title="Users unavailable" message={users.error instanceof Error ? users.error.message : "Could not load users."} onRetry={() => { void users.refetch(); }} /></div>
            : users.isLoading ? <div className="p-5"><CrmLoading rows={5} /></div>
              : <div className="divide-y divide-slate-100">{recentUsers.map((user) => (
                <Link key={user.id} to={`/admin/users/${user.id}`} className="grid gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3"><ProfileAvatar photoUrl={user.profile_photo_url} name={user.full_name || user.email || "User"} className="h-9 w-9" /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-950">{user.full_name || user.email || "Unnamed user"}</p><p className="truncate text-xs text-slate-500">{user.email || "No email"}</p></div></div>
                  <div className="flex flex-wrap gap-1">{user.roles.slice(0, 2).map((role) => <RoleBadge key={role} role={role} />)}</div>
                  <div className="text-left sm:text-right"><p className="text-xs font-medium text-slate-700">{user.properties.total} properties · {user.exchanges.total} exchanges</p><p className="text-[11px] text-slate-500">Joined {formatDate(user.auth_created_at)}</p></div>
                </Link>
              ))}{!recentUsers.length && <p className="p-8 text-center text-sm text-slate-500">No users found.</p>}</div>}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Attention queue</h2><p className="text-xs text-slate-500">Items that need an administrator</p></div>
          {command.isLoading ? <div className="p-5"><CrmLoading rows={5} /></div> : <div className="divide-y divide-slate-100">{(data?.attentionItems ?? []).slice(0, 7).map((item) => (
            <Link key={item.id} to={item.href} className="block px-5 py-3.5 transition hover:bg-slate-50"><div className="flex items-start gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.priority === "critical" ? "bg-red-500" : item.priority === "high" ? "bg-amber-500" : "bg-blue-500"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-900">{item.title}</p><p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{item.detail}</p></div><span className="shrink-0 text-[11px] text-slate-400">{formatAdminRelativeTime(item.timestamp)}</span></div></Link>
          ))}{!data?.attentionItems.length && <div className="p-8 text-center"><p className="text-sm font-medium text-slate-800">Queue is clear</p><p className="mt-1 text-xs text-slate-500">No urgent operational items.</p></div>}</div>}
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink title="Deal oversight" detail={`${data?.kpis.activeMatches ?? 0} active matches across ${data?.kpis.activeExchanges ?? 0} active exchanges`} href="/admin/deals" />
        <QuickLink title="Representation" detail={`${data?.kpis.activeRepresentations ?? 0} active relationships and ${data?.kpis.awaitingRepresentation ?? 0} awaiting an agent`} href="/admin/representations" />
        <QuickLink title="Support & intake" detail={`${data?.kpis.openTickets ?? 0} open tickets and ${data?.kpis.newLeads ?? 0} new requests`} href="/admin/support" />
      </div>
    </div>
  );
}

function QuickLink({ title, detail, href }: { title: string; detail: string; href: string }) {
  return <Link to={href} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"><div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">{title}</h3><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" /></div><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></Link>;
}
