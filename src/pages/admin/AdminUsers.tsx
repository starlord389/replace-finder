import { useDeferredValue, useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, ArrowRight, BadgeCheck, Ban, Building2, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, ChevronUp, CircleCheck, Database, Home, Loader2, RefreshCw,
  Search, ShieldCheck, ShieldOff, Sparkles, UserCog, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Enums } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import {
  ADMIN_USER_DIRECTORY_QUERY_KEY,
  type AdminDirectoryCount,
  type AdminUserDirectoryAccountStatus,
  type AdminUserDirectoryDataScope,
  type AdminUserDirectoryRow,
  type AdminUserDirectorySort,
  useAdminUserDirectory,
} from "@/features/admin/hooks/useAdminUserDirectory";
import { adminRoleLabel } from "@/features/admin/lib/accountTypes";

type AppRole = Enums<"app_role">;
const PAGE_SIZE = 25;
const ROLE_FILTERS = new Set(["all", "admin", "agent", "investor", "client"]);
const VERIFICATION_FILTERS = new Set(["all", "pending", "verified", "suspended"]);
const ACCOUNT_FILTERS = new Set(["all", "active", "suspended", "deleted"]);
const DATA_FILTERS = new Set(["all", "live", "demo"]);
const SORT_FILTERS = new Set(["recent", "name", "activity"]);

function safeParam(params: URLSearchParams, key: string, allowed: Set<string>, fallback: string) {
  const value = params.get(key);
  return value && allowed.has(value) ? value : fallback;
}

const roleBadgeClass: Record<string, string> = {
  admin: "border-red-200 bg-red-50 text-red-700",
  agent: "border-slate-200 bg-slate-100 text-slate-700",
  investor: "border-emerald-200 bg-emerald-50 text-emerald-700",
  client: "border-blue-200 bg-blue-50 text-blue-700",
  broker: "border-purple-200 bg-purple-50 text-purple-700",
};

const verificationBadgeClass: Record<string, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  unverified: "border-border bg-muted text-muted-foreground",
  rejected: "border-red-200 bg-red-50 text-red-700",
  suspended: "border-red-200 bg-red-50 text-red-700",
  deleted: "border-slate-300 bg-slate-100 text-slate-600",
};

