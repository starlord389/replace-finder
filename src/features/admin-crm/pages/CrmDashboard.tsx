import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Building2, Handshake, Home, RefreshCw, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useAdminCommandCenter, formatAdminRelativeTime } from "@/features/admin/hooks/useAdminCommandCenter";
import { useCrmUsers } from "../data/useCrmUsers";
import { CrmError, CrmLoading, CrmPageHeader, MetricTile, RoleBadge } from "../components/CrmPrimitives";
import { formatDate } from "../lib/crmFormat";
import { useAdminCrmScope } from "../layout/AdminCrmScope";

export default function CrmDashboard() {
  const { scope, isDemo } = useAdminCrmScope();
  const command = useAdminCommandCenter(scope);
  const users = useCrmUsers({ page: 1, pageSize: 6, sort: "recent", dataScope: scope });
  const refresh = () => { void Promise.all([command.refetch(), users.refetch()]); };
  if (command.isError) return <CrmError title="The CRM dashboard is unavailable" message={command.error instanceof Error ? command.error.message : "The operational snapshot could not be loaded."} onRetry={refresh} />;

  const data = command.data;
  const accountSummary = users.data?.filteredSummary;
  const recentUsers = users.data?.users ?? [];
  return (
    <div className="space-y-6">
      <CrmPageHeader
        eyebrow="Admin CRM"
        title="Admin workspace"
        description="Start with what needs attention, then move into the person, property, or opportunity workspace where the work belongs."
        actions={<><Button variant="outline" size="sm" onClick={refresh} disabled={command.isFetching || users.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${command.isFetching || users.isFetching ? "animate-spin" : ""}`} />Refresh</Button><Button asChild size="sm"><Link to="/admin/users">Open People</Link></Button></>}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricTile label="Needs attention" value={data?.attentionTotal ?? "—"} icon={AlertCircle} detail={data?.attentionTruncated ? "Showing the 100 highest-priority items" : "Administrator action queue"} tone={(data?.attentionTotal ?? 0) ? "amber" : "slate"} />
        <MetricTile label={isDemo ? "Demo people" : "Live people"} value={accountSummary?.totalAccounts ?? "—"} icon={Users} detail={`${accountSummary?.agentAccounts ?? 0} agents · ${accountSummary?.investorAccounts ?? 0} owners`} tone="blue" />
        <MetricTile label="Properties" value={data?.kpis.properties ?? "—"} icon={Home} detail={`${scope} inventory records`} tone="green" />
        <MetricTile label="Active exchanges" value={data?.kpis.activeExchanges ?? "—"} icon={RefreshCw} tone="blue" />
        <MetricTile label="Active matches" value={data?.kpis.activeMatches ?? "—"} icon={Sparkles} tone="green" />
        <MetricTile label="Open conversations" value={data?.kpis.openConnections ?? "—"} icon={Handshake} tone="green" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(360px,.78fr)_minmax(0,1.22fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold text-slate-950">Needs attention</h2><p className="text-xs text-slate-500">The clearest next action across the platform</p></div>
          {command.isLoading ? <div className="p-5"><CrmLoading rows={5} /></div> : <div className="divide-y divide-slate-100">{(data?.attentionItems ?? []).slice(0, 7).map((item) => (
            <Link key={item.id} to={item.href} className="group block px-5 py-3.5 transition hover:bg-slate-50"><div className="flex items-start gap-3"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.priority === "critical" ? "bg-red-500" : item.priority === "high" ? "bg-amber-500" : "bg-blue-500"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-900 group-hover:text-emerald-700">{item.title}</p><p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{item.detail}</p></div><div className="flex shrink-0 items-center gap-2"><span className="text-[11px] text-slate-400">{formatAdminRelativeTime(item.timestamp)}</span><ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600" /></div></div></Link>
          ))}{!data?.attentionItems.length && <div className="p-8 text-center"><p className="text-sm font-medium text-slate-800">Queue is clear</p><p className="mt-1 text-xs text-slate-500">No urgent operational items.</p></div>}</div>}
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="font-semibold text-slate-950">Recently joined</h2><p className="text-xs text-slate-500">Open an account workspace to see its complete hierarchy</p></div><Button asChild variant="ghost" size="sm"><Link to="/admin/users">View all <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div>
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

      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickLink title="Property inventory" detail={`${data?.kpis.properties ?? 0} properties connected to owners, clients, exchanges, and matches`} href="/admin/properties" icon={Building2} />
        <QuickLink title="Opportunity pipeline" detail={`${data?.kpis.activeMatches ?? 0} active matches across ${data?.kpis.activeExchanges ?? 0} active exchanges`} href="/admin/opportunities" icon={Sparkles} />
        <QuickLink title="Representation" detail={`${data?.kpis.activeRepresentations ?? 0} active relationships and ${data?.kpis.awaitingRepresentation ?? 0} awaiting an agent`} href="/admin/representation-requests" icon={Handshake} />
      </div>
    </div>
  );
}

function QuickLink({ title, detail, href, icon: Icon }: { title: string; detail: string; href: string; icon: typeof Home }) {
  return <Link to={href} className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700" /></div><h3 className="mt-4 font-semibold text-slate-900 group-hover:text-emerald-700">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p></Link>;
}
