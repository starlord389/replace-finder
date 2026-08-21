import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AdminUserNotFoundError } from "@/features/admin/hooks/useAdminUser360";
import { CrmError, CrmLoading } from "../components/CrmPrimitives";
import {
  scopeCrmUserWorkspace,
  useCrmUserWorkspace,
  type CrmWorkspaceScope,
} from "../data/useCrmUserWorkspace";
import WorkspaceNavigator from "../workspace/WorkspaceNavigator";
import WorkspaceRecordDetail from "../workspace/WorkspaceRecordDetail";
import {
  buildAdminWorkspaceGraph,
  parseWorkspaceSelection,
  serializeWorkspaceSelection,
  type WorkspaceSelection,
} from "../workspace/workspaceGraph";

export default function CrmUserWorkspace() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [scope, setScope] = useState<CrmWorkspaceScope>(
    params.get("scope") === "live" || params.get("scope") === "demo"
      ? params.get("scope") as CrmWorkspaceScope
      : "all",
  );
  const query = useCrmUserWorkspace(userId);
  const selection = parseWorkspaceSelection(params.get("record"));
  const returnPath = typeof (location.state as { adminReturnTo?: unknown } | null)?.adminReturnTo === "string"
    ? (location.state as { adminReturnTo: string }).adminReturnTo
    : "/admin/users";

  const view = useMemo(
    () => query.data ? scopeCrmUserWorkspace(query.data, scope) : null,
    [query.data, scope],
  );
  const graph = useMemo(
    () => query.data && view ? buildAdminWorkspaceGraph(query.data, view) : null,
    [query.data, view],
  );

  useEffect(() => {
    if (!selection.id) return;
    if (selection.type === "property") navigate(`/admin/properties/${selection.id}`, { replace: true });
    if (selection.type === "match") navigate(`/admin/opportunities/matches/${selection.id}`, { replace: true });
    if (selection.type === "exchange") navigate(`/admin/opportunities/exchanges/${selection.id}`, { replace: true });
  }, [navigate, selection.id, selection.type]);

  function selectRecord(next: WorkspaceSelection) {
    if (next.type === "property" && next.id) {
      navigate(`/admin/properties/${next.id}`);
      return;
    }
    if (next.type === "match" && next.id) {
      navigate(`/admin/opportunities/matches/${next.id}`);
      return;
    }
    if (next.type === "exchange" && next.id) {
      navigate(`/admin/opportunities/exchanges/${next.id}`);
      return;
    }
    const updated = new URLSearchParams(params);
    if (next.type === "account") updated.delete("record");
    else updated.set("record", serializeWorkspaceSelection(next));
    setParams(updated, { replace: false });
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  function changeScope(next: CrmWorkspaceScope) {
    setScope(next);
    const updated = new URLSearchParams(params);
    if (next === "all") updated.delete("scope"); else updated.set("scope", next);
    updated.delete("record");
    setParams(updated, { replace: true });
  }

  if (query.isLoading) {
    return <div className="space-y-4"><CrmLoading rows={2} /><div className="grid gap-0 overflow-hidden rounded-xl border border-slate-200 lg:grid-cols-[310px_minmax(0,1fr)]"><CrmLoading rows={9} /><CrmLoading rows={12} /></div></div>;
  }
  if (query.error || !query.data) {
    const missing = query.error instanceof AdminUserNotFoundError;
    return <div className="space-y-5"><Button asChild variant="ghost" size="sm"><Link to={returnPath}><ArrowLeft className="mr-2 h-4 w-4" />Users</Link></Button><CrmError title={missing ? "User not found" : "User workspace unavailable"} message={missing ? "The account may have been removed or the link is invalid." : query.error instanceof Error ? query.error.message : "Try again."} onRetry={() => { void query.refetch(); }} /></div>;
  }
  if (!view || !graph) return null;

  const data = query.data;
  const name = data.profile.full_name || data.profile.email || data.authAccount?.email || "Unnamed user";
  return (
    <div className="space-y-4" data-testid="admin-crm-user-workspace">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link to={returnPath} className="inline-flex items-center text-slate-500 hover:text-slate-900"><ArrowLeft className="mr-1.5 h-4 w-4" />Users</Link>
          <span className="text-slate-300">/</span>
          <span className="truncate font-medium text-slate-900">{name}</span>
          <span className="hidden text-slate-300 sm:inline">/</span>
          <span className="hidden text-slate-500 sm:inline">Workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <ScopeSwitch value={scope} onChange={changeScope} />
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      {data.warnings.length > 0 && <Alert className="border-amber-200 bg-amber-50"><AlertTitle>Part of this workspace could not be loaded</AlertTitle><AlertDescription>{data.warnings.join(" · ")}</AlertDescription></Alert>}
      {!data.profileExists && <Alert className="border-blue-200 bg-blue-50"><UserRound className="h-4 w-4 text-blue-700" /><AlertTitle>Authentication account without a completed profile</AlertTitle><AlertDescription>The account can be audited, but profile and onboarding fields are unavailable until profile creation is complete.</AlertDescription></Alert>}

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid lg:min-h-[760px] lg:grid-cols-[310px_minmax(0,1fr)]">
        <div className="max-h-[430px] overflow-hidden border-b border-slate-200 lg:max-h-none lg:border-b-0">
          <WorkspaceNavigator data={data} graph={graph} selection={selection} onSelect={selectRecord} />
        </div>
        <main className="min-w-0 bg-slate-50/40">
          <WorkspaceRecordDetail data={data} view={view} graph={graph} selection={selection} onSelect={selectRecord} onRefetch={query.refetch} />
        </main>
      </div>
    </div>
  );
}

function ScopeSwitch({ value, onChange }: { value: CrmWorkspaceScope; onChange: (scope: CrmWorkspaceScope) => void }) {
  return <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" aria-label="Workspace data scope">{(["all", "live", "demo"] as const).map((scope) => <button key={scope} type="button" onClick={() => onChange(scope)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize ${value === scope ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>{scope}</button>)}</div>;
}