function countLabel(count: AdminDirectoryCount) {
  if (!count.total) return "No records";
  if (count.live && count.demo) return `${count.live} live · ${count.demo} demo`;
  if (count.demo) return `${count.demo} demo`;
  return `${count.live} live`;
}

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [roleFilter, setRoleFilter] = useState(() => safeParam(searchParams, "role", ROLE_FILTERS, "all"));
  const [verificationFilter, setVerificationFilter] = useState(() => safeParam(searchParams, "verification", VERIFICATION_FILTERS, "all"));
  const [accountFilter, setAccountFilter] = useState<AdminUserDirectoryAccountStatus>(() => safeParam(searchParams, "account", ACCOUNT_FILTERS, "all") as AdminUserDirectoryAccountStatus);
  const [dataFilter, setDataFilter] = useState<AdminUserDirectoryDataScope>(() => safeParam(searchParams, "data", DATA_FILTERS, "all") as AdminUserDirectoryDataScope);
  const [sort, setSort] = useState<AdminUserDirectorySort>(() => safeParam(searchParams, "sort", SORT_FILTERS, "recent") as AdminUserDirectorySort);
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get("page")) || 1));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const deferredSearch = useDeferredValue(search);
  const { data: directory, isLoading, isError, error, refetch, isFetching } = useAdminUserDirectory({
    search: deferredSearch,
    role: roleFilter as AppRole | "all",
    verificationStatus: verificationFilter as "all" | "pending" | "verified" | "suspended",
    accountStatus: accountFilter,
    dataScope: dataFilter,
    sort,
    page,
    pageSize: PAGE_SIZE,
  });
  const users = directory?.users ?? [];
  const totalCount = directory?.totalCount ?? 0;
  const platformSummary = directory?.platformSummary ?? {
    totalAccounts: 0,
    agentAccounts: 0,
    investorAccounts: 0,
    needsReview: 0,
  };

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
    setRoleFilter(safeParam(searchParams, "role", ROLE_FILTERS, "all"));
    setVerificationFilter(safeParam(searchParams, "verification", VERIFICATION_FILTERS, "all"));
    setAccountFilter(safeParam(searchParams, "account", ACCOUNT_FILTERS, "all") as AdminUserDirectoryAccountStatus);
    setDataFilter(safeParam(searchParams, "data", DATA_FILTERS, "all") as AdminUserDirectoryDataScope);
    setSort(safeParam(searchParams, "sort", SORT_FILTERS, "recent") as AdminUserDirectorySort);
    setPage(Math.max(1, Number(searchParams.get("page")) || 1));
  }, [searchParams]);

  function updateDirectoryParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && !(key === "sort" && value === "recent")) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace: true });
  }

  function resetPageAndPersist(key: string, value: string) {
    setPage(1);
    updateDirectoryParams({ [key]: value, page: null });
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  async function refreshDirectory() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ADMIN_USER_DIRECTORY_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ["admin-user-360"] }),
    ]);
  }

  async function setRole(userId: string, role: AppRole, grant: boolean) {
    const key = `${userId}-${role}`;
    setBusy((current) => ({ ...current, [key]: true }));
    const { error: mutationError } = await supabase.rpc("admin_set_user_role", {
      p_user_id: userId,
      p_role: role,
      p_enabled: grant,
      p_reason: `Changed from the admin user directory`,
    });
    setBusy((current) => ({ ...current, [key]: false }));
    if (mutationError) {
      toast({ title: `Failed to ${grant ? "grant" : "revoke"} ${adminRoleLabel(role)}.`, description: mutationError.message, variant: "destructive" });
      return;
    }
    await refreshDirectory();
    toast({ title: `${adminRoleLabel(role)} role ${grant ? "granted" : "revoked"}.` });
  }

  async function setAgentVerification(userId: string, status: "pending" | "verified") {
    const key = `verify-${userId}`;
    setBusy((current) => ({ ...current, [key]: true }));
    const { error: mutationError } = await supabase.rpc("admin_set_agent_verification_status", {
      p_user_id: userId,
      p_status: status,
      p_reason: `Changed from the admin user directory`,
    });
    setBusy((current) => ({ ...current, [key]: false }));
    if (mutationError) {
      toast({ title: "Failed to update agent verification.", description: mutationError.message, variant: "destructive" });
      return;
    }
    await refreshDirectory();
    toast({ title: status === "verified" ? "Agent verified." : "Agent verification returned to pending." });
  }

  async function setAccountStatus(userId: string, status: "active" | "suspended", reason?: string) {
    const key = `account-${userId}`;
    const auditReason = reason?.trim() || (status === "active"
      ? "Reactivated from the admin user directory"
      : "Suspended from the admin user directory");
    setBusy((current) => ({ ...current, [key]: true }));
    const { error: mutationError } = await supabase.rpc("admin_set_user_account_status", {
      p_user_id: userId,
      p_status: status,
      p_reason: auditReason,
    });
    setBusy((current) => ({ ...current, [key]: false }));
    if (mutationError) {
      toast({ title: `Failed to ${status === "suspended" ? "suspend" : "reactivate"} account.`, description: mutationError.message, variant: "destructive" });
      return;
    }
    await refreshDirectory();
    toast({ title: status === "suspended" ? "Account suspended." : "Account reactivated." });
  }

  if (isLoading) return <DirectoryLoading />;
  if (isError) {
    return (
      <Card className="border-destructive/30"><CardContent className="flex flex-col items-center py-16 text-center">
        <AlertCircle className="h-9 w-9 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">The user directory could not be loaded</h1>
        <p className="mt-2 max-w-lg text-sm text-muted-foreground">{error instanceof Error ? error.message : "Refresh the directory and try again."}</p>
        <Button className="mt-5" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Find any account, understand its footprint, and open the complete operational record.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total accounts" value={platformSummary.totalAccounts} icon={Users} detail="All registered accounts" />
        <SummaryCard label="Agent workspaces" value={platformSummary.agentAccounts} icon={Building2} detail="Includes dual-role users" />
        <SummaryCard label="Property owners" value={platformSummary.investorAccounts} icon={Home} detail="Investors and owners" />
        <SummaryCard label="Needs review" value={platformSummary.needsReview} icon={AlertCircle} detail="Verification or account access" attention={platformSummary.needsReview > 0} />
      </div>

      {directory?.source === "legacy" && (
        <Card className="border-amber-300 bg-amber-50/70">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="font-semibold text-amber-950">Admin account migration pending</p>
              <p className="mt-1 text-amber-900/80">
                This temporary directory only includes profile-backed accounts. Auth-only, deleted, and account-access records may be incomplete, so role and access changes are disabled until the admin migration is applied.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <DirectoryFilters
        search={search} role={roleFilter} verification={verificationFilter} account={accountFilter} data={dataFilter} sort={sort}
        filteredCount={totalCount} totalCount={platformSummary.totalAccounts}
        onSearch={(value) => { setSearch(value); resetPageAndPersist("q", value); }}
        onRole={(value) => { setRoleFilter(value); resetPageAndPersist("role", value); }}
        onStatus={(value) => { setVerificationFilter(value); resetPageAndPersist("verification", value); }}
        onAccount={(value) => { setAccountFilter(value as AdminUserDirectoryAccountStatus); resetPageAndPersist("account", value); }}
        onData={(value) => { setDataFilter(value as AdminUserDirectoryDataScope); resetPageAndPersist("data", value); }}
        onSort={(value) => { setSort(value as AdminUserDirectorySort); resetPageAndPersist("sort", value); }}
        onClear={() => {
          setSearch(""); setRoleFilter("all"); setVerificationFilter("all"); setAccountFilter("all"); setDataFilter("all"); setSort("recent"); setPage(1);
          setSearchParams(new URLSearchParams(), { replace: true });
        }}
      />

      {users.length === 0 ? <DirectoryEmpty /> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[280px]">Account</TableHead>
                <TableHead className="min-w-[190px]">Role &amp; status</TableHead>
                <TableHead className="w-[105px] text-center">Clients</TableHead>
                <TableHead className="w-[115px] text-center">Exchanges</TableHead>
                <TableHead className="w-[105px] text-center">Properties</TableHead>
                <TableHead className="w-[105px] text-center">Matches</TableHead>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead className="w-[110px]">Joined</TableHead>
                <TableHead className="w-[190px] text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>{users.map((user) => (
                <DirectoryRow
                  key={user.id} user={user} isExpanded={expandedId === user.id}
                  isSelf={user.id === currentUser?.id} busy={busy}
                  managementEnabled={directory?.source === "rpc"}
                  returnTo={`${location.pathname}${location.search}`}
                  onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
                  onSetRole={(role, grant) => setRole(user.id, role, grant)}
                  onSetVerification={(status) => setAgentVerification(user.id, status)}
                  onSuspend={(reason) => setAccountStatus(user.id, "suspended", reason)}
                  onReactivate={() => setAccountStatus(user.id, "active")}
                />
              ))}</TableBody>
            </Table>
          </div>
          <DirectoryPagination page={safePage} pageCount={pageCount} total={totalCount} onPage={(value) => {
            const nextPage = typeof value === "function" ? value(page) : value;
            setPage(nextPage);
            updateDirectoryParams({ page: nextPage > 1 ? String(nextPage) : null });
          }} />
        </Card>
      )}
    </div>
  );
}

