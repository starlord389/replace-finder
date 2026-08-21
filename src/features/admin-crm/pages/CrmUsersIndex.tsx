import { useDeferredValue, useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, ChevronLeft, ChevronRight, Home, RefreshCw, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import type { Enums } from "@/integrations/supabase/types";
import { useCrmUsers, type CrmUserAccountStatus, type CrmUserDataScope, type CrmUserSort } from "../data/useCrmUsers";
import { AccountStatusBadge, CrmError, CrmLoading, CrmPageHeader, MetricTile, RoleBadge } from "../components/CrmPrimitives";
import { formatDate } from "../lib/crmFormat";
import { useAdminCrmScope } from "../layout/AdminCrmScope";

const PAGE_SIZE = 25;
const USER_DIRECTORY_GRID = "grid-cols-[minmax(220px,1.25fr)_minmax(160px,.8fr)_minmax(190px,1fr)_minmax(190px,.9fr)_minmax(110px,.55fr)_minmax(130px,.6fr)_40px]";
type AppRole = Enums<"app_role">;

function value(params: URLSearchParams, key: string, allowed: string[], fallback = "all") {
  const current = params.get(key);
  return current && allowed.includes(current) ? current : fallback;
}

export default function CrmUsersIndex() {
  const location = useLocation();
  const { scope, isDemo } = useAdminCrmScope();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const deferredSearch = useDeferredValue(search);
  const role = value(params, "role", ["all", "admin", "agent", "investor", "client"]);
  const account = value(params, "account", ["all", "active", "suspended", "deleted"]) as CrmUserAccountStatus;
  const dataScope = scope as CrmUserDataScope;
  const sort = value(params, "sort", ["recent", "name", "activity"], "recent") as CrmUserSort;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const directory = useCrmUsers({ search: deferredSearch, role: role as AppRole | "all", accountStatus: account, dataScope, sort, page, pageSize: PAGE_SIZE });

  useEffect(() => { setSearch(params.get("q") ?? ""); }, [params]);
  function setParam(key: string, next: string) {
    const updated = new URLSearchParams(params);
    if (!next || next === "all" || (key === "sort" && next === "recent")) updated.delete(key); else updated.set(key, next);
    if (key !== "page") updated.delete("page");
    setParams(updated, { replace: true });
  }

  const summary = directory.data?.filteredSummary;
  const total = directory.data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const users = directory.data?.users ?? [];
  return (
    <div className="space-y-6">
      <CrmPageHeader eyebrow="CRM directory" title="People" description="Find an account, then open its workspace to follow every client, property, opportunity, conversation, and activity record in context." actions={<Button variant="outline" size="sm" onClick={() => directory.refetch()} disabled={directory.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${directory.isFetching ? "animate-spin" : ""}`} />Refresh</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricTile label={isDemo ? "Demo users" : "Live users"} value={summary?.totalAccounts ?? "—"} icon={Users} detail={isDemo ? "Accounts connected to sample data" : "Accounts connected to live data"} tone="blue" />
        <MetricTile label="Agents" value={summary?.agentAccounts ?? "—"} icon={BriefcaseBusiness} detail={`${isDemo ? "Demo" : "Live"} agent workspaces`} />
        <MetricTile label="Property owners" value={summary?.investorAccounts ?? "—"} icon={Home} detail={`${isDemo ? "Demo" : "Live"} owner workspaces`} tone="green" />
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
        <div className="border-b border-slate-200 p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_repeat(3,minmax(145px,auto))]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setParam("q", event.target.value); }} className="pl-9" placeholder="Search name, email, phone, brokerage, or license" aria-label="Search users" /></div>
            <Filter value={role} onChange={(next) => setParam("role", next)} label="Filter by role" options={[["all", "All user types"], ["agent", "Agents"], ["investor", "Property owners"], ["admin", "Administrators"]]} />
            <Filter value={account} onChange={(next) => setParam("account", next)} label="Filter by access" options={[["all", "All access states"], ["active", "Active"], ["suspended", "Suspended"], ["deleted", "Deleted"]]} />
            <Filter value={sort} onChange={(next) => setParam("sort", next)} label="Sort users" options={[["recent", "Newest first"], ["name", "Name A–Z"], ["activity", "Most active"]]} />
          </div>
          <p className="mt-3 text-xs text-slate-500">{total} matching users</p>
        </div>

        {directory.isError ? <div className="p-5"><CrmError title="Users could not be loaded" message={directory.error instanceof Error ? directory.error.message : "Try again."} onRetry={() => { void directory.refetch(); }} /></div>
          : directory.isLoading ? <div className="p-5"><CrmLoading rows={8} /></div>
            : users.length === 0 ? <div className="p-14 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium text-slate-800">No users match these filters</p><p className="mt-1 text-sm text-slate-500">Try a broader search.</p></div>
              : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"><tr className={`grid ${USER_DIRECTORY_GRID}`}><th className="px-5 py-3">User</th><th className="px-4 py-3">Account type</th><th className="px-4 py-3">Organization & market</th><th className="px-4 py-3">Workspace</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Last activity</th><th aria-label="Open user" /></tr></thead><tbody className="divide-y divide-slate-100">{users.map((user) => (
                <tr key={user.id} className="group transition hover:bg-slate-50/80"><td className="p-0" colSpan={7}><Link to={`/admin/users/${user.id}`} state={{ adminReturnTo: `${location.pathname}${location.search}` }} className={`grid ${USER_DIRECTORY_GRID} items-center`}>
                  <div className="flex min-w-0 items-center gap-3 px-5 py-4"><ProfileAvatar photoUrl={user.profile_photo_url} name={user.full_name || user.email || "User"} className="h-10 w-10" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{user.full_name || user.email || "Unnamed user"}</p><p className="truncate text-xs text-slate-500">{user.email || "No email"}</p></div></div>
                  <div className="flex flex-wrap gap-1 px-4 py-4">{user.roles.length ? user.roles.map((item) => <RoleBadge key={item} role={item} />) : <span className="text-xs text-slate-400">No role</span>}</div>
                  <div className="min-w-0 px-4 py-4"><p className="truncate text-sm text-slate-700">{user.brokerage_name || user.company || "Independent / not provided"}</p><p className="mt-0.5 text-xs text-slate-500">{[user.license_state, user.mls_number ? `MLS ${user.mls_number}` : null].filter(Boolean).join(" · ") || "Market not provided"}</p></div>
                  <div className="px-4 py-4"><p className="text-sm font-medium text-slate-800">{user.properties.total} properties · {user.exchanges.total} exchanges</p><p className="mt-0.5 text-xs text-slate-500">{user.clients.total} clients · {user.matches.total} matches</p></div>
                  <div className="px-4 py-4"><AccountStatusBadge status={user.account_status} /></div>
                  <div className="px-4 py-4"><p className="text-sm text-slate-700">{user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never signed in"}</p><p className="mt-0.5 text-xs text-slate-500">Joined {formatDate(user.auth_created_at)}</p></div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </Link></td></tr>
              ))}</tbody></table></div>}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">{total ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}` : "No users"}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button><span className="min-w-20 text-center text-xs text-slate-500">Page {page} of {pageCount}</span><Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setParam("page", String(page + 1))}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>
      </section>
    </div>
  );
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[][] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{options.map(([id, text]) => <SelectItem key={id} value={id}>{text}</SelectItem>)}</SelectContent></Select>;
}
