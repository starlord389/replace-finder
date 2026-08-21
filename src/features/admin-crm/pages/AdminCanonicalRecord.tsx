import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CrmError, CrmLoading } from "../components/CrmPrimitives";
import { scopeCrmUserWorkspace, useCrmUserWorkspace } from "../data/useCrmUserWorkspace";
import WorkspaceRecordDetail from "../workspace/WorkspaceRecordDetail";
import {
  buildAdminWorkspaceGraph,
  serializeWorkspaceSelection,
  type WorkspaceSelection,
} from "../workspace/workspaceGraph";

type CanonicalRecordType = "property" | "match";

async function locateRecordOwner(recordType: CanonicalRecordType, recordId: string) {
  if (recordType === "property") {
    const { data: property, error } = await supabase
      .from("pledged_properties")
      .select("id, agent_id, exchange_id")
      .eq("id", recordId)
      .maybeSingle();
    if (error) throw error;
    if (!property) throw new Error("Property record not found.");
    if (property.agent_id) return property.agent_id;
    if (property.exchange_id) {
      const { data: exchange, error: exchangeError } = await supabase
        .from("exchanges")
        .select("agent_id")
        .eq("id", property.exchange_id)
        .maybeSingle();
      if (exchangeError) throw exchangeError;
      if (exchange?.agent_id) return exchange.agent_id;
    }
    throw new Error("This property is not connected to an account workspace.");
  }

  const { data: match, error } = await supabase
    .from("matches")
    .select("id, buyer_exchange_id")
    .eq("id", recordId)
    .maybeSingle();
  if (error) throw error;
  if (!match) throw new Error("Opportunity record not found.");
  const { data: exchange, error: exchangeError } = await supabase
    .from("exchanges")
    .select("agent_id")
    .eq("id", match.buyer_exchange_id)
    .maybeSingle();
  if (exchangeError) throw exchangeError;
  if (!exchange?.agent_id) throw new Error("This opportunity is not connected to an account workspace.");
  return exchange.agent_id;
}

export default function AdminCanonicalRecord({ recordType }: { recordType: CanonicalRecordType }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const locator = useQuery({
    queryKey: ["admin-canonical-record-owner", recordType, id],
    queryFn: () => locateRecordOwner(recordType, id!),
    enabled: Boolean(id),
    retry: false,
  });
  const workspace = useCrmUserWorkspace(locator.data);
  const view = useMemo(
    () => workspace.data ? scopeCrmUserWorkspace(workspace.data, "all") : null,
    [workspace.data],
  );
  const graph = useMemo(
    () => workspace.data && view ? buildAdminWorkspaceGraph(workspace.data, view) : null,
    [workspace.data, view],
  );
  const selection: WorkspaceSelection = { type: recordType, id };
  const indexHref = recordType === "property" ? "/admin/properties" : "/admin/opportunities";
  const indexLabel = recordType === "property" ? "Properties" : "Opportunities";

  function openRecord(next: WorkspaceSelection) {
    if (!locator.data) return;
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
    const record = next.type === "account" ? "" : `?record=${encodeURIComponent(serializeWorkspaceSelection(next))}`;
    navigate(`/admin/users/${locator.data}${record}`);
  }

  if (locator.isLoading || workspace.isLoading) {
    return <div className="space-y-4"><CrmLoading rows={2} /><CrmLoading rows={12} /></div>;
  }
  if (!id || locator.error || workspace.error || !workspace.data || !view || !graph) {
    const error = locator.error || workspace.error;
    return <div className="space-y-4"><Button asChild variant="ghost" size="sm"><Link to={indexHref}><ArrowLeft className="mr-2 h-4 w-4" />{indexLabel}</Link></Button><CrmError title={`${recordType === "property" ? "Property" : "Opportunity"} unavailable`} message={error instanceof Error ? error.message : "This record could not be loaded."} onRetry={() => { void locator.refetch(); void workspace.refetch(); }} /></div>;
  }

  const recordExists = recordType === "property" ? graph.propertyById[id] : graph.matchById[id];
  if (!recordExists) {
    return <div className="space-y-4"><Button asChild variant="ghost" size="sm"><Link to={indexHref}><ArrowLeft className="mr-2 h-4 w-4" />{indexLabel}</Link></Button><CrmError title="Record relationship unavailable" message="The record exists, but its account relationship could not be assembled. Refresh the workspace or review the source record." onRetry={() => { void workspace.refetch(); }} /></div>;
  }

  const accountName = workspace.data.profile.full_name || workspace.data.profile.email || "Account";
  return (
    <div className="space-y-4" data-testid={`admin-canonical-${recordType}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link to={indexHref} className="inline-flex items-center text-slate-500 hover:text-slate-900"><ArrowLeft className="mr-1.5 h-4 w-4" />{indexLabel}</Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-900">{recordType === "property" ? "Property record" : "Match opportunity"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link to={`/admin/users/${locator.data}`}>Open {accountName}<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>
          <Button variant="outline" size="sm" onClick={() => workspace.refetch()} disabled={workspace.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${workspace.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 shadow-sm">
        <WorkspaceRecordDetail data={workspace.data} view={view} graph={graph} selection={selection} onSelect={openRecord} onRefetch={workspace.refetch} />
      </div>
    </div>
  );
}