function DirectoryLoading() {
  return <div className="flex min-h-[420px] items-center justify-center"><div className="text-center">
    <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
    <p className="mt-3 text-sm text-muted-foreground">Building the account directory…</p>
  </div></div>;
}

function SummaryCard({ label, value, detail, icon: Icon, attention = false }: {
  label: string; value: number; detail: string; icon: typeof Users; attention?: boolean;
}) {
  return <Card className={attention ? "border-amber-200 bg-amber-50/40" : ""}><CardContent className="flex items-start justify-between p-4">
    <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
    <div className={`rounded-lg p-2 ${attention ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}><Icon className="h-4 w-4" /></div>
  </CardContent></Card>;
}

function DirectoryFilters(props: {
  search: string; role: string; verification: string; account: string; data: string; sort: string;
  filteredCount: number; totalCount: number; onSearch: (value: string) => void;
  onRole: (value: string) => void; onStatus: (value: string) => void;
  onAccount: (value: string) => void;
  onData: (value: string) => void; onSort: (value: string) => void; onClear: () => void;
}) {
  const filtered = props.search || props.role !== "all" || props.verification !== "all" ||
    props.account !== "all" || props.data !== "all";
  return <Card><CardContent className="p-4">
    <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_repeat(5,minmax(135px,auto))]">
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder="Search name, email, brokerage, phone, or license…" className="pl-9" aria-label="Search users" />
      </div>
      <Select value={props.role} onValueChange={props.onRole}><SelectTrigger aria-label="Filter by role"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="all">All roles</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="agent">Agent</SelectItem><SelectItem value="investor">Investor / Property Owner</SelectItem><SelectItem value="client">Legacy client role</SelectItem>
      </SelectContent></Select>
      <Select value={props.verification} onValueChange={props.onStatus}><SelectTrigger aria-label="Filter by agent verification"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="all">All verification</SelectItem><SelectItem value="pending">Pending verification</SelectItem><SelectItem value="verified">Verified agents</SelectItem><SelectItem value="suspended">Suspended verification</SelectItem>
      </SelectContent></Select>
      <Select value={props.account} onValueChange={props.onAccount}><SelectTrigger aria-label="Filter by account status"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="all">All access states</SelectItem><SelectItem value="active">Active accounts</SelectItem><SelectItem value="suspended">Suspended accounts</SelectItem><SelectItem value="deleted">Deleted accounts</SelectItem>
      </SelectContent></Select>
      <Select value={props.data} onValueChange={props.onData}><SelectTrigger aria-label="Filter by workspace data"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="all">All data</SelectItem><SelectItem value="live">Has live data</SelectItem><SelectItem value="demo">Has demo data</SelectItem>
      </SelectContent></Select>
      <Select value={props.sort} onValueChange={props.onSort}><SelectTrigger aria-label="Sort users"><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="recent">Newest first</SelectItem><SelectItem value="name">Name A–Z</SelectItem><SelectItem value="activity">Most records</SelectItem>
      </SelectContent></Select>
    </div>
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{props.filteredCount} matching of {props.totalCount} total accounts</span>
      {filtered && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={props.onClear}>Clear filters</Button>}
    </div>
  </CardContent></Card>;
}

function DirectoryEmpty() {
  return <Card className="border-dashed"><CardContent className="py-16 text-center"><Search className="mx-auto h-9 w-9 text-muted-foreground/40" /><p className="mt-3 font-medium">No accounts match these filters</p><p className="mt-1 text-sm text-muted-foreground">Try a broader search or clear the filters.</p></CardContent></Card>;
}

function DirectoryPagination({ page, pageCount, total, onPage }: { page: number; pageCount: number; total: number; onPage: (value: number | ((current: number) => number)) => void }) {
  return <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
    <span className="text-muted-foreground">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
    <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => onPage((value) => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft className="mr-1 h-4 w-4" /> Previous</Button>
      <span className="min-w-20 text-center text-xs text-muted-foreground">Page {page} of {pageCount}</span>
      <Button variant="outline" size="sm" onClick={() => onPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount}>Next <ChevronRight className="ml-1 h-4 w-4" /></Button></div>
  </div>;
}

function DirectoryRow({ user, isExpanded, isSelf, busy, managementEnabled, returnTo, onToggle, onSetRole, onSetVerification, onSuspend, onReactivate }: {
  user: AdminUserDirectoryRow; isExpanded: boolean; isSelf: boolean; busy: Record<string, boolean>;
  managementEnabled: boolean; returnTo: string;
  onToggle: () => void; onSetRole: (role: AppRole, grant: boolean) => void;
  onSetVerification: (status: "pending" | "verified") => void;
  onSuspend: (reason: string) => void; onReactivate: () => void;
}) {
  const label = user.full_name || user.email || "Unnamed account";
  const isAdmin = user.roles.includes("admin");
  const isAgent = user.roles.includes("agent");
  const isInvestor = user.roles.includes("investor");
  const isDeleted = user.account_status === "deleted";
  return <>
    <TableRow className="align-middle">
      <TableCell><div className="flex items-center gap-3">
        <ProfileAvatar photoUrl={user.profile_photo_url} name={label} className="h-10 w-10" fallbackClassName="text-xs" />
        <div className="min-w-0">
          <Link to={`/admin/users/${user.id}`} state={{ adminReturnTo: returnTo }} className="block truncate text-sm font-semibold hover:text-primary hover:underline">{label}</Link>
          <p className="truncate text-xs text-muted-foreground">{user.email || "No email on profile"}</p>
          {(user.brokerage_name || user.company) && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.brokerage_name || user.company}</p>}
        </div>
      </div></TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">{user.roles.length ? user.roles.map((role) => (
          <span key={role} className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${roleBadgeClass[role] || "border-border bg-muted"}`}>{adminRoleLabel(role)}</span>
        )) : <span className="text-xs text-muted-foreground">No assigned role</span>}</div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${verificationBadgeClass[user.account_status] || "border-border bg-muted"}`}>Account {user.account_status}</span>
          {isAgent && <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${verificationBadgeClass[user.verification_status] || "border-border bg-muted"}`}>Agent {user.verification_status.replace(/_/g, " ")}</span>}
        </div>
      </TableCell>
      <MetricCell value={user.clients.total} detail={user.clients.linked ? `${user.clients.managed} managed · ${user.clients.linked} linked` : countLabel(user.clients)} />
      <MetricCell value={user.exchanges.total} detail={user.exchanges.investorOwned ? `${user.exchanges.agentManaged} agent · ${user.exchanges.investorOwned} owner` : countLabel(user.exchanges)} />
      <MetricCell value={user.properties.total} detail={countLabel(user.properties)} />
      <MetricCell value={user.matches.total} detail={user.matches.sellerSide ? `${user.matches.buyerSide} buyer · ${user.matches.sellerSide} seller` : countLabel(user.matches)} />
      <TableCell><div className="flex flex-wrap gap-1">
        {user.hasLiveData && <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"><Database className="h-3 w-3" />Live</span>}
        {user.hasDemoData && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700"><Sparkles className="h-3 w-3" />Demo</span>}
        {user.isTestAccount && <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700">Seeded account</span>}
        {!user.hasLiveData && !user.hasDemoData && <span className="text-xs text-muted-foreground">Profile only</span>}
      </div></TableCell>
      <TableCell className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
      <TableCell><div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" asChild className="h-8"><Link to={`/admin/users/${user.id}`} state={{ adminReturnTo: returnTo }}>Open <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle} disabled={!managementEnabled} title={managementEnabled ? undefined : "Apply the admin migration to enable account management"} aria-label={`${isExpanded ? "Close" : "Open"} quick management for ${label}`} aria-expanded={isExpanded}>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
      </div></TableCell>
    </TableRow>
    {isExpanded && <TableRow><TableCell colSpan={9} className="bg-muted/25 p-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(520px,1.2fr)]">
        <div>
          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Account snapshot</h3><Button variant="outline" size="sm" asChild><Link to={`/admin/users/${user.id}`} state={{ adminReturnTo: returnTo }}>Open complete record <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button></div>
          <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Phone</dt><dd>{user.phone || "Not provided"}</dd>
            <dt className="text-muted-foreground">Company</dt><dd>{user.company || "Not provided"}</dd>
            <dt className="text-muted-foreground">Brokerage</dt><dd>{user.brokerage_name || "Not provided"}</dd>
            <dt className="text-muted-foreground">License</dt><dd>{user.license_number ? `${user.license_number}${user.license_state ? ` · ${user.license_state}` : ""}` : "Not provided"}</dd>
            <dt className="text-muted-foreground">MLS number</dt><dd>{user.mls_number || "Not provided"}</dd>
            <dt className="text-muted-foreground">Experience</dt><dd>{user.years_experience != null ? `${user.years_experience} years` : "Not provided"}</dd>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4"><FootprintStat label="Clients" value={user.clients.total} /><FootprintStat label="Exchanges" value={user.exchanges.total} /><FootprintStat label="Properties" value={user.properties.total} /><FootprintStat label="Matches" value={user.matches.total} /></div>
        </div>
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><UserCog className="h-4 w-4" /> Roles and account access</h3>
          <p className="mt-1 text-xs text-muted-foreground">Changes are recorded in the admin audit log. Review the complete record before removing workspace access from an active account.</p>
          {isDeleted ? (
            <div className="mt-4 flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
              <Ban className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">This authentication account was deleted.</p>
                <p className="mt-1 text-xs text-muted-foreground">Its historical business records remain available for review, but roles, verification, and access can no longer be changed.</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <AdminRoleAction isAdmin={isAdmin} isSelf={isSelf} busy={Boolean(busy[`${user.id}-admin`])} userLabel={label} onConfirm={() => onSetRole("admin", !isAdmin)} />
              <WorkspaceRoleAction role="agent" hasRole={isAgent} busy={Boolean(busy[`${user.id}-agent`])} userLabel={label} relatedRecords={user.clients.total + user.exchanges.agentManaged + user.exchanges.represented} onConfirm={() => onSetRole("agent", !isAgent)} />
              <WorkspaceRoleAction role="investor" hasRole={isInvestor} busy={Boolean(busy[`${user.id}-investor`])} userLabel={label} relatedRecords={user.exchanges.investorOwned + user.clients.linked} onConfirm={() => onSetRole("investor", !isInvestor)} />
              {isAgent && user.profileExists && <AgentVerificationAction isVerified={user.verification_status === "verified"} isSuspended={user.account_status !== "active"} busy={Boolean(busy[`verify-${user.id}`])} userLabel={label} onConfirm={onSetVerification} />}
              {isAgent && !user.profileExists && <Button variant="outline" size="sm" className="w-full justify-start" disabled><BadgeCheck className="mr-2 h-3.5 w-3.5" />Profile required to verify</Button>}
              <AccountAction accountStatus={user.account_status} authBanned={Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now())} isSelf={isSelf} busy={Boolean(busy[`account-${user.id}`])} userLabel={label} onSuspend={onSuspend} onReactivate={onReactivate} />
            </div>
          )}
        </div>
      </div>
    </TableCell></TableRow>}
  </>;
}

function MetricCell({ value, detail }: { value: number; detail: string }) {
  return <TableCell className="text-center"><p className="text-sm font-semibold tabular-nums">{value}</p><p className="mt-0.5 whitespace-nowrap text-[10px] text-muted-foreground">{detail}</p></TableCell>;
}

function FootprintStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border bg-background px-3 py-2"><p className="text-muted-foreground">{label}</p><p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p></div>;
}

