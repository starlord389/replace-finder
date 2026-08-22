import { useMemo } from "react";
import { ArrowLeft, ExternalLink, RefreshCw, UserRound } from "lucide-react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AdminUserNotFoundError } from "@/features/admin/hooks/useAdminUser360";
import { CrmError, CrmLoading } from "../components/CrmPrimitives";
import {
  scopeCrmUserWorkspace,
  useCrmUserWorkspace,
} from "../data/useCrmUserWorkspace";
import { useAdminCrmScope } from "../layout/AdminCrmScope";
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
  const [params, setParams] = useSearchParams();
  const { scope } = useAdminCrmScope();
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

  function selectRecord(next: WorkspaceSelection) {
    const updated = new URLSearchParams(params);
    if (next.type === "account") updated.delete("record");
    else updated.set("record", serializeWorkspaceSelection(next));
    setParams(updated, { replace: false });
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  if (query.isLoading) {
    return <div className="space-y-4"><CrmLoading rows={2} /><div className="grid gap-0 overflow-hidden rounded-xl border border-slate-200 lg:grid-cols-[310px_minmax(0,1fr)]"><CrmLoading rows={9} /><CrmLoading rows={12} /></div></div>;
  }
  if (query.error || !query.data) {
    const missing = query.error instanceof AdminUserNotFoundError;
    return <div className="space-y-5"><Button asChild variant="ghost" size="sm"><Link to={returnPath}><ArrowLeft className="mr-2 h-4 w-4" />People</Link></Button><CrmError title={missing ? "User not found" : "User workspace unavailable"} message={missing ? "The account may have been removed or the link is invalid." : query.error instanceof Error ? query.error.message : "Try again."} onRetry={() => { void query.refetch(); }} /></div>;
  }
  if (!view || !graph) return null;

  const data = query.data;
  const name = data.profile.full_name || data.profile.email || data.authAccount?.email || "Unnamed user";
  const context = workspaceContext(selection, data, graph);
  return (
    <div className="space-y-4" data-testid="admin-crm-user-workspace">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link to={returnPath} className="inline-flex items-center text-slate-500 hover:text-slate-900"><ArrowLeft className="mr-1.5 h-4 w-4" />People</Link>
          <span className="text-slate-300">/</span>
          <button type="button" onClick={() => selectRecord({ type: "account" })} className="truncate font-medium text-slate-900 hover:text-emerald-700">{name}</button>
          <span className="hidden text-slate-300 sm:inline">/</span>
          <span className="hidden truncate text-slate-500 sm:inline">{context.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {context.href && <Button asChild variant="outline" size="sm"><Link to={context.href} state={{ adminReturnTo: `${location.pathname}${location.search}` }}>{context.action}<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>}
          <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>

      {data.warnings.length > 0 && <Alert className="border-amber-200 bg-amber-50"><AlertTitle>Part of this workspace could not be loaded</AlertTitle><AlertDescription>{data.warnings.join(" · ")}</AlertDescription></Alert>}
      {!data.profileExists && <Alert className="border-blue-200 bg-blue-50"><UserRound className="h-4 w-4 text-blue-700" /><AlertTitle>Authentication account without a completed profile</AlertTitle><AlertDescription>The account can be audited, but profile and onboarding fields are unavailable until profile creation is complete.</AlertDescription></Alert>}

      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid lg:min-h-[760px] lg:grid-cols-[310px_minmax(0,1fr)]">
        <div className="max-h-[520px] overflow-auto border-b border-slate-200 lg:max-h-none lg:overflow-hidden lg:border-b-0">
          <WorkspaceNavigator data={data} view={view} graph={graph} selection={selection} onSelect={selectRecord} />
        </div>
        <main className="min-w-0 bg-slate-50/40">
          <WorkspaceRecordDetail data={data} view={view} graph={graph} selection={selection} onSelect={selectRecord} onRefetch={query.refetch} scope={scope} />
        </main>
      </div>
    </div>
  );
}

function workspaceContext(
  selection: WorkspaceSelection,
  data: NonNullable<ReturnType<typeof useCrmUserWorkspace>["data"]>,
  graph: ReturnType<typeof buildAdminWorkspaceGraph>,
) {
  if (selection.type === "client" && selection.id) {
    return { label: graph.clientById[selection.id]?.client.client_name || "Client", href: null, action: null };
  }
  if (selection.type === "property" && selection.id) {
    const property = graph.propertyById[selection.id]?.property;
    const label = property?.address || property?.city || "Property";
    return { label, href: `/admin/properties/${selection.id}`, action: "Open in Properties" };
  }
  if (selection.type === "match" && selection.id) {
    const match = graph.matchById[selection.id];
    const property = match ? data.propertiesById[match.seller_property_id] : null;
    return { label: property?.address || "Matched opportunity", href: `/admin/opportunities/matches/${selection.id}`, action: "Open in Opportunities" };
  }
  if (selection.type === "exchange" && selection.id) {
    return { label: "Exchange workspace", href: `/admin/opportunities/exchanges/${selection.id}`, action: "Open in Opportunities" };
  }
  const labels: Partial<Record<WorkspaceSelection["type"], string>> = {
    account: "Overview",
    relationships: data.roles.includes("agent") ? "Client access" : "Agent & representation",
    listings: "Property inventory",
    launchpad: "Launchpad progress",
    communications: "Inbox",
    activity: "Activity",
    access: "Access & audit",
  };
  return { label: labels[selection.type] || "Overview", href: null, action: null };
}
