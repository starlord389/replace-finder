import { useEffect, useMemo, useState } from "react";
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
import {
  getClientWorkspaceAccess,
} from "./workspaceRelationshipState";

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
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(() => new Set(graph.clients.map((branch) => branch.client.id)));
  const [collapsedProperties, setCollapsedProperties] = useState<Set<string>>(() => {
    const properties = [...graph.clients.flatMap((branch) => branch.properties), ...graph.directProperties];
    return new Set(properties.map((branch) => branch.property.id));
  });
  const [clientsCollapsed, setClientsCollapsed] = useState(false);
  const [inventoryCollapsed, setInventoryCollapsed] = useState(true);
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

      <div className="border-b border-slate-200 p-2.5">
        <p className="px-1 pb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace views</p>
        <div className="grid grid-cols-2 gap-1.5">
          <QuickViewButton
            active={isSelected(selection, "relationships")}
            icon={<ContactRound className="h-3.5 w-3.5" />}
            title={isAgent ? "Relationships" : "Representation"}
            meta={isAgent ? graph.clients.length : agentRelationshipCount}
            onClick={() => onSelect({ type: "relationships" })}
          />
          <QuickViewButton
            active={isSelected(selection, "listings")}
            icon={<ListChecks className="h-3.5 w-3.5" />}
            title="Listings"
            meta={view.exchanges.filter((exchange) => exchange.status === "draft").length}
            onClick={() => onSelect({ type: "listings" })}
          />
          <QuickViewButton
            active={isSelected(selection, "launchpad")}
            icon={<Rocket className="h-3.5 w-3.5" />}
            title="Launchpad"
            meta={data.profile.launchpad_completed_at ? "Done" : "Open"}
            onClick={() => onSelect({ type: "launchpad" })}
          />
          <QuickViewButton
            active={isSelected(selection, "communications")}
            icon={<MessagesSquare className="h-3.5 w-3.5" />}
            title="Inbox"
            meta={view.connections.length + view.collaborationThreads.length}
            onClick={() => onSelect({ type: "communications" })}
          />
          <QuickViewButton
            active={isSelected(selection, "activity")}
            icon={<Activity className="h-3.5 w-3.5" />}
            title="Activity"
            onClick={() => onSelect({ type: "activity" })}
          />
          <QuickViewButton
            active={isSelected(selection, "access")}
            icon={<FileLock2 className="h-3.5 w-3.5" />}
            title="Audit"
            meta={data.auditLog.length}
            onClick={() => onSelect({ type: "access" })}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        <p className="px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Relationship map</p>
        {(isAgent || graph.clients.length > 0) && <>
          <SectionButton
            icon={ContactRound}
            label={isAgent ? "Client workspaces" : "Agent-managed properties"}
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
          label={data.roles.includes("agent") ? "Personal owner workspace" : "Owned properties"}
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
            {!graph.directProperties.length && <EmptyBranch text={data.roles.includes("agent") ? "No personal owner properties" : "No owned properties"} />}
          </div>
        )}

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
  const access = getClientWorkspaceAccess(branch.client, data.clientInvites);
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
        <span className={`mr-1 shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
          access.state === "self"
            ? "bg-violet-100 text-violet-700"
            : access.state === "connected"
            ? "bg-emerald-100 text-emerald-700"
            : access.state === "invited"
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-200 text-slate-600"
        }`}>{access.state === "self" ? "Self-owned" : access.state === "connected" ? "Joined" : access.state === "invited" ? "Invited" : "CRM only"}</span>
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
              {branch.side === "current" ? "Current property" : "Listing"} · {propertyState(branch)}
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

function QuickViewButton({ active, icon, title, meta, onClick }: { active: boolean; icon: React.ReactNode; title: string; meta?: string | number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}>
      <span className={active ? "text-emerald-300" : "text-slate-400"}>{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">{title}</span>
      {meta !== undefined && <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>{meta}</span>}
    </button>
  );
}

function propertyState(branch: WorkspacePropertyBranch) {
  const exchangeStatus = branch.exchange?.status;
  if (exchangeStatus === "draft") return "draft";
  if (["active", "in_identification", "in_closing"].includes(exchangeStatus ?? "")) return "active";
  if (exchangeStatus) return "historical";
  return ["active", "listed", "published"].includes(branch.property.status) ? "active" : branch.property.status;
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <span className="rounded-md bg-slate-50 px-1 py-1.5"><span className="block text-xs font-semibold text-slate-900">{value}</span><span className="block text-[8px] uppercase tracking-wide text-slate-400">{label}</span></span>;
}

function EmptyBranch({ text }: { text: string }) {
  return <p className="px-3 py-2 text-[10px] italic text-slate-400">{text}</p>;
}