function AdminRoleAction({ isAdmin, isSelf, busy, userLabel, onConfirm }: {
  isAdmin: boolean; isSelf: boolean; busy: boolean; userLabel: string; onConfirm: () => void;
}) {
  if (isAdmin && isSelf) return <Button variant="outline" size="sm" className="w-full justify-start" disabled><ShieldCheck className="mr-2 h-3.5 w-3.5" /> Admin (you)</Button>;
  return <AlertDialog>
    <AlertDialogTrigger asChild><Button variant={isAdmin ? "outline" : "default"} size="sm" className="w-full justify-start" disabled={busy}>
      {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : isAdmin ? <ShieldOff className="mr-2 h-3.5 w-3.5" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
      {isAdmin ? "Revoke admin access" : "Grant admin access"}
    </Button></AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isAdmin ? "Revoke admin access?" : "Grant admin access?"}</AlertDialogTitle><AlertDialogDescription>
      {isAdmin ? `${userLabel} will lose the admin center and all administrative actions.` : `${userLabel} will gain full access to user data, account management, and platform settings.`}
    </AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm} className={isAdmin ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>{isAdmin ? "Revoke access" : "Grant access"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>;
}

function WorkspaceRoleAction({ role, hasRole, busy, userLabel, relatedRecords, onConfirm }: {
  role: "agent" | "investor"; hasRole: boolean; busy: boolean; userLabel: string;
  relatedRecords: number; onConfirm: () => void;
}) {
  const label = role === "investor" ? "Investor / Property Owner" : "Agent";
  if (!hasRole) return <Button variant="outline" size="sm" className="w-full justify-start" disabled={busy} onClick={onConfirm}>
    {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <UserCog className="mr-2 h-3.5 w-3.5" />}Grant {label} role
  </Button>;
  return <AlertDialog>
    <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start" disabled={busy}>{busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <UserCog className="mr-2 h-3.5 w-3.5" />}Revoke {label} role</Button></AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Revoke {label} role?</AlertDialogTitle><AlertDialogDescription>
      {userLabel} has {relatedRecords} related workspace record{relatedRecords === 1 ? "" : "s"}. Revoking the role does not delete those records, but it may remove access to workflows that depend on them. Review the complete account first.
    </AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke role</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>;
}

function AgentVerificationAction({ isVerified, isSuspended, busy, userLabel, onConfirm }: {
  isVerified: boolean; isSuspended: boolean; busy: boolean; userLabel: string;
  onConfirm: (status: "pending" | "verified") => void;
}) {
  const nextStatus = isVerified ? "pending" : "verified";
  return <AlertDialog>
    <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start" disabled={busy || isSuspended}>
      {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="mr-2 h-3.5 w-3.5" />}
      {isVerified ? "Return verification to pending" : "Verify agent"}
    </Button></AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isVerified ? "Return agent verification to pending?" : "Verify this agent?"}</AlertDialogTitle><AlertDialogDescription>
      {isVerified ? `${userLabel} will lose access to workflows restricted to verified agents until approved again.` : `${userLabel} will gain access to verified-agent workflows and agent-to-agent conversations.`}
    </AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onConfirm(nextStatus)}>{isVerified ? "Return to pending" : "Verify agent"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>;
}

