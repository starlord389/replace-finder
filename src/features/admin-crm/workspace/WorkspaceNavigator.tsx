import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Building2,
  ChevronDown,
  ChevronRight,
  ContactRound,
  FileLock2,
  Home,
  Layers3,
  ListChecks,
  MessageSquare,
  MessagesSquare,
  Rocket,
  Sparkles,
  UserRound,
} from "lucide-react";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { resolveListingName } from "@/lib/listingDisplay";
import type { CrmUserWorkspace } from "../data/useCrmUserWorkspace";
import type { CrmUserWorkspaceView } from "../data/useCrmUserWorkspace";
import type {
  AdminWorkspaceGraph,
  WorkspaceClientBranch,
  WorkspacePropertyBranch,
  WorkspaceSelection,
} from "./workspaceGraph";

type Props = {
  data: CrmUserWorkspace;
  view: CrmUserWorkspaceView;
  graph: AdminWorkspaceGraph;
  selection: WorkspaceSelection;
  onSelect: (selection: WorkspaceSelection) => void;
};

function isSelected(selection: WorkspaceSelection, type: WorkspaceSelection["type"], id?: string) {
  return selection.type === type && selection.id === id;
}

export default function WorkspaceNavigator({ data, view, graph, selection, onSelect }: Props) {
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(() => new Set(graph.clients.slice(1).map((branch) => branch.client.id)));
  const [collapsedProperties, setCollapsedProperties] = useState<Set<string>>(() => {
    const properties = [...graph.clients.flatMap((branch) => branch.properties), ...graph.directProperties];
    return new Set(properties.slice(1).map((branch) => branch.property.id));
  });
  const [clientsCollapsed, setClientsCollapsed] = useState(false);
  const [inventoryCollapsed, setInventoryCollapsed] = useState(false);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(true);
  const accountName = data.profile.full_name || data.profile.email || "Account";
  const roleLabel = data.roles.includes("agent")
    ? "Agent account"
    : data.roles.includes("investor")
      ? "Property owner account"
      : "User account";
  const isAgent = data.roles.includes("agent");
  const agentRelationshipCount = view.representations.filter((item) => item.status === "active").length;

  const totals = useMemo(() => ({
    properties: graph.clients.reduce((sum, branch) => sum + branch.properties.length, 0) + graph.directProperties.length,
    matches: Object.keys(graph.matchById).length,
  }), [graph]);

  useEffect(() => {
    const activeProperty = selection.type === "property" && selection.id
      ? graph.propertyById[selection.id]
      : selection.type === "match" && selection.id
        ? Object.values(graph.propertyById).find((branch) => branch.matches.some((match) => match.id === selection.id))
        : selection.type === "exchange" && selection.id
          ? Object.values(graph.propertyById).find((branch) => branch.exchange?.id === selection.id)
          : null;
    const activeClientId = selection.type === "client"
      ? selection.id
      : activeProperty
        ? graph.clients.find((client) => client.properties.some((property) => property.property.id === activeProperty.property.id))?.client.id
        : null;
    if (activeClientId) {
      setCollapsedClients((current) => {
        if (!current.has(activeClientId)) return current;
        const next = new Set(current);
        next.delete(activeClientId);
        return next;
      });
    }
    if (activeProperty) {
      setCollapsedProperties((current) => {
        if (!current.has(activeProperty.property.id)) return current;
        const next = new Set(current);
        next.delete(activeProperty.property.id);
        return next;
      });
    }
  }, [graph, selection]);

  function toggleClient(id: string) {
    setCollapsedClients((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleProperty(id: string) {
    setCollapsedProperties((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <nav className="flex h-full min-h-[680px] flex-col border-r border-slate-200 bg-slate-50/70" aria-label="Account relationships">
      <div className="border-b border-slate-200 p-3">
        <button
          type="button"
          onClick={() => onSelect({ type: "account" })}
          className={`w-full rounded-xl border p-3 text-left transition ${
            isSelected(selection, "account")
              ? "border-emerald-300 bg-emerald-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
              {data.roles.includes("agent") ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-950">{accountName}</span>
              <span className="block text-[11px] text-slate-500">{roleLabel}</span>
            </span>
          </div>
          <span className="mt-3 grid grid-cols-3 gap-1 text-center">
            <MiniMetric label={isAgent ? "Clients" : "Agents"} value={isAgent ? graph.clients.length : agentRelationshipCount} />
            <MiniMetric label="Properties" value={totals.properties} />
            <MiniMetric label="Matches" value={totals.matches} />
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        {(isAgent || graph.clients.length > 0) && <>
          <SectionButton
            icon={ContactRound}
            label={isAgent ? "Clients" : "Managed properties"}
            count={graph.clients.length}
            collapsed={clientsCollapsed}
            onClick={() => setClientsCollapsed((value) => !value)}
          />
          {!clientsCollapsed && (
            <div className="mb-3 space-y-1">
              {graph.clients.map((branch) => (
                <ClientBranch
                  key={branch.client.id}
                  data={data}
                  branch={branch}
                  collapsed={collapsedClients.has(branch.client.id)}
                  collapsedProperties={collapsedProperties}
                  selection={selection}
                  onToggle={() => toggleClient(branch.client.id)}
                  onToggleProperty={toggleProperty}
                  onSelect={onSelect}
                />
              ))}
              {!graph.clients.length && <EmptyBranch text="No client relationships" />}
            </div>
          )}
        </>}

        <SectionButton
          icon={Layers3}
          label={data.roles.includes("agent") ? "Properties & listings" : "Properties"}
          count={graph.directProperties.length}
          collapsed={inventoryCollapsed}
          onClick={() => setInventoryCollapsed((value) => !value)}
        />
        {!inventoryCollapsed && (
          <div className="mb-3 space-y-1 pl-2">
            {graph.directProperties.map((branch) => (
              <PropertyBranch
                key={branch.property.id}
                data={data}
                branch={branch}
                collapsed={collapsedProperties.has(branch.property.id)}
                selection={selection}
                onToggle={() => toggleProperty(branch.property.id)}
                onSelect={onSelect}
              />
            ))}
            {!graph.directProperties.length && <EmptyBranch text="No separate property inventory" />}
          </div>
        )}

        {view.connections.length > 0 && <>
          <SectionButton
            icon={MessageSquare}
            label="Conversations"
            count={view.connections.length}
            collapsed={conversationsCollapsed}
            onClick={() => setConversationsCollapsed((value) => !value)}
          />
          {!conversationsCollapsed && (
            <div className="mb-3 space-y-1 pl-2">
              {view.connections.map((connection) => {
                const counterpartId = connection.buyer_agent_id === data.profile.id
                  ? connection.seller_agent_id
                  : connection.buyer_agent_id;
                const counterpart = data.profilesById[counterpartId];
                const match = connection.match_id ? graph.matchById[connection.match_id] : null;
                const currentBranch = match
                  ? Object.values(graph.propertyById).find((branch) => branch.exchange?.id === match.buyer_exchange_id)
                  : null;
                const candidate = match ? data.propertiesById[match.seller_property_id] : null;
                const messageCount = view.connectionMessageMetadata.filter((message) => message.parentId === connection.id).length;
                return (
                  <Link
                    key={connection.id}
                    to={`/admin/opportunities/connections/${connection.id}`}
                    className="block rounded-lg border border-transparent p-2.5 text-slate-700 transition hover:border-slate-200 hover:bg-white"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold">{counterpart?.full_name || counterpart?.email || "Agent conversation"}</span>
                      <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800">{messageCount}</span>
                    </span>
                    <span className="mt-1 block truncate text-[9px] text-slate-500">
                      {currentBranch ? resolveListingName(currentBranch.property, true) : "Current property"} → {candidate ? resolveListingName(candidate, true) : "Matched property"}
                    </span>
                    <span className="mt-0.5 block text-[9px] capitalize text-slate-400">{connection.status.replace(/_/g, " ")} · {messageCount === 1 ? "1 message" : `${messageCount} messages`}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </>}

        {graph.unlinkedExchanges.length > 0 && (
          <div className="mb-3">
            <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Unlinked workspaces</p>
            {graph.unlinkedExchanges.map((exchange) => (
              <TreeButton
                key={exchange.id}
                active={isSelected(selection, "exchange", exchange.id)}
                icon={<Home className="h-3.5 w-3.5" />}
                title="Exchange workspace"
                meta={exchange.status}
                onClick={() => onSelect({ type: "exchange", id: exchange.id })}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-2.5">
        <p className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Account views</p>
        <TreeButton
          active={isSelected(selection, "listings")}
          icon={<ListChecks className="h-4 w-4" />}
          title="Property inventory"
          meta={`${view.exchanges.filter((exchange) => exchange.status === "draft").length} drafts · ${view.exchanges.length} total`}
          onClick={() => onSelect({ type: "listings" })}
        />
        <TreeButton
          active={isSelected(selection, "launchpad")}
          icon={<Rocket className="h-4 w-4" />}
          title="Launchpad progress"
          meta={data.profile.launchpad_completed_at ? "Completion recorded" : "Onboarding in progress"}
          onClick={() => onSelect({ type: "launchpad" })}
        />
        <TreeButton
          active={isSelected(selection, "communications")}
          icon={<MessagesSquare className="h-4 w-4" />}
          title="Inbox"
          meta={`${view.connections.length + view.collaborationThreads.length} conversations · ${view.notifications.length} notifications`}
          onClick={() => onSelect({ type: "communications" })}
        />
        <TreeButton
          active={isSelected(selection, "activity")}
          icon={<Activity className="h-4 w-4" />}
          title="Activity"
          meta="Full timestamped history"
          onClick={() => onSelect({ type: "activity" })}
        />
        <TreeButton
          active={isSelected(selection, "access")}
          icon={<FileLock2 className="h-4 w-4" />}
          title="Access & audit"
          meta={`${data.auditLog.length} audit records`}
          onClick={() => onSelect({ type: "access" })}
        />
      </div>
    </nav>
  );
}

function ClientBranch({ data, branch, collapsed, collapsedProperties, selection, onToggle, onToggleProperty, onSelect }: {
  data: CrmUserWorkspace;
  branch: WorkspaceClientBranch;
  collapsed: boolean;
  collapsedProperties: Set<string>;
  selection: WorkspaceSelection;
  onToggle: () => void;
  onToggleProperty: (id: string) => void;
  onSelect: (selection: WorkspaceSelection) => void;
}) {
  return (
    <div>
      <div className={`group flex items-center rounded-lg pr-1 ${isSelected(selection, "client", branch.client.id) ? "bg-emerald-50" : "hover:bg-white"}`}>
        <button type="button" className="p-2 text-slate-400 hover:text-slate-700" onClick={onToggle} aria-label={collapsed ? "Expand client" : "Collapse client"}>
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => onSelect({ type: "client", id: branch.client.id })} className="min-w-0 flex-1 py-2 text-left">
          <span className="block truncate text-xs font-semibold text-slate-800">{branch.client.client_name}</span>
          <span className="block text-[10px] text-slate-500">{branch.properties.length} {branch.properties.length === 1 ? "property" : "properties"} · {branch.exchanges.length} {branch.exchanges.length === 1 ? "exchange" : "exchanges"}</span>
        </button>
        <span className={`h-1.5 w-1.5 rounded-full ${branch.client.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
      </div>
      {!collapsed && (
        <div className="ml-4 space-y-1 border-l border-slate-200 pl-2">
          {branch.properties.map((property) => (
            <PropertyBranch key={property.property.id} data={data} branch={property} collapsed={collapsedProperties.has(property.property.id)} selection={selection} onToggle={() => onToggleProperty(property.property.id)} onSelect={onSelect} />
          ))}
          {!branch.properties.length && <EmptyBranch text="No property records" />}
        </div>
      )}
    </div>
  );
}

function PropertyBranch({ data, branch, collapsed, selection, onToggle, onSelect }: {
  data: CrmUserWorkspace;
  branch: WorkspacePropertyBranch;
  collapsed: boolean;
  selection: WorkspaceSelection;
  onToggle: () => void;
  onSelect: (selection: WorkspaceSelection) => void;
}) {
  const image = data.imagesByProperty[branch.property.id]?.[0];
  const imageUrl = image ? resolvePropertyImageUrl(image.storage_path) : null;
  return (
    <div>
      <div className={`group flex items-center rounded-lg ${isSelected(selection, "property", branch.property.id) ? "bg-slate-950 text-white shadow-sm" : "text-slate-700 hover:bg-white"}`}>
        <button type="button" onClick={onToggle} className={`p-2 ${isSelected(selection, "property", branch.property.id) ? "text-slate-300" : "text-slate-400 hover:text-slate-700"}`} aria-label={collapsed ? "Expand property relationships" : "Collapse property relationships"}>
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => onSelect({ type: "property", id: branch.property.id })} className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left">
          <span className={`grid h-8 w-9 shrink-0 place-items-center overflow-hidden rounded-md ${imageUrl ? "bg-slate-200" : "bg-slate-100"}`}>
            {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <Home className="h-3.5 w-3.5 text-slate-400" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-semibold">{resolveListingName(branch.property, true)}</span>
            <span className={`block text-[9px] ${isSelected(selection, "property", branch.property.id) ? "text-slate-300" : "text-slate-500"}`}>
              {branch.side === "current" ? "Current property" : "Listing"} · {branch.property.status}
            </span>
          </span>
          {branch.matches.length > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${isSelected(selection, "property", branch.property.id) ? "bg-white/10 text-emerald-200" : "bg-emerald-50 text-emerald-700"}`}>{branch.matches.length}</span>}
        </button>
      </div>
      {!collapsed && (
        <div className="ml-4 space-y-1 border-l border-slate-200 py-1 pl-3">
          {branch.exchange && <TreeButton active={isSelected(selection, "exchange", branch.exchange.id)} icon={<Layers3 className="h-3.5 w-3.5" />} title="Exchange" meta={branch.exchange.status.replace(/_/g, " ")} onClick={() => onSelect({ type: "exchange", id: branch.exchange!.id })} />}
          {branch.matches.length > 0 && <p className="px-2 pt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">Matched opportunities</p>}
          {branch.matches.map((match) => {
            const candidate = data.propertiesById[match.seller_property_id];
            return <TreeButton key={match.id} active={isSelected(selection, "match", match.id)} icon={<Sparkles className="h-3.5 w-3.5" />} title={candidate ? resolveListingName(candidate, true) : "Matched property"} meta={`${Math.round(match.total_score)} match score · ${match.status.replace(/_/g, " ")}`} onClick={() => onSelect({ type: "match", id: match.id })} />;
          })}
          {!branch.exchange && !branch.matches.length && <EmptyBranch text="No exchange or matches" />}
        </div>
      )}
    </div>
  );
}

function SectionButton({ icon: Icon, label, count, collapsed, onClick }: {
  icon: typeof ContactRound;
  label: string;
  count: number;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 hover:bg-white">
      {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      <Icon className="h-3.5 w-3.5" />
      <span className="flex-1">{label}</span>
      <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] text-slate-600">{count}</span>
    </button>
  );
}

function TreeButton({ active, icon, title, meta, onClick }: { active: boolean; icon: React.ReactNode; title: string; meta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg p-2.5 text-left ${active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white"}`}>
      {icon}
      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{title}</span><span className={`block text-[9px] ${active ? "text-slate-300" : "text-slate-500"}`}>{meta}</span></span>
    </button>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <span className="rounded-md bg-slate-50 px-1 py-1.5"><span className="block text-xs font-semibold text-slate-900">{value}</span><span className="block text-[8px] uppercase tracking-wide text-slate-400">{label}</span></span>;
}

function EmptyBranch({ text }: { text: string }) {
  return <p className="px-3 py-2 text-[10px] italic text-slate-400">{text}</p>;
}