function AccountAction({ accountStatus, authBanned, isSelf, busy, userLabel, onSuspend, onReactivate }: {
  accountStatus: AdminUserDirectoryRow["account_status"]; isSelf: boolean; busy: boolean;
  authBanned: boolean;
  userLabel: string; onSuspend: (reason: string) => void; onReactivate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (accountStatus === "deleted") return <Button variant="outline" size="sm" className="w-full justify-start" disabled><Ban className="mr-2 h-3.5 w-3.5" />Deleted account</Button>;
  if (authBanned) return <Button variant="outline" size="sm" className="w-full justify-start" disabled title="Remove the authentication ban in Supabase before reactivating this account."><Ban className="mr-2 h-3.5 w-3.5" />Authentication ban active</Button>;
  if (accountStatus === "suspended") return <Button variant="outline" size="sm" className="w-full justify-start" disabled={busy} onClick={onReactivate}>{busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <CircleCheck className="mr-2 h-3.5 w-3.5" />}Reactivate account</Button>;
  if (isSelf) return <Button variant="outline" size="sm" className="w-full justify-start" disabled><CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Active (you)</Button>;
  return <AlertDialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setReason(""); }}>
    <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive" disabled={busy}>{busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Ban className="mr-2 h-3.5 w-3.5" />}Suspend account</Button></AlertDialogTrigger>
    <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Mark this account suspended?</AlertDialogTitle><AlertDialogDescription>
      {userLabel} will be marked suspended. Review the complete account for active clients, exchanges, assignments, and conversations before continuing. Existing business records will not be deleted.
    </AlertDialogDescription></AlertDialogHeader>
      <div className="space-y-2"><label htmlFor="suspension-reason" className="text-sm font-medium">Reason for suspension</label><Textarea id="suspension-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} rows={4} placeholder="Record why access is being suspended…" /><p className="text-xs text-muted-foreground">Required. This reason is stored in the account state and admin audit log.</p></div>
      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={!reason.trim()} onClick={() => onSuspend(reason.trim())} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Suspend account</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
  </AlertDialog>;
}
