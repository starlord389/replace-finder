import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Circle,
  Clock3,
  ExternalLink,
  FileText,
  Home,
  ImageIcon,
  Inbox,
  KanbanSquare,
  LifeBuoy,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  ListChecks,
  Rocket,
  UserRound,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";
import { resolvePropertyImageUrl } from "@/features/dev/imageUrl";
import { resolveListingName } from "@/lib/listingDisplay";
import type { Tables } from "@/integrations/supabase/types";
import CrmAccountControls from "../components/CrmAccountControls";
import CommunicationsCenter from "../components/CommunicationsCenter";
import { AccountStatusBadge, RoleBadge } from "../components/CrmPrimitives";
import type { CrmUserWorkspace, CrmUserWorkspaceView } from "../data/useCrmUserWorkspace";
import type { AdminCrmScope } from "../layout/AdminCrmScope";
import { formatCurrency, formatDate, sentence } from "../lib/crmFormat";
import type {
  AdminWorkspaceGraph,
  WorkspaceClientBranch,
  WorkspacePropertyBranch,
  WorkspaceSelection,
} from "./workspaceGraph";
import {
  getActiveOwnerRepresentation,
  getClientWorkspaceAccess,
  getOwnerRepresentations,
  type ClientWorkspaceAccess,
} from "./workspaceRelationshipState";

type Props = {
  data: CrmUserWorkspace;
  view: CrmUserWorkspaceView;
  graph: AdminWorkspaceGraph;
  selection: WorkspaceSelection;
  onSelect: (selection: WorkspaceSelection) => void;
  onRefetch: () => Promise<unknown>;
  scope: AdminCrmScope;
};

export default function WorkspaceRecordDetail(props: Props) {
  const { graph, selection } = props;
  if (selection.type === "client" && selection.id && graph.clientById[selection.id]) {
    return <ClientRecord {...props} branch={graph.clientById[selection.id]} />;
  }
  if (selection.type === "property" && selection.id && graph.propertyById[selection.id]) {
    return <PropertyRecord {...props} branch={graph.propertyById[selection.id]} />;
  }
  if (selection.type === "match" && selection.id && graph.matchById[selection.id]) {
    return <MatchRecord {...props} match={graph.matchById[selection.id]} />;
  }
  if (selection.type === "exchange" && selection.id && graph.exchangeById[selection.id]) {
    return <ExchangeRecord {...props} exchange={graph.exchangeById[selection.id]} />;
  }
  if (selection.type === "relationships") return <RelationshipsRecord {...props} />;
  if (selection.type === "listings") return <ListingsRecord {...props} />;
  if (selection.type === "launchpad") return <LaunchpadRecord {...props} />;
  if (selection.type === "communications") return <CommunicationsRecord {...props} />;
  if (selection.type === "activity") return <ActivityRecord {...props} />;
  if (selection.type === "access") return <AccessRecord {...props} />;
  return <AccountRecord {...props} />;
}

function AccountRecord({ data, view, graph, onSelect }: Props) {
  const name = data.profile.full_name || data.profile.email || "Unnamed user";
  const status = data.accountState?.account_status
    ?? (data.authAccount?.deleted_at ? "deleted" : data.profile.verification_status === "suspended" ? "suspended" : "active");
  const isAgent = data.roles.includes("agent");
  const ownerRepresentations = getOwnerRepresentations(data.profile.id, view.representations);
  const activeOwnerRepresentation = getActiveOwnerRepresentation(data.profile.id, view.representations);
  const activeAgentRelationships = ownerRepresentations.filter((item) => item.status === "active").length;
  const activeAgentName = activeOwnerRepresentation
    ? data.profilesById[activeOwnerRepresentation.agent_id ?? ""]?.full_name
      || data.profilesById[activeOwnerRepresentation.agent_id ?? ""]?.email
      || activeOwnerRepresentation.agent_name
      || activeOwnerRepresentation.agent_email
      || null
    : null;
  const recentActivity = buildEvents(data, view).slice(0, 4);
  const launchpad = buildLaunchpadProgress(data, view);
  const draftCount = view.exchanges.filter((exchange) => exchange.status === "draft").length;
  const allPropertyBranches = [...graph.clients.flatMap((client) => client.properties), ...graph.directProperties];
  const activePropertyCount = allPropertyBranches.filter((branch) => propertyOperatingState(branch) === "active").length;
  const inactivePropertyCount = allPropertyBranches.filter((branch) => propertyOperatingState(branch) === "historical").length;
  const activeMatchCount = view.matches.filter((match) => isActiveMatch(data, match)).length;
  const connectedClientCount = graph.clients.filter((branch) => getClientWorkspaceAccess(branch.client, view.clientInvites).state === "connected").length;
  const invitedClientCount = graph.clients.filter((branch) => getClientWorkspaceAccess(branch.client, view.clientInvites).state === "invited").length;
  const selfClientCount = graph.clients.filter((branch) => getClientWorkspaceAccess(branch.client, view.clientInvites).state === "self").length;
  const pendingRepresentationInvites = view.representationInvites.filter((invite) => invite.status === "pending").length;
  const pendingClientInvites = view.clientInvites.filter((invite) => invite.status === "pending").length;
  const openContactRequests = view.contactRequests.filter((request) => !["contacted", "declined", "cancelled"].includes(request.status)).length;
  const unreadIncomingMessages = [...view.connectionMessageMetadata, ...view.collaborationMessageMetadata].filter((message) => message.senderId !== data.profile.id && !message.readAt).length;
  const attentionCount = pendingRepresentationInvites + pendingClientInvites + openContactRequests + unreadIncomingMessages;
  const launchpadIncomplete = launchpad.completed < launchpad.steps.length;
  const needsAttentionCount = attentionCount + draftCount + (launchpadIncomplete ? 1 : 0);
  const clientPreview = graph.clients.slice(0, 4);
  return (
    <div>
      <RecordHeader
        eyebrow="Account workspace"
        title={name}
        description={data.profile.profile_headline || data.profile.brokerage_name || data.profile.company || "Complete relationship and deal record"}
        actions={<div className="flex flex-wrap gap-2">{data.roles.map((role) => <RoleBadge key={role} role={role} />)}<AccountStatusBadge status={status} /></div>}
      />

      <div className="p-5 pb-0">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Workspace summary</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                {isAgent
                  ? `${graph.clients.length} client ${graph.clients.length === 1 ? "relationship" : "relationships"}`
                  : activeAgentName
                    ? `Represented by ${activeAgentName}`
                    : "Self-managed property owner"}
              </h2>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
                {isAgent
                  ? `${connectedClientCount} clients use the platform, ${invitedClientCount} are invited, and ${Math.max(0, graph.clients.length - connectedClientCount - invitedClientCount - selfClientCount)} are managed only in the agent CRM.${selfClientCount ? ` ${selfClientCount} client record is explicitly self-owned.` : ""}${graph.directProperties.length ? ` ${graph.directProperties.length} separate property exists in this person’s owner workspace.` : ""}`
                  : activeAgentName
                    ? "The owner uses the platform while the assigned agent manages agent-to-agent deal conversations."
                    : "No agent is currently assigned. Representation is required before another agent can begin a deal conversation."}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" onClick={() => onSelect({ type: "relationships" })}>{isAgent ? "Open relationships" : "Open representation"}</Button>
              <Button size="sm" variant="outline" onClick={() => onSelect({ type: "listings" })}>Listings & drafts</Button>
              <Button size="sm" variant="outline" onClick={() => onSelect({ type: "communications" })}>Inbox</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-200 bg-slate-50/70 lg:grid-cols-4">
            <WorkspaceMetric label={isAgent ? "Clients" : "Representation"} value={isAgent ? graph.clients.length : activeAgentRelationships ? "Assigned" : "None"} detail={isAgent ? `${connectedClientCount} joined · ${invitedClientCount} invited` : activeAgentName || "Agent needed"} />
            <WorkspaceMetric label="Current work" value={activePropertyCount + draftCount} detail={`${activePropertyCount} active · ${draftCount} ${draftCount === 1 ? "draft" : "drafts"} · ${inactivePropertyCount} historical`} />
            <WorkspaceMetric label="Active matches" value={activeMatchCount} detail={`${Object.keys(graph.matchById).length} total including history`} />
            <WorkspaceMetric label="Needs attention" value={needsAttentionCount} detail={needsAttentionCount ? "Open tasks across this workspace" : "No unresolved work"} tone={needsAttentionCount ? "amber" : "green"} />
          </div>
        </section>
      </div>

      <div className="grid gap-5 p-5 2xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <div className="space-y-5">
          {isAgent ? <Panel title="Client relationships" detail="A concise view of who this agent represents. Open the relationship workspace for invitation, platform-access, and representation history.">
            <div className="mb-3 flex flex-wrap gap-2">
              <RelationshipCount label="Platform joined" value={connectedClientCount} tone="green" />
              <RelationshipCount label="Invited" value={invitedClientCount} tone="amber" />
              <RelationshipCount label="CRM only" value={Math.max(0, graph.clients.length - connectedClientCount - invitedClientCount - selfClientCount)} />
              {selfClientCount > 0 && <RelationshipCount label="Self-owned" value={selfClientCount} tone="violet" />}
            </div>
            {clientPreview.length ? (
              <div className="divide-y divide-slate-100 border-y border-slate-100">
                {clientPreview.map((branch) => (
                  <button key={branch.client.id} type="button" onClick={() => onSelect({ type: "client", id: branch.client.id })} className="group flex w-full items-center gap-4 py-4 text-left first:pt-0 last:pb-0">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">{initials(branch.client.client_name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{branch.client.client_name}</span><ClientAccessBadge access={getClientWorkspaceAccess(branch.client, view.clientInvites)} /></span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{branch.client.client_email || branch.client.client_company || "No contact details"}</span>
                    </span>
                    <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-900">{branch.properties.length}</span><span className="block text-[10px] uppercase tracking-wide text-slate-400">Properties</span></span>
                    <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-900">{branch.exchanges.filter((exchange) => exchange.status === "draft").length}</span><span className="block text-[10px] uppercase tracking-wide text-slate-400">Drafts</span></span>
                    <span className="hidden text-right sm:block"><span className="block text-sm font-semibold text-slate-900">{branch.properties.reduce((sum, item) => sum + item.matches.filter((match) => isActiveMatch(data, match)).length, 0)}</span><span className="block text-[10px] uppercase tracking-wide text-slate-400">Active matches</span></span>
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-600" />
                  </button>
                ))}
              </div>
            ) : <EmptyState icon={Users} title="No client records" detail="Client relationships will appear here when they are connected to this account." />}
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onSelect({ type: "relationships" })}>View all client relationships<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>
          </Panel> : <Panel title="Agent relationship" detail="The person responsible for agent-to-agent activity on this owner’s exchanges.">
            <OwnerRepresentationSummary data={data} view={view} onOpen={() => onSelect({ type: "relationships" })} />
            <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onSelect({ type: "relationships" })}>View representation history<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>
          </Panel>}

          <Panel title="Current work" detail="Active listings and unfinished drafts are kept together. Historical records stay available in Listings & drafts without crowding this overview.">
            <CurrentWorkOverview data={data} view={view} graph={graph} branches={allPropertyBranches} onSelect={onSelect} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">{inactivePropertyCount} historical {inactivePropertyCount === 1 ? "record" : "records"} hidden from this overview</p>
              <Button variant="outline" size="sm" onClick={() => onSelect({ type: "listings" })}>Open complete listing history</Button>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Needs attention" detail="One queue for unfinished work and incoming requests.">
            <div className="space-y-2">
              {(pendingRepresentationInvites + pendingClientInvites) > 0 && <AttentionRow icon={Mail} count={pendingRepresentationInvites + pendingClientInvites} label="Pending invitations" detail={`${pendingRepresentationInvites} representation · ${pendingClientInvites} client`} onClick={() => onSelect({ type: "communications" })} />}
              {openContactRequests > 0 && <AttentionRow icon={Users} count={openContactRequests} label="Representation requests" detail="Owner coverage is waiting" href="/admin/representation-requests" />}
              {unreadIncomingMessages > 0 && <AttentionRow icon={Inbox} count={unreadIncomingMessages} label="Unread messages" detail="Across account conversations" onClick={() => onSelect({ type: "communications" })} />}
              {draftCount > 0 && <AttentionRow icon={ListChecks} count={draftCount} label={draftCount === 1 ? "Draft listing" : "Draft listings"} detail="Saved but not activated" onClick={() => onSelect({ type: "listings" })} />}
              {launchpadIncomplete && <AttentionRow icon={Rocket} count={launchpad.steps.length - launchpad.completed} label="Onboarding steps remaining" detail={`${launchpad.percent}% complete`} onClick={() => onSelect({ type: "launchpad" })} />}
              {needsAttentionCount === 0 && <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-700" /><div><p className="text-xs font-semibold text-emerald-900">Nothing is waiting</p><p className="mt-0.5 text-[11px] text-emerald-700">No unread messages, invitations, requests, drafts, or onboarding tasks.</p></div></div>}
            </div>
          </Panel>

          <button type="button" onClick={() => onSelect({ type: "launchpad" })} className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-sm">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Launchpad progress</p><p className="mt-1 text-sm font-semibold text-slate-950">{launchpad.completed} of {launchpad.steps.length} current steps complete</p><p className="mt-1 text-xs text-slate-500">{launchpad.completed === launchpad.steps.length ? `Completed ${formatDate(data.profile.launchpad_completed_at, true)}` : data.profile.launchpad_completed_at ? `A prior completion was recorded ${formatDate(data.profile.launchpad_completed_at, true)}` : "Onboarding is still in progress"}</p></div><span className="text-xl font-semibold text-slate-950">{launchpad.percent}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${launchpad.percent}%` }} /></div><p className="mt-3 text-xs font-medium text-emerald-700">Open detailed launchpad audit →</p>
          </button>

          <Panel title="Recent activity" detail="The four newest events. Open Activity for the full timestamped history.">
            {recentActivity.length ? <EventList events={recentActivity} compact /> : <EmptyState icon={Activity} title="No activity" detail="No account events are available." />}
            {recentActivity.length > 0 && <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => onSelect({ type: "activity" })}>View complete activity<ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>}
          </Panel>

          <Panel title="Account details" detail="Identity and contact information only.">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <ProfileAvatar photoUrl={data.profile.profile_photo_url} name={name} className="h-12 w-12" />
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950">{name}</p><p className="truncate text-xs text-slate-500">{data.profile.email || data.authAccount?.email || "No email"}</p></div>
            </div>
            <div className="mt-4 space-y-3">
              <ContactLine icon={Mail} value={data.profile.email || data.authAccount?.email} />
              <ContactLine icon={Phone} value={data.profile.phone || data.authAccount?.phone} />
              <ContactLine icon={Building2} value={data.profile.brokerage_name || data.profile.company} />
              <ContactLine icon={MapPin} value={data.profile.service_areas?.join(", ")} />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <Fact label="Joined" value={formatDate(data.authAccount?.created_at ?? data.profile.created_at)} />
              <Fact label="Last sign-in" value={formatDate(data.authAccount?.last_sign_in_at, true)} />
              <Fact label="Experience" value={data.profile.years_experience == null ? null : `${data.profile.years_experience} years`} />
              <Fact label="1031 exchanges" value={data.profile.completed_1031_exchanges?.toLocaleString()} />
              <Fact label="License" value={data.profile.license_number} />
              <Fact label="MLS" value={data.profile.mls_number} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function WorkspaceMetric({ label, value, detail, tone = "neutral" }: { label: string; value: string | number; detail: string; tone?: "neutral" | "green" | "amber" }) {
  const valueColor = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-slate-950";
  return (
    <div className="border-b border-r border-slate-200 p-4 last:border-r-0 lg:border-b-0">
      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${valueColor}`}>{value}</p>
      <p className="mt-0.5 truncate text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}

function RelationshipCount({ label, value, tone = "slate" }: { label: string; value: number; tone?: "slate" | "green" | "amber" | "violet" }) {
  const color = tone === "green"
    ? "bg-emerald-50 text-emerald-800"
    : tone === "amber"
      ? "bg-amber-50 text-amber-800"
      : tone === "violet"
        ? "bg-violet-50 text-violet-800"
        : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${color}`}><strong className="mr-1">{value}</strong>{label}</span>;
}

function CurrentWorkOverview({ data, view, graph, branches, onSelect }: {
  data: CrmUserWorkspace;
  view: CrmUserWorkspaceView;
  graph: AdminWorkspaceGraph;
  branches: WorkspacePropertyBranch[];
  onSelect: (selection: WorkspaceSelection) => void;
}) {
  const representedExchangeIds = new Set(branches.flatMap((branch) => branch.exchange ? [branch.exchange.id] : []));
  const propertyRows = branches
    .filter((branch) => propertyOperatingState(branch) !== "historical")
    .map((branch) => {
      const state = propertyOperatingState(branch);
      const client = graph.clients.find((item) => item.properties.some((property) => property.property.id === branch.property.id))?.client;
      const image = data.imagesByProperty[branch.property.id]?.[0];
      return {
        id: branch.property.id,
        title: resolveListingName(branch.property, true),
        detail: client?.client_name || (data.roles.includes("agent") ? "Personal owner workspace" : "Owned by this account"),
        state,
        matchCount: branch.matches.filter((match) => isActiveMatch(data, match)).length,
        updatedAt: branch.exchange?.updated_at || branch.property.updated_at || branch.property.created_at,
        imageUrl: image ? resolvePropertyImageUrl(image.storage_path) : null,
        selection: { type: "property", id: branch.property.id } as WorkspaceSelection,
      };
    });
  const draftRows = view.exchanges
    .filter((exchange) => exchange.status === "draft" && !representedExchangeIds.has(exchange.id))
    .map((exchange) => ({
      id: exchange.id,
      title: "Untitled listing draft",
      detail: exchange.client_id ? data.clientsById[exchange.client_id]?.client_name || "Client record" : "Owner workspace",
      state: "draft" as const,
      matchCount: 0,
      updatedAt: exchange.updated_at || exchange.created_at,
      imageUrl: null,
      selection: { type: "exchange", id: exchange.id } as WorkspaceSelection,
    }));
  const rows = [...propertyRows, ...draftRows].sort((a, b) => {
    if (a.state !== b.state) return a.state === "active" ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  if (!rows.length) return <EmptyState icon={Home} title="No current work" detail="This account has no active listings or unfinished drafts." />;

  return (
    <div>
      <div className="divide-y divide-slate-100">
        {rows.slice(0, 6).map((row) => (
          <button key={`${row.selection.type}-${row.id}`} type="button" onClick={() => onSelect(row.selection)} className="group flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0">
            <span className="grid h-11 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100">
              {row.imageUrl ? <img src={row.imageUrl} alt="" className="h-full w-full object-cover" /> : <Home className="h-4 w-4 text-slate-400" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{row.title}</span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">{row.detail}</span>
            </span>
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-slate-900">{row.matchCount}</span>
              <span className="block text-[9px] uppercase tracking-wide text-slate-400">Active matches</span>
            </span>
            <Status value={row.state} />
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-600" />
          </button>
        ))}
      </div>
      {rows.length > 6 && <p className="mt-3 border-t border-slate-100 pt-3 text-center text-[11px] text-slate-500">{rows.length - 6} more current {rows.length - 6 === 1 ? "record" : "records"} in Listings & drafts</p>}
    </div>
  );
}

function AttentionRow({ icon: Icon, count, label, detail, href, onClick }: {
  icon: typeof Users;
  count: number;
  label: string;
  detail: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = <><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-900">{label}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{detail}</span></span><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">{count}</span><ArrowRight className="h-3.5 w-3.5 text-slate-300" /></>;
  const className = "flex w-full items-center gap-3 rounded-lg border border-slate-100 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50/60";
  if (href) return <Link to={href} className={className}>{content}</Link>;
  return <button type="button" onClick={onClick} className={className}>{content}</button>;
}

function ClientAccessBadge({ access }: { access: ClientWorkspaceAccess }) {
  const color = access.state === "self"
    ? "bg-violet-100 text-violet-800"
    : access.state === "connected"
    ? "bg-emerald-100 text-emerald-800"
    : access.state === "invited"
      ? "bg-amber-100 text-amber-800"
      : "bg-slate-100 text-slate-600";
  return <Badge className={`${color} border-0 text-[9px]`}>{access.label}</Badge>;
}

function RelationshipStep({ label, state, detail }: { label: string; state: "complete" | "pending" | "inactive"; detail: string }) {
  const dot = state === "complete" ? "bg-emerald-500" : state === "pending" ? "bg-amber-400" : "bg-slate-300";
  return <div className="rounded-lg bg-slate-50 p-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${dot}`} /><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">{label}</p></div><p className="mt-1.5 text-xs text-slate-500">{detail}</p></div>;
}

type PropertyOperatingState = "active" | "draft" | "historical";

function propertyOperatingState(branch: WorkspacePropertyBranch): PropertyOperatingState {
  if (branch.exchange) {
    if (branch.exchange.status === "draft") return "draft";
    if (["active", "in_identification", "in_closing"].includes(branch.exchange.status)) return "active";
    return "historical";
  }
  if (branch.property.status === "draft") return "draft";
  if (["active", "listed"].includes(branch.property.status)) return "active";
  return "historical";
}

function isActiveMatch(data: CrmUserWorkspace, match: CrmUserWorkspaceView["matches"][number]) {
  const stage = data.workflowStatesByMatch[match.id]?.current_stage;
  if (stage && ["archived", "closed"].includes(stage)) return false;
  return !["archived", "rejected", "withdrawn", "closed"].includes(match.status);
}

function PropertyPortfolio({ data, branches, onSelect }: { data: CrmUserWorkspace; branches: WorkspacePropertyBranch[]; onSelect: (selection: WorkspaceSelection) => void }) {
  const groups: Array<{ state: PropertyOperatingState; title: string; detail: string }> = [
    { state: "active", title: "Active", detail: "Published listings and exchanges currently in progress" },
    { state: "draft", title: "Drafts", detail: "Started but not yet activated" },
    { state: "historical", title: "Inactive & historical", detail: "Completed, withdrawn, cancelled, or archived records" },
  ];
  return <div className="space-y-5">{groups.map((group) => {
    const rows = branches.filter((branch) => propertyOperatingState(branch) === group.state);
    if (!rows.length) return null;
    return <section key={group.state}><div className="mb-2.5 flex items-center justify-between gap-3"><div><h3 className="text-xs font-semibold text-slate-900">{group.title}</h3><p className="mt-0.5 text-[10px] text-slate-500">{group.detail}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{rows.length}</span></div><div className="grid gap-3 md:grid-cols-2">{rows.map((branch) => <CompactPropertyCard key={branch.property.id} data={data} branch={branch} onClick={() => onSelect({ type: "property", id: branch.property.id })} />)}</div></section>;
  })}</div>;
}

function OwnerRepresentationSummary({ data, view }: { data: CrmUserWorkspace; view: CrmUserWorkspaceView; onOpen?: () => void }) {
  const relationships = getOwnerRepresentations(data.profile.id, view.representations);
  const active = relationships.find((row) => row.status === "active") ?? null;
  const pendingInvites = view.representationInvites.filter((row) => row.status === "pending").length;
  const openRequests = view.contactRequests.filter((row) => !["contacted", "declined", "cancelled"].includes(row.status)).length;
  if (!active) {
    return <div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700"><UserRound className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-amber-950">No active agent</p><p className="mt-1 text-xs leading-5 text-amber-800">The owner is self-managed and cannot begin an agent-to-agent conversation until representation is assigned.</p></div></div><div className="mt-3 flex flex-wrap gap-2 text-[10px]"><span className="rounded bg-white px-2 py-1 text-amber-800">{pendingInvites} pending invitations</span><span className="rounded bg-white px-2 py-1 text-amber-800">{openRequests} open requests</span><span className="rounded bg-white px-2 py-1 text-amber-800">{relationships.length} historical relationships</span></div></div></div>;
  }
  const agent = data.profilesById[active.agent_id ?? ""];
  const agentName = agent?.full_name || agent?.email || active.agent_name || active.agent_email || "Representing agent";
  return <div><div className="flex items-center gap-3"><ProfileAvatar photoUrl={agent?.profile_photo_url} name={agentName} className="h-11 w-11" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-950">{agentName}</p><p className="mt-0.5 text-xs text-slate-500">{active.is_default ? "Preferred agent" : "Active representing agent"} · Since {formatDate(active.accepted_at ?? active.created_at)}</p></div><Status value="active" /></div><div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">This agent can manage assigned exchanges and conduct agent-to-agent conversations for the owner.</div>{agent && <div className="mt-3"><Button asChild variant="outline" size="sm" className="w-full"><Link to={`/admin/users/${agent.id}`}>Open agent workspace</Link></Button></div>}</div>;
}

function RelationshipsRecord({ data, view, graph, onSelect }: Props) {
  const isAgent = data.roles.includes("agent");
  if (isAgent) {
    const accessRows = graph.clients.map((branch) => ({ branch, access: getClientWorkspaceAccess(branch.client, view.clientInvites) }));
    const connected = accessRows.filter((row) => row.access.state === "connected").length;
    const invited = accessRows.filter((row) => row.access.state === "invited").length;
    const crmOnly = accessRows.filter((row) => row.access.state === "crm_only").length;
    const selfOwned = accessRows.filter((row) => row.access.state === "self").length;
    return <div><RecordHeader eyebrow="Relationship map" title="Client access & representation" description="See which listings belong to regular clients, which clients use the platform, and when the agent is recorded as their own client." /><div className="space-y-5 p-5"><section className="grid gap-3 sm:grid-cols-5"><Kpi label="Total clients" value={graph.clients.length} detail="Agent CRM records" icon={Users} /><Kpi label="Self-owned" value={selfOwned} detail="Agent is the owner" icon={Home} /><Kpi label="Platform connected" value={connected} detail="Client has a workspace" icon={CheckCircle2} /><Kpi label="Invite pending" value={invited} detail="Waiting for signup" icon={Mail} /><Kpi label="CRM only" value={crmOnly} detail="Managed by agent only" icon={UserRound} /></section><Panel title="Client workspace sequence" detail="Every agent-created listing is attached to a client. Self-owned records are explicitly tagged so they cannot be mistaken for unassigned listings."><div className="divide-y divide-slate-100">{accessRows.map(({ branch, access }) => {
      const activeRepresentation = view.representations.find((row) => row.agent_id === data.profile.id && row.status === "active" && ((branch.client.client_user_id && row.investor_id === branch.client.client_user_id) || row.investor_email.toLowerCase() === (branch.client.client_email ?? "").toLowerCase()));
      const drafts = branch.exchanges.filter((exchange) => exchange.status === "draft").length;
      const matches = branch.properties.reduce((sum, property) => sum + property.matches.length, 0);
      return <div key={branch.client.id} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><button type="button" onClick={() => onSelect({ type: "client", id: branch.client.id })} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">{initials(branch.client.client_name)}</span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-slate-950">{branch.client.client_name}</span><ClientAccessBadge access={access} /></span><span className="mt-1 block truncate text-xs text-slate-500">{branch.client.client_email || "No email"}</span></span></button><div className="grid grid-cols-3 gap-4 text-center lg:w-64"><Fact label="Properties" value={branch.properties.length} /><Fact label="Drafts" value={drafts} /><Fact label="Matches" value={matches} /></div><div className="lg:w-44"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Agent relationship</p><p className="mt-1 text-xs font-medium text-slate-700">{access.state === "self" ? "Agent is the property owner" : activeRepresentation ? "Representation active" : "Agent-managed CRM client"}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => onSelect({ type: "client", id: branch.client.id })}>Open client</Button>{branch.client.client_user_id && branch.client.client_user_id !== data.profile.id && <Button asChild size="sm"><Link to={`/admin/users/${branch.client.client_user_id}`}>Owner account</Link></Button>}</div></div><p className="mt-2 pl-[52px] text-[10px] text-slate-500">{access.detail}</p></div>;
    })}</div></Panel></div></div>;
  }

  const relationships = getOwnerRepresentations(data.profile.id, view.representations);
  const active = relationships.find((row) => row.status === "active") ?? null;
  return <div><RecordHeader eyebrow="Relationship map" title="Agent & representation" description="See whether this owner is self-managed or represented, which agent can manage each exchange, and the full invitation and assignment history." actions={<Status value={active ? "active" : "needs_agent"} />} /><div className="space-y-5 p-5"><OwnerRepresentationSummary data={data} view={view} onOpen={() => undefined} /><div className="grid gap-5 xl:grid-cols-2"><Panel title="Representation history" detail="Current and former agent relationships are preserved.">{relationships.length ? <div className="divide-y divide-slate-100">{relationships.map((row) => { const agent = data.profilesById[row.agent_id ?? ""]; const agentName = agent?.full_name || agent?.email || row.agent_name || row.agent_email || "Agent"; return <div key={row.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><ProfileAvatar photoUrl={agent?.profile_photo_url} name={agentName} className="h-10 w-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{agentName}</p><p className="mt-0.5 text-xs text-slate-500">{row.is_default ? "Preferred agent" : "Representation"} · Created {formatDate(row.created_at)}</p>{row.revoked_at && <p className="mt-0.5 text-[10px] text-slate-400">Ended {formatDate(row.revoked_at)}{row.ended_reason ? ` · ${row.ended_reason}` : ""}</p>}</div><Status value={row.status} />{agent && <Button asChild variant="ghost" size="sm"><Link to={`/admin/users/${agent.id}`}>Open</Link></Button>}</div>; })}</div> : <EmptyState icon={Users} title="No representation history" detail="This owner has never connected an agent." />}</Panel><Panel title="Exchange assignments" detail="The agent assigned to each owner exchange, including revoked history.">{view.assignments.length ? <div className="divide-y divide-slate-100">{view.assignments.map((assignment) => { const agent = data.profilesById[assignment.agent_id]; const exchange = graph.exchangeById[assignment.exchange_id]; const property = exchange ? Object.values(graph.propertyById).find((branch) => branch.exchange?.id === exchange.id)?.property : null; return <div key={assignment.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{property ? resolveListingName(property, true) : "Exchange workspace"}</p><p className="mt-1 text-xs text-slate-500">{agent?.full_name || agent?.email || "Agent"} · {assignment.is_primary ? "Primary" : "Additional"} assignment</p></div><Status value={assignment.status} /></div></div>; })}</div> : <EmptyState icon={Building2} title="No exchange assignments" detail="No agent has been assigned to an exchange for this owner." />}</Panel></div></div></div>;
}

function ClientRecord({ data, view, branch, onSelect }: Props & { branch: WorkspaceClientBranch }) {
  const client = branch.client;
  const access = getClientWorkspaceAccess(client, view.clientInvites);
  const connectedProfile = client.client_user_id ? data.profilesById[client.client_user_id] : null;
  const activeRepresentation = view.representations.find((row) => row.agent_id === data.profile.id && row.status === "active" && ((client.client_user_id && row.investor_id === client.client_user_id) || row.investor_email.toLowerCase() === (client.client_email ?? "").toLowerCase()));
  const matchCount = branch.properties.reduce((sum, property) => sum + property.matches.length, 0);
  const exchangeIds = new Set(branch.exchanges.map((exchange) => exchange.id));
  const propertyIds = new Set(branch.properties.map((property) => property.property.id));
  const matchIds = new Set(branch.properties.flatMap((property) => property.matches.map((match) => match.id)));
  const clientEntityIds = new Set([client.id, ...exchangeIds, ...propertyIds, ...matchIds]);
  const clientEvents = buildEvents(data, view).filter((event) => event.entityIds.some((id) => clientEntityIds.has(id)));
  return (
    <div>
      <RecordHeader
        eyebrow="Client record"
        title={client.client_name}
        description={client.client_company || "Client relationship, property portfolio, and exchange workspaces"}
        actions={<div className="flex flex-wrap items-center gap-2"><ClientAccessBadge access={access} /><Status value={client.status} /></div>}
      />
      <div className="p-5">
        <section className="mb-5 grid gap-3 sm:grid-cols-3">
          <Kpi label="Properties" value={branch.properties.length} detail="Attached to this client" icon={Home} />
          <Kpi label="Active exchanges" value={branch.exchanges.filter((exchange) => ["active", "in_identification", "in_closing"].includes(exchange.status)).length} detail="Currently being managed" icon={CircleDollarSign} />
          <Kpi label="Matched opportunities" value={matchCount} detail="Grouped by current property" icon={Sparkles} />
        </section>

        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-slate-100 p-1 sm:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Listings & drafts ({branch.exchanges.length})</TabsTrigger>
            <TabsTrigger value="matches">Matches ({matchCount})</TabsTrigger>
            <TabsTrigger value="activity">Activity ({clientEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">How this client is connected</p><h2 className="mt-1 text-base font-semibold text-slate-950">{access.label}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{access.detail}</p></div>{client.client_user_id && client.client_user_id !== data.profile.id && <Button asChild size="sm"><Link to={`/admin/users/${client.client_user_id}`}>Open property-owner workspace<ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button>}</div>
              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
                <RelationshipStep label="Agent CRM record" state="complete" detail={`Added ${formatDate(client.created_at)}`} />
                <RelationshipStep label="Workspace invitation" state={access.state === "self" ? "inactive" : access.state === "crm_only" ? "inactive" : "complete"} detail={access.state === "self" ? "Not needed for self-owned property" : access.invite ? `${sentence(access.invite.status)} · ${formatDate(access.invite.updated_at)}` : "Not sent"} />
                <RelationshipStep label="Owner workspace" state={["self", "connected"].includes(access.state) ? "complete" : access.state === "invited" ? "pending" : "inactive"} detail={access.state === "self" ? "Same person as the agent" : connectedProfile?.full_name || connectedProfile?.email || (access.state === "connected" ? "Connected account" : "Not connected")} />
                <RelationshipStep label="Agent representation" state={access.state === "self" || activeRepresentation ? "complete" : "pending"} detail={access.state === "self" ? "Agent is the owner" : activeRepresentation ? "Active representation" : "Managed through the agent CRM"} />
              </div>
            </section>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
              <Panel title="Relationship map" detail="The client, their current properties, and every opportunity connected to each property.">
                {branch.properties.length ? <div className="space-y-3">{branch.properties.map((property) => <ClientRelationshipRow key={property.property.id} data={data} branch={property} onSelect={onSelect} />)}</div> : <EmptyState icon={Home} title="No properties for this client" detail="No exchange or listing record is connected to this client." />}
              </Panel>
              <div className="space-y-5">
                <Panel title="Client information" detail="The contact record used by this agent.">
                  <div className="space-y-3"><ContactLine icon={Mail} value={client.client_email} /><ContactLine icon={Phone} value={client.client_phone} /><ContactLine icon={Building2} value={client.client_company} /></div>
                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4"><Fact label="Created" value={formatDate(client.created_at)} /><Fact label="Updated" value={formatDate(client.updated_at, true)} /><Fact label="Platform access" value={access.label} /><Fact label="Platform referral" value={client.referred_by_platform ? "Yes" : "No"} /></div>
                </Panel>
                <Panel title="Internal notes" detail="Agent-entered CRM context."><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{client.notes || "No internal client notes have been added."}</p></Panel>
                {client.client_user_id && client.client_user_id !== data.profile.id && data.profilesById[client.client_user_id] && <Button asChild variant="outline" className="w-full"><Link to={`/admin/users/${client.client_user_id}`}>Open connected property-owner account<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="mt-0">
            <Panel title="Client listings and drafts" detail="Every exchange started for this client, including unfinished drafts that do not have a complete property record yet.">
              {branch.exchanges.length ? <div className="space-y-3">{branch.exchanges.map((exchange) => { const propertyBranch = branch.properties.find((item) => item.exchange?.id === exchange.id); return <ListingWorkspaceCard key={exchange.id} data={data} exchange={exchange} propertyBranch={propertyBranch ?? null} clientName={client.client_name} onSelect={onSelect} />; })}</div> : <EmptyState icon={Home} title="No listings or drafts" detail="No exchange workspace has been started for this client." />}
            </Panel>
          </TabsContent>

          <TabsContent value="matches" className="mt-0 space-y-4">
            {branch.properties.length ? branch.properties.map((property) => <ClientMatchGroup key={property.property.id} data={data} branch={property} onSelect={onSelect} />) : <EmptyState icon={Sparkles} title="No matched opportunities" detail="This client has no property search to match against." />}
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <Panel title="Client activity" detail="Exchange and match events limited to this client’s properties.">{clientEvents.length ? <EventList events={clientEvents} /> : <EmptyState icon={Activity} title="No client activity" detail="No workflow events have been recorded for this client." />}</Panel>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ListingsRecord({ data, view, graph, onSelect }: Props) {
  const exchangeEntries = view.exchanges.map((exchange) => ({
    exchange,
    propertyBranch: Object.values(graph.propertyById).find((branch) => branch.exchange?.id === exchange.id) ?? null,
  }));
  const exchangePropertyIds = new Set(exchangeEntries.flatMap((entry) => entry.propertyBranch ? [entry.propertyBranch.property.id] : []));
  const standaloneProperties = view.properties.filter((property) => !exchangePropertyIds.has(property.id) && !property.exchange_id);
  const drafts = exchangeEntries.filter((entry) => entry.exchange.status === "draft");
  const published = exchangeEntries.filter((entry) => entry.exchange.status !== "draft");
  return <div><RecordHeader eyebrow="Account operations" title="Listings & drafts" description="Every property and exchange workspace this user started, including incomplete drafts and the timestamps needed to understand where work stopped." /><div className="space-y-5 p-5"><section className="grid gap-3 sm:grid-cols-3"><Kpi label="Drafts" value={drafts.length} detail="Saved but not published" icon={ListChecks} /><Kpi label="Published" value={published.length} detail="Active or historical exchanges" icon={Building2} /><Kpi label="Standalone properties" value={standaloneProperties.length} detail="Not linked to an exchange" icon={Home} /></section>{drafts.length > 0 && <Panel title="Draft workspaces" detail="Drafts remain visible even when the user has not completed the address, financials, criteria, or property record."><div className="space-y-3">{drafts.map(({ exchange, propertyBranch }) => <ListingWorkspaceCard key={exchange.id} data={data} exchange={exchange} propertyBranch={propertyBranch} clientName={exchange.client_id ? data.clientsById[exchange.client_id]?.client_name : null} onSelect={onSelect} />)}</div></Panel>}<Panel title="Complete listing history" detail="Published, active, completed, cancelled, and standalone property records with their current completeness and timestamps."><div className="space-y-3">{published.map(({ exchange, propertyBranch }) => <ListingWorkspaceCard key={exchange.id} data={data} exchange={exchange} propertyBranch={propertyBranch} clientName={exchange.client_id ? data.clientsById[exchange.client_id]?.client_name : null} onSelect={onSelect} />)}{standaloneProperties.map((property) => { const branch = graph.propertyById[property.id]; return branch ? <ListingWorkspaceCard key={property.id} data={data} exchange={null} propertyBranch={branch} clientName={null} onSelect={onSelect} /> : null; })}{published.length === 0 && standaloneProperties.length === 0 && <EmptyState icon={Home} title="No published listings" detail="This account has not published or completed a property listing." />}</div></Panel></div></div>;
}

function LaunchpadRecord({ data, view }: Props) {
  const progress = buildLaunchpadProgress(data, view);
  const currentComplete = progress.completed === progress.steps.length;
  return <div><RecordHeader eyebrow="Onboarding audit" title="Launchpad progress" description="The same completion signals used by the live workspace, with the stored or inferred timestamp behind every step." actions={<Badge className={currentComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{currentComplete ? "Current steps complete" : data.profile.launchpad_completed_at ? "Previously completed" : "In progress"}</Badge>} /><div className="space-y-5 p-5"><Panel title={`${progress.completed} of ${progress.steps.length} current steps complete`} detail={`${progress.percent}% of the ${progress.audience} onboarding workflow has recorded activity. A stored completion timestamp is preserved separately so changes between launchpad versions remain visible.`}><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress.percent}%` }} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Fact label="Recorded completion" value={formatDate(data.profile.launchpad_completed_at, true)} /><Fact label="Launchpad version" value={data.profile.launchpad_version} /></div></Panel><div className="space-y-3">{progress.steps.map((step, index) => <section key={step.id} className={`rounded-xl border bg-white p-4 ${step.complete ? "border-emerald-200" : step.inProgress ? "border-amber-200" : "border-slate-200"}`}><div className="flex items-start gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${step.complete ? "bg-emerald-100 text-emerald-700" : step.inProgress ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{step.complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-sm font-semibold text-slate-950">{step.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p></div><Status value={step.complete ? "completed" : step.inProgress ? "in_progress" : "not_started"} /></div><div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2"><Fact label="Evidence" value={step.evidence} /><Fact label="Recorded at" value={formatDate(step.completedAt, true)} /></div></div></div></section>)}</div><Panel title="Launchpad timestamps" detail="Raw profile acknowledgements and completion records used by this onboarding audit."><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Fact label="Profile updated" value={formatDate(data.profile.updated_at, true)} /><Fact label="Matching walkthrough" value={formatDate(data.profile.launchpad_matching_ack_at, true)} /><Fact label="Matches opened" value={formatDate(data.profile.launchpad_matches_ack_at, true)} /><Fact label="Client requests walkthrough" value={formatDate(data.profile.launchpad_client_requests_ack_at, true)} /><Fact label="Pipeline opened" value={formatDate(data.profile.launchpad_pipeline_ack_at, true)} /><Fact label="Launchpad completed" value={formatDate(data.profile.launchpad_completed_at, true)} /></div></Panel></div></div>;
}

function CommunicationsRecord({ data, scope }: Props) {
  const name = data.profile.full_name || data.profile.email || data.authAccount?.email || "Account";
  return (
    <div>
      <RecordHeader
        eyebrow="Account communications"
        title={`Communication history for ${name}`}
        description="Every conversation and delivery record related to this account, without leaving the user workspace."
        actions={<Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Read only</Badge>}
      />
      <div className="p-5">
        <CommunicationsCenter userId={data.profile.id} accountName={name} embedded dataScope={scope} />
      </div>
    </div>
  );
}

function PropertyRecord({ data, branch, onSelect }: Props & { branch: WorkspacePropertyBranch }) {
  const property = branch.property;
  const finance = data.financialsByProperty[property.id];
  const images = data.imagesByProperty[property.id] ?? [];
  const documents = data.documentsByProperty[property.id] ?? [];
  const exchange = branch.exchange;
  const criteria = exchange ? data.criteriaByExchange[exchange.id] : null;
  return (
    <div>
      <PropertyGallery property={property} images={images} />
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight text-slate-950">{resolveListingName(property, true)}</h1><Status value={property.status} />{property.is_demo && <Badge className="bg-amber-100 text-amber-800">Demo</Badge>}</div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{[property.city, property.state, property.zip].filter(Boolean).join(", ") || "Location not provided"}</p>
          </div>
          <div className="flex flex-wrap gap-2">{exchange && <Button asChild variant="outline" size="sm"><Link to={`/admin/opportunities/exchanges/${exchange.id}`}>Open exchange workspace<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>}</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
          <HeroFact label="Price / value" value={formatCurrency(finance?.asking_price ?? finance?.appraised_value)} />
          <HeroFact label="NOI" value={formatCurrency(finance?.noi)} />
          <HeroFact label="Cap rate" value={percent(finance?.cap_rate)} />
          <HeroFact label="Asset type" value={sentence(property.asset_type)} />
          <HeroFact label="Units" value={property.units?.toLocaleString()} />
          <HeroFact label="Matches" value={branch.matches.length.toLocaleString()} accent />
        </div>
      </div>

      <div className="space-y-5 p-5">
        {branch.matches.length > 0 && (
          <Panel title="Matched replacement properties" detail={`Opportunities calculated for ${resolveListingName(property, true)}. Select a match to see the complete comparison.`}>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {branch.matches.map((match) => {
                const candidate = data.propertiesById[match.seller_property_id];
                if (!candidate) return null;
                const candidateFinance = data.financialsByProperty[candidate.id];
                const candidateImage = data.imagesByProperty[candidate.id]?.[0];
                return (
                  <button key={match.id} type="button" onClick={() => onSelect({ type: "match", id: match.id })} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                    <div className="relative h-36 bg-slate-100">{candidateImage ? <img src={resolvePropertyImageUrl(candidateImage.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}<span className="absolute right-3 top-3 rounded-lg bg-slate-950 px-2.5 py-1.5 text-sm font-semibold text-white shadow">{Math.round(match.total_score)} <span className="text-[9px] font-normal text-slate-300">score</span></span></div>
                    <div className="p-4"><p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(candidate, true)}</p><p className="mt-1 text-xs text-slate-500">{[candidate.city, candidate.state].filter(Boolean).join(", ")} · {sentence(candidate.asset_type)}</p><div className="mt-4 grid grid-cols-3 gap-3"><Fact label="Price" value={formatCurrency(candidateFinance?.asking_price)} /><Fact label="NOI" value={formatCurrency(candidateFinance?.noi)} /><Fact label="Projected ROE" value={percentRatio(match.candidate_roe)} /></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><Status value={match.status} /><span className="text-xs font-medium text-emerald-700">Open comparison →</span></div></div>
                  </button>
                );
              })}
            </div>
          </Panel>
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
          <div className="space-y-5">
            <Panel title="Property details" detail="Complete listing information entered into ExchangeUp.">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <Fact label="Address" value={[property.address, property.unit_suite].filter(Boolean).join(" ")} />
                <Fact label="County" value={property.county} /><Fact label="Subtype" value={property.asset_subtype} />
                <Fact label="Strategy" value={sentence(property.strategy_type)} /><Fact label="Class" value={property.property_class} />
                <Fact label="Condition" value={property.property_condition} /><Fact label="Year built" value={property.year_built?.toString()} />
                <Fact label="Building size" value={property.building_square_footage == null ? null : `${property.building_square_footage.toLocaleString()} sq ft`} />
                <Fact label="Land" value={property.land_area_acres == null ? null : `${property.land_area_acres.toLocaleString()} acres`} />
                <Fact label="Buildings" value={property.num_buildings?.toLocaleString()} /><Fact label="Stories" value={property.num_stories?.toLocaleString()} />
                <Fact label="Parking" value={[property.parking_spaces == null ? null : `${property.parking_spaces} spaces`, property.parking_type].filter(Boolean).join(", ")} />
                <Fact label="Construction" value={property.construction_type} /><Fact label="Roof" value={property.roof_type} />
                <Fact label="HVAC" value={property.hvac_type} /><Fact label="Zoning" value={property.zoning} />
              </dl>
              {property.amenities?.length ? <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Amenities</p><div className="mt-2 flex flex-wrap gap-2">{property.amenities.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></div> : null}
              {(property.description || property.recent_renovations) && <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2"><TextBlock title="Property overview" value={property.description} /><TextBlock title="Recent renovations" value={property.recent_renovations} /></div>}
            </Panel>
            <Panel title="Detailed financials" detail="Operating performance and existing debt attached to this property.">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                <Fact label="Asking price" value={formatCurrency(finance?.asking_price)} /><Fact label="Appraised value" value={formatCurrency(finance?.appraised_value)} />
                <Fact label="Gross rent roll" value={formatCurrency(finance?.gross_rent_roll)} /><Fact label="Annual revenue" value={formatCurrency(finance?.annual_revenue)} />
                <Fact label="Effective gross income" value={formatCurrency(finance?.effective_gross_income)} /><Fact label="Operating expenses" value={formatCurrency(finance?.total_operating_expenses ?? finance?.annual_expenses)} />
                <Fact label="Net operating income" value={formatCurrency(finance?.noi)} /><Fact label="Occupancy" value={percent(finance?.occupancy_rate)} />
                <Fact label="Vacancy" value={percent(finance?.vacancy_rate)} /><Fact label="Cash on cash" value={percent(finance?.cash_on_cash)} />
                <Fact label="Loan balance" value={formatCurrency(finance?.loan_balance)} /><Fact label="Annual debt service" value={formatCurrency(finance?.annual_debt_service)} />
                <Fact label="Loan rate" value={percent(finance?.loan_rate)} /><Fact label="Loan type" value={finance?.loan_type} /><Fact label="Maturity" value={formatDate(finance?.loan_maturity_date)} />
              </dl>
            </Panel>
          </div>
          <div className="space-y-5">
            {exchange && <Panel title="Exchange context" detail="The workflow this property belongs to."><div className="grid grid-cols-2 gap-4"><Fact label="Status" value={sentence(exchange.status)} /><Fact label="Owner type" value={sentence(exchange.owner_type)} /><Fact label="Estimated equity" value={formatCurrency(exchange.estimated_equity)} /><Fact label="Exchange proceeds" value={formatCurrency(exchange.exchange_proceeds)} /></div><Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => onSelect({ type: "exchange", id: exchange.id })}>View exchange criteria and assignments</Button></Panel>}
            {criteria && <Panel title="Replacement criteria" detail="Optional preferences guiding this property’s search."><div className="grid grid-cols-2 gap-4"><Fact label="Target states" value={criteria.target_states?.join(", ")} /><Fact label="Asset types" value={criteria.target_asset_types?.map(sentence).join(", ")} /><Fact label="Additional cash" value={formatCurrency(criteria.additional_cash_available)} /><Fact label="Maximum LTV" value={percentRatio(criteria.max_ltv)} /><Fact label="Minimum ROE" value={percent(criteria.min_projected_roe)} /><Fact label="Monthly cash flow" value={formatCurrency(criteria.preferred_monthly_cash_flow)} /></div></Panel>}
            <Panel title="Listing assets" detail="Photos and documents attached to this listing."><div className="flex items-center justify-between py-2"><span className="flex items-center gap-2 text-sm text-slate-700"><ImageIcon className="h-4 w-4 text-slate-400" />Property photos</span><strong className="text-sm text-slate-950">{images.length}</strong></div><div className="flex items-center justify-between border-t border-slate-100 py-2"><span className="flex items-center gap-2 text-sm text-slate-700"><FileText className="h-4 w-4 text-slate-400" />Documents</span><strong className="text-sm text-slate-950">{documents.length}</strong></div>{documents.length > 0 && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{documents.map((doc) => <div key={doc.id} className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{doc.file_name || sentence(doc.document_type)}</div>)}</div>}</Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchRecord({ data, view, graph, match, onSelect }: Props & { match: CrmUserWorkspace["matches"][number] }) {
  const candidate = data.propertiesById[match.seller_property_id];
  const buyerPropertyBranch = Object.values(graph.propertyById).find((branch) => branch.exchange?.id === match.buyer_exchange_id) ?? null;
  const current = match.relinquished_property_id
    ? data.propertiesById[match.relinquished_property_id]
    : buyerPropertyBranch?.property ?? null;
  const candidateFinance = candidate ? data.financialsByProperty[candidate.id] : null;
  const currentFinance = current ? data.financialsByProperty[current.id] : null;
  const images = candidate ? data.imagesByProperty[candidate.id] ?? [] : [];
  const connection = view.connections.find((item) => item.match_id === match.id);
  const workflow = data.workflowStatesByMatch[match.id];
  const currentBranch = current ? graph.propertyById[current.id] ?? buyerPropertyBranch : buyerPropertyBranch;
  return (
    <div>
      {candidate ? <PropertyGallery property={candidate} images={images} compact /> : null}
      <RecordHeader eyebrow="Match record" title={candidate ? resolveListingName(candidate, true) : "Matched property"} description={`Compared with ${current ? resolveListingName(current, true) : "the current property"}`} actions={<div className="flex items-center gap-2"><Status value={match.status} />{workflow && <Badge variant="outline">{sentence(workflow.current_stage)}</Badge>}<div className="rounded-lg bg-slate-950 px-3 py-2 text-center text-white"><strong className="text-xl">{Math.round(match.total_score)}</strong><span className="ml-1 text-[9px] uppercase text-slate-400">score</span></div></div>} />
      <div className="space-y-5 p-5">
        <Panel title="Financial comparison" detail="Current property and matched replacement property side by side.">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="grid grid-cols-[minmax(130px,.7fr)_minmax(150px,1fr)_minmax(150px,1fr)] bg-slate-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><span>Metric</span><span>Current property</span><span className="text-emerald-700">Matched property</span></div>
            <Comparison label="Property value" current={formatCurrency(currentFinance?.asking_price ?? match.relinquished_value)} candidate={formatCurrency(candidateFinance?.asking_price ?? match.replacement_value)} />
            <Comparison label="NOI" current={formatCurrency(currentFinance?.noi)} candidate={formatCurrency(candidateFinance?.noi)} />
            <Comparison label="Cap rate" current={percent(currentFinance?.cap_rate)} candidate={percent(candidateFinance?.cap_rate)} />
            <Comparison label="Return on equity" current={percentRatio(match.buyer_current_roe)} candidate={percentRatio(match.candidate_roe)} highlight />
            <Comparison label="Annual debt service" current={formatCurrency(currentFinance?.annual_debt_service)} candidate={formatCurrency(match.candidate_annual_debt_service)} />
            <Comparison label="Estimated LTV" current="—" candidate={percentRatio(match.estimated_ltv)} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Kpi label="ROE improvement" value={match.roe_improvement_pp == null ? "—" : `${match.roe_improvement_pp.toFixed(2)} pts`} detail="Return improvement" icon={Sparkles} /><Kpi label="Purchasing capacity" value={formatCurrency(match.estimated_purchasing_capacity)} detail="Calculated ceiling" icon={CircleDollarSign} /><Kpi label="Replacement loan" value={formatCurrency(match.estimated_replacement_loan)} detail="Estimated financing" icon={Building2} /><Kpi label="Boot" value={formatCurrency(match.estimated_total_boot)} detail={sentence(match.boot_status)} icon={CheckCircle2} /></div>
        </Panel>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,.8fr)]">
          <Panel title="Why this matched" detail="The score and eligibility fields saved by the matching engine.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Score label="Financial" value={match.financial_score} /><Score label="Price" value={match.price_score} /><Score label="Location" value={match.geo_score} /><Score label="Asset" value={match.asset_score} /><Score label="Strategy" value={match.strategy_score} /><Score label="Timing" value={match.timing_score} /></div>
            {Array.isArray(match.eligibility_reasons) && match.eligibility_reasons.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Eligibility reasons</p><ul className="mt-2 space-y-2 text-sm text-slate-600">{match.eligibility_reasons.map((reason, index) => <li key={index} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{String(reason)}</li>)}</ul></div>}
          </Panel>
          <Panel title="Deal workflow" detail="Where this match stands and where to continue.">
            <div className="grid grid-cols-2 gap-4"><Fact label="Classification" value={sentence(match.match_classification)} /><Fact label="Workflow stage" value={sentence(workflow?.current_stage)} /><Fact label="Buyer viewed" value={match.buyer_agent_viewed ? "Yes" : "No"} /><Fact label="Listing side viewed" value={match.seller_agent_viewed ? "Yes" : "No"} /><Fact label="Created" value={formatDate(match.created_at, true)} /><Fact label="Updated" value={formatDate(match.updated_at, true)} /></div>
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">{currentBranch && <Button variant="outline" className="w-full" onClick={() => onSelect({ type: "property", id: currentBranch.property.id })}>Return to current property</Button>}<Button asChild variant="outline" className="w-full"><Link to={`/admin/opportunities/exchanges/${match.buyer_exchange_id}`}>Open buyer exchange<ExternalLink className="ml-2 h-3.5 w-3.5" /></Link></Button>{connection && <Button asChild className="w-full"><Link to={`/admin/opportunities/connections/${connection.id}`}><MessageSquare className="mr-2 h-4 w-4" />Open agent conversation</Link></Button>}</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ExchangeRecord({ data, view, exchange, graph, onSelect }: Props & { exchange: CrmUserWorkspace["exchanges"][number] }) {
  const client = exchange.client_id ? graph.clientById[exchange.client_id]?.client : null;
  const propertyBranch = Object.values(graph.propertyById).find((branch) => branch.exchange?.id === exchange.id);
  const criteria = data.criteriaByExchange[exchange.id];
  const assignments = view.assignments.filter((item) => item.exchange_id === exchange.id);
  return <div><RecordHeader eyebrow="Exchange workspace" title={propertyBranch ? resolveListingName(propertyBranch.property, true) : client?.client_name || "Exchange record"} description={client ? `Managed for ${client.client_name}` : `${sentence(exchange.owner_type)}-owned exchange`} actions={<Status value={exchange.status} />} /><div className="space-y-5 p-5"><section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4"><Kpi label="Estimated equity" value={formatCurrency(exchange.estimated_equity)} detail="Current position" icon={CircleDollarSign} /><Kpi label="Exchange proceeds" value={formatCurrency(exchange.exchange_proceeds)} detail="Estimated proceeds" icon={Building2} /><Kpi label="Matches" value={propertyBranch?.matches.length ?? 0} detail="Current opportunities" icon={Sparkles} /><Kpi label="Assignments" value={assignments.length} detail="Agent relationships" icon={Users} /></section><div className="grid gap-5 2xl:grid-cols-2"><Panel title="Exchange details" detail="Economics, close dates, and property relationship."><div className="grid grid-cols-2 gap-5"><Fact label="Owner type" value={sentence(exchange.owner_type)} /><Fact label="Client" value={client?.client_name} /><Fact label="Expected sale close" value={formatDate(exchange.sale_close_date)} /><Fact label="Actual sale close" value={formatDate(exchange.actual_close_date)} /><Fact label="Estimated basis" value={formatCurrency(exchange.estimated_basis)} /><Fact label="Estimated gain" value={formatCurrency(exchange.estimated_gain)} /><Fact label="Estimated tax" value={formatCurrency(exchange.estimated_tax_liability)} /></div>{propertyBranch && <Button className="mt-5 w-full" onClick={() => onSelect({ type: "property", id: propertyBranch.property.id })}>Open current property and matches</Button>}</Panel><Panel title="Replacement criteria" detail="Preferences used to focus the automated search."><div className="grid grid-cols-2 gap-5"><Fact label="Target states" value={criteria?.target_states?.join(", ")} /><Fact label="Asset types" value={criteria?.target_asset_types?.map(sentence).join(", ")} /><Fact label="Additional cash" value={formatCurrency(criteria?.additional_cash_available)} /><Fact label="Maximum LTV" value={percentRatio(criteria?.max_ltv)} /><Fact label="Minimum ROE" value={percent(criteria?.min_projected_roe)} /><Fact label="Monthly cash flow" value={formatCurrency(criteria?.preferred_monthly_cash_flow)} /><Fact label="Location required" value={criteria?.require_location_match ? "Yes" : "No"} /><Fact label="Asset type required" value={criteria?.require_asset_type_match ? "Yes" : "No"} /></div></Panel></div><Panel title="Agent assignments" detail="Current and historical representation attached to this exchange.">{assignments.length ? <div className="divide-y divide-slate-100">{assignments.map((assignment) => <div key={assignment.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-slate-900">{data.profilesById[assignment.agent_id]?.full_name || data.profilesById[assignment.agent_id]?.email || "Agent"}</p><p className="text-xs text-slate-500">{assignment.can_manage_exchange ? "Managing assignment" : "Limited assignment"} · assigned {formatDate(assignment.assigned_at, true)}</p></div><Status value={assignment.status} /></div>)}</div> : <EmptyState icon={Users} title="No agent assignments" detail="No assignment history is attached to this exchange." />}</Panel></div></div>;
}

function ActivityRecord({ data, view }: Props) {
  const events = buildEvents(data, view);
  const categoryCounts = events.reduce<Record<EventCategory, number>>((counts, event) => {
    counts[event.category] += 1;
    return counts;
  }, { Account: 0, Onboarding: 0, Listings: 0, Matches: 0, Relationships: 0, Messages: 0, Support: 0, Admin: 0 });
  return <div><RecordHeader eyebrow="Account history" title="Complete activity" description="Account lifecycle events plus operational activity from the selected Live or Demo workspace." /><div className="space-y-5 p-5"><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">{(Object.entries(categoryCounts) as Array<[EventCategory, number]>).map(([category, count]) => <div key={category} className="rounded-xl border border-slate-200 bg-white p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{category}</p><p className="mt-1 text-xl font-semibold text-slate-950">{count}</p></div>)}</section><div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]"><Panel title="Full timestamped history" detail={`${events.length} recorded events. Newest activity appears first and every row includes its exact timestamp.`}>{events.length ? <EventList events={events} /> : <EmptyState icon={Activity} title="No activity" detail="No activity is available for this account." />}</Panel><div className="space-y-5"><Panel title="Account lifecycle" detail="Shared authentication and profile timestamps. These belong to the account, not a demo dataset."><div className="grid grid-cols-2 gap-4"><Fact label="Account created" value={formatDate(data.authAccount?.created_at ?? data.profile.created_at, true)} /><Fact label="Email confirmed" value={formatDate(data.authAccount?.email_confirmed_at, true)} /><Fact label="Last sign-in" value={formatDate(data.authAccount?.last_sign_in_at, true)} /><Fact label="Profile updated" value={formatDate(data.profile.updated_at, true)} /><Fact label="Launchpad completed" value={formatDate(data.profile.launchpad_completed_at, true)} /><Fact label="Account suspended" value={formatDate(data.accountState?.suspended_at, true)} /></div></Panel><Panel title="Support tickets" detail="Requests in the selected workspace.">{view.supportTickets.length ? <div className="space-y-3">{view.supportTickets.map((ticket) => <article key={ticket.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-slate-900">{ticket.subject}</p><Status value={ticket.status} /></div><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{ticket.message}</p><p className="mt-2 text-[10px] text-slate-400">Opened {formatDate(ticket.created_at, true)} · Updated {formatDate(ticket.updated_at, true)}</p><Button asChild variant="ghost" size="sm" className="mt-2 px-0"><Link to={`/admin/support?ticket=${ticket.id}`}>Open ticket<ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button></article>)}</div> : <EmptyState icon={LifeBuoy} title="No support tickets" detail="This user has not submitted a ticket in this workspace." />}</Panel></div></div></div></div>;
}

function AccessRecord({ data, onRefetch }: Props) {
  const state = data.accountState?.account_status ?? (data.profile.verification_status === "suspended" ? "suspended" : "active");
  return <div><RecordHeader eyebrow="Administration" title="Audit & access" description="Authentication lifecycle, administrative history, and guarded account controls." /><div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]"><div className="space-y-5"><Panel title="Authentication and account state" detail="Canonical identity and application access."><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Fact label="User ID" value={data.profile.id} mono /><Fact label="Profile" value={data.profileExists ? "Created" : "Not created"} /><Fact label="Account status" value={sentence(state)} /><Fact label="Auth created" value={formatDate(data.authAccount?.created_at, true)} /><Fact label="Last sign-in" value={formatDate(data.authAccount?.last_sign_in_at, true)} /><Fact label="Email confirmed" value={formatDate(data.authAccount?.email_confirmed_at, true)} /><Fact label="Phone confirmed" value={formatDate(data.authAccount?.phone_confirmed_at, true)} /><Fact label="Banned until" value={formatDate(data.authAccount?.banned_until, true)} /><Fact label="Deleted" value={formatDate(data.authAccount?.deleted_at, true)} /><Fact label="Suspension reason" value={data.accountState?.suspension_reason} /><Fact label="Last reactivated" value={formatDate(data.accountState?.reactivated_at, true)} /></div></Panel><Panel title="Administrative audit log" detail="Actions performed by or on this account.">{data.auditLog.length ? <div className="divide-y divide-slate-100">{data.auditLog.map((row) => <div key={row.id} className="py-3 first:pt-0 last:pb-0"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-900">{row.summary || sentence(row.action)}</p><p className="mt-1 text-xs text-slate-500">{sentence(row.entity_type)} · {sentence(row.action)}</p></div><span className="shrink-0 text-[11px] text-slate-400">{formatDate(row.created_at, true)}</span></div>{row.metadata && Object.keys(row.metadata as object).length > 0 && <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-950 p-3 text-[10px] text-slate-200">{JSON.stringify(row.metadata, null, 2)}</pre>}</div>)}</div> : <EmptyState icon={ShieldCheck} title="No audit records" detail="No administrative activity is recorded." />}</Panel></div><div className="self-start rounded-xl border border-slate-200 bg-white p-5 xl:sticky xl:top-20"><div className="mb-5"><h2 className="font-semibold text-slate-950">Administrative controls</h2><p className="mt-1 text-xs leading-5 text-slate-500">Guarded server actions with atomic audit logging.</p></div><CrmAccountControls data={data} onChanged={onRefetch} /></div></div></div>;
}

function ClientPropertyCard({ data, branch, onSelect }: { data: CrmUserWorkspace; branch: WorkspacePropertyBranch; onSelect: (selection: WorkspaceSelection) => void }) {
  const property = branch.property;
  const finance = data.financialsByProperty[property.id];
  const image = data.imagesByProperty[property.id]?.[0];
  return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white"><button type="button" onClick={() => onSelect({ type: "property", id: property.id })} className="group block w-full text-left"><div className="relative h-44 bg-slate-100">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}<div className="absolute left-3 top-3 flex gap-2"><Status value={property.status} />{property.is_demo && <Badge className="bg-amber-100 text-amber-800">Demo</Badge>}</div></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(property, true)}</p><p className="mt-1 truncate text-xs text-slate-500">{[property.city, property.state].filter(Boolean).join(", ")} · {sentence(property.asset_type)}</p></div><ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-emerald-600" /></div><div className="mt-4 grid grid-cols-3 gap-3"><Fact label="Value" value={formatCurrency(finance?.asking_price ?? finance?.appraised_value)} /><Fact label="NOI" value={formatCurrency(finance?.noi)} /><Fact label="Cap rate" value={percent(finance?.cap_rate)} /></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-500">{branch.matches.length} {branch.matches.length === 1 ? "match" : "matches"}</span><span className="text-xs font-medium text-emerald-700">View listing record</span></div></div></button></article>;
}

function ClientRelationshipRow({ data, branch, onSelect }: { data: CrmUserWorkspace; branch: WorkspacePropertyBranch; onSelect: (selection: WorkspaceSelection) => void }) {
  const image = data.imagesByProperty[branch.property.id]?.[0];
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60"><button type="button" onClick={() => onSelect({ type: "property", id: branch.property.id })} className="flex w-full items-center gap-3 bg-white p-3 text-left hover:bg-slate-50"><div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-950">{resolveListingName(branch.property, true)}</p><p className="mt-1 text-xs text-slate-500">{sentence(branch.property.asset_type)} · {sentence(propertyOperatingState(branch))} · {branch.matches.length} {branch.matches.length === 1 ? "match" : "matches"}</p></div><ArrowRight className="h-4 w-4 text-slate-400" /></button>{branch.matches.length > 0 && <div className="border-t border-slate-200 px-3 py-2"><p className="mb-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">Matched replacement properties</p><div className="space-y-1">{branch.matches.slice(0, 3).map((match) => { const candidate = data.propertiesById[match.seller_property_id]; return <button key={match.id} type="button" onClick={() => onSelect({ type: "match", id: match.id })} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-950 text-[10px] font-semibold text-white">{Math.round(match.total_score)}</span><span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{candidate ? resolveListingName(candidate, true) : "Matched property"}</span><Status value={data.workflowStatesByMatch[match.id]?.current_stage ?? match.status} /></button>; })}</div>{branch.matches.length > 3 && <p className="mt-2 px-2 text-[10px] text-slate-500">+{branch.matches.length - 3} more opportunities</p>}</div>}</div>;
}

function ClientMatchGroup({ data, branch, onSelect }: { data: CrmUserWorkspace; branch: WorkspacePropertyBranch; onSelect: (selection: WorkspaceSelection) => void }) {
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3"><button type="button" onClick={() => onSelect({ type: "property", id: branch.property.id })} className="min-w-0 text-left"><p className="truncate text-sm font-semibold text-slate-950">{resolveListingName(branch.property, true)}</p><p className="mt-0.5 text-xs text-slate-500">Current property · {branch.matches.length} {branch.matches.length === 1 ? "matched opportunity" : "matched opportunities"}</p></button><Button variant="outline" size="sm" onClick={() => onSelect({ type: "property", id: branch.property.id })}>Open property</Button></div>{branch.matches.length ? <div className="divide-y divide-slate-100">{branch.matches.map((match) => { const candidate = data.propertiesById[match.seller_property_id]; const finance = candidate ? data.financialsByProperty[candidate.id] : null; const image = candidate ? data.imagesByProperty[candidate.id]?.[0] : null; const workflow = data.workflowStatesByMatch[match.id]; const connection = data.connections.find((item) => item.match_id === match.id); const messageCount = connection ? data.connectionMessageMetadata.filter((item) => item.parentId === connection.id).length : 0; return <div key={match.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><button type="button" onClick={() => onSelect({ type: "match", id: match.id })} className="flex min-w-0 flex-1 items-center gap-3 text-left"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-slate-950">{candidate ? resolveListingName(candidate, true) : "Matched property"}</p><span className="rounded-md bg-slate-950 px-1.5 py-0.5 text-[10px] font-semibold text-white">{Math.round(match.total_score)}</span></div><p className="mt-1 text-xs text-slate-500">{formatCurrency(finance?.asking_price)} · {percent(finance?.cap_rate)} cap · {formatCurrency(finance?.noi)} NOI</p><div className="mt-2 flex flex-wrap gap-2"><Status value={workflow?.current_stage ?? match.status} />{connection && <Status value={connection.status} />}</div></div></button><div className="flex shrink-0 gap-2 sm:flex-col"><Button variant="outline" size="sm" className="flex-1" onClick={() => onSelect({ type: "match", id: match.id })}>Open match</Button>{connection && <Button asChild size="sm" className="flex-1"><Link to={`/admin/opportunities/connections/${connection.id}`}><MessageSquare className="mr-1.5 h-3.5 w-3.5" />{messageCount} {messageCount === 1 ? "message" : "messages"}</Link></Button>}</div></div>; })}</div> : <div className="p-6"><EmptyState icon={Sparkles} title="No matches yet" detail="ExchangeUp has not found a replacement opportunity for this property." /></div>}</section>;
}

function ListingWorkspaceCard({ data, exchange, propertyBranch, clientName, onSelect }: { data: CrmUserWorkspace; exchange: CrmUserWorkspace["exchanges"][number] | null; propertyBranch: WorkspacePropertyBranch | null; clientName: string | null | undefined; onSelect: (selection: WorkspaceSelection) => void }) {
  const property = propertyBranch?.property ?? null;
  const finance = property ? data.financialsByProperty[property.id] : null;
  const image = property ? data.imagesByProperty[property.id]?.[0] : null;
  const criteria = exchange ? data.criteriaByExchange[exchange.id] : null;
  const completeness = [Boolean(property?.address), Boolean(finance), Boolean(criteria), Boolean(property && (data.imagesByProperty[property.id]?.length ?? 0) > 0)];
  const completedParts = completeness.filter(Boolean).length;
  const title = property ? resolveListingName(property, true) : "Untitled draft exchange";
  const status = exchange?.status ?? property?.status ?? "draft";
  return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex flex-col sm:flex-row"><div className="h-36 bg-slate-100 sm:h-auto sm:w-44">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full min-h-32 w-full" />}</div><div className="min-w-0 flex-1 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold text-slate-950">{title}</h3><Status value={status} />{exchange?.is_demo && <Badge className="bg-amber-100 text-amber-800">Demo</Badge>}</div><p className="mt-1 text-xs text-slate-500">{clientName ? `Client: ${clientName}` : sentence(exchange?.owner_type ?? "standalone listing")} · {property?.asset_type ? sentence(property.asset_type) : "Property type not entered"}</p></div><div className="text-right"><p className="text-xs font-semibold text-slate-900">{completedParts}/4 core sections</p><p className="text-[10px] text-slate-400">Address · financials · criteria · photos</p></div></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 lg:grid-cols-4"><Fact label="Created" value={formatDate(exchange?.created_at ?? property?.created_at, true)} /><Fact label="Last updated" value={formatDate(exchange?.updated_at ?? property?.updated_at, true)} /><Fact label="Published/listed" value={formatDate(property?.listed_at, true)} /><Fact label="Matches" value={propertyBranch?.matches.length ?? 0} /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{property ? `${[property.city, property.state].filter(Boolean).join(", ") || "Address is incomplete"} · ${formatCurrency(finance?.asking_price ?? finance?.appraised_value) || "Value not entered"}` : "The user saved the exchange before creating a complete property record."}</p><div className="flex gap-2">{property && <Button variant="outline" size="sm" onClick={() => onSelect({ type: "property", id: property.id })}>Open property</Button>}{exchange && <Button asChild size="sm"><Link to={`/admin/opportunities/exchanges/${exchange.id}`}>Open workspace<ArrowRight className="ml-2 h-3.5 w-3.5" /></Link></Button>}</div></div></div></div></article>;
}

type LaunchpadAuditStep = { id: string; title: string; detail: string; complete: boolean; inProgress: boolean; evidence: string; completedAt: string | null };
type LaunchpadAudit = { audience: "agent" | "property-owner"; completed: number; percent: number; steps: LaunchpadAuditStep[] };

function buildLaunchpadProgress(data: CrmUserWorkspace, view: CrmUserWorkspaceView): LaunchpadAudit {
  const isAgent = data.roles.includes("agent");
  const latest = (values: Array<string | null | undefined>) => values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
  const activeConnection = view.connections.find((connection) => ["accepted", "in_progress", "completed"].includes(connection.status));
  const viewedMatch = view.matches.find((match) => match.buyer_agent_id === data.profile.id ? match.buyer_agent_viewed : match.seller_agent_id === data.profile.id ? match.seller_agent_viewed : match.buyer_agent_viewed || match.seller_agent_viewed);
  let steps: LaunchpadAuditStep[];
  if (isAgent) {
    const filledProfile = [data.profile.brokerage_name?.trim(), data.profile.brokerage_address?.trim(), data.profile.bio?.trim(), data.profile.specializations?.length ? "specializations" : ""].filter(Boolean).length;
    const profileComplete = filledProfile === 4;
    const client = view.clients[0];
    const exchange = view.exchanges[0];
    const matchingComplete = Boolean(data.profile.launchpad_matching_ack_at);
    const matchesComplete = Boolean(data.profile.launchpad_matches_ack_at) || Boolean(viewedMatch);
    const requestsComplete = Boolean(data.profile.launchpad_client_requests_ack_at);
    const pipelineComplete = Boolean(data.profile.launchpad_pipeline_ack_at) || Boolean(activeConnection);
    steps = [
      { id: "profile", title: "Complete agent profile", detail: "Brokerage, brokerage address, bio, and specializations are the four live profile signals.", complete: profileComplete, inProgress: filledProfile > 0 && !profileComplete, evidence: `${filledProfile} of 4 profile sections completed`, completedAt: profileComplete ? data.profile.updated_at : null },
      { id: "client", title: "Add first client", detail: "At least one agent client record exists in the selected workspace scope.", complete: Boolean(client), inProgress: false, evidence: `${view.clients.length} client records`, completedAt: client?.created_at ?? null },
      { id: "exchange", title: "Create first listing", detail: "A draft counts as started; publishing is tracked separately in Listings & Drafts.", complete: Boolean(exchange), inProgress: false, evidence: `${view.exchanges.length} exchange workspaces`, completedAt: exchange?.created_at ?? null },
      { id: "matching", title: "View matching walkthrough", detail: "Recorded when the agent opens the matching explanation in the live launchpad.", complete: matchingComplete, inProgress: false, evidence: matchingComplete ? "Walkthrough acknowledged" : "No acknowledgement recorded", completedAt: data.profile.launchpad_matching_ack_at },
      { id: "matches", title: "Review matches", detail: "Recorded by the Matches acknowledgement or by actually opening a match.", complete: matchesComplete, inProgress: view.matches.length > 0 && !matchesComplete, evidence: matchesComplete ? "Match review activity recorded" : `${view.matches.length} available matches, none opened`, completedAt: data.profile.launchpad_matches_ack_at ?? (viewedMatch?.buyer_agent_viewed_at || viewedMatch?.seller_agent_viewed_at) },
      { id: "clientRequests", title: "Understand client requests", detail: "Recorded when the agent opens the Client Requests walkthrough.", complete: requestsComplete, inProgress: view.contactRequests.length > 0 && !requestsComplete, evidence: requestsComplete ? "Walkthrough acknowledged" : `${view.contactRequests.length} client requests`, completedAt: data.profile.launchpad_client_requests_ack_at },
      { id: "pipeline", title: "Use the pipeline", detail: "Recorded by opening Pipeline or by an accepted, under-contract, or completed agent connection.", complete: pipelineComplete, inProgress: view.connections.length > 0 && !pipelineComplete, evidence: pipelineComplete ? "Pipeline activity recorded" : `${view.connections.length} conversations, no active pipeline activity`, completedAt: data.profile.launchpad_pipeline_ack_at ?? activeConnection?.accepted_at ?? activeConnection?.under_contract_at ?? activeConnection?.closed_at },
    ];
  } else {
    const profileValues = [data.profile.full_name, data.profile.profile_photo_url, data.profile.profile_headline, data.profile.bio, data.profile.specializations?.length ? "specializations" : "", data.profile.service_areas?.length ? "service areas" : ""];
    const filledProfile = profileValues.filter((value) => Boolean(value && String(value).trim())).length;
    const profileComplete = Boolean(data.profile.full_name?.trim()) && filledProfile >= 3;
    const listing = view.exchanges[0];
    const published = view.exchanges.find((exchange) => exchange.status !== "draft");
    const matchingComplete = view.matches.length > 0 || Boolean(data.profile.launchpad_matching_ack_at);
    const reviewed = view.savedProperties.length > 0 || view.contactRequests.length > 0 || view.connections.length > 0;
    const pipeline = view.connections.find((connection) => ["accepted", "in_progress", "completed"].includes(connection.status));
    steps = [
      { id: "profile", title: "Introduce themselves", detail: "Name plus at least two recommended trust-profile details are used by the live owner launchpad.", complete: profileComplete, inProgress: filledProfile > 0 && !profileComplete, evidence: `${filledProfile} of 6 recommended profile details`, completedAt: profileComplete ? data.profile.updated_at : null },
      { id: "listing", title: "List current property", detail: "A saved draft or active exchange counts as a listing started.", complete: Boolean(listing), inProgress: false, evidence: `${view.exchanges.length} ${view.exchanges.length === 1 ? "exchange workspace" : "exchange workspaces"}`, completedAt: listing?.created_at ?? null },
      { id: "publish", title: "Publish exchange", detail: "At least one exchange has moved beyond draft status.", complete: Boolean(published), inProgress: Boolean(listing) && !published, evidence: published ? `${sentence(published.status)} exchange` : listing ? "Draft saved, not published" : "No listing started", completedAt: published?.updated_at ?? null },
      { id: "matching", title: "Reach automatic matching", detail: "The owner walkthrough is not persistently acknowledged, so generated matches are used as operational evidence.", complete: matchingComplete, inProgress: Boolean(published) && !matchingComplete, evidence: matchingComplete ? `${view.matches.length} matches generated` : "No matching activity yet", completedAt: data.profile.launchpad_matching_ack_at ?? view.matches[0]?.created_at ?? null },
      { id: "matches", title: "Review qualified matches", detail: "Saving a property, requesting agent contact, or creating a connection shows the owner acted on a match.", complete: reviewed, inProgress: view.matches.length > 0 && !reviewed, evidence: reviewed ? "Match action recorded" : `${view.matches.length} matches, no downstream action`, completedAt: latest([view.savedProperties[0]?.created_at, view.contactRequests[0]?.requested_at, view.connections[0]?.created_at]) },
      { id: "pipeline", title: "Move an opportunity forward", detail: "An accepted, under-contract, or completed agent conversation counts as pipeline activity.", complete: Boolean(pipeline), inProgress: view.connections.length > 0 && !pipeline, evidence: pipeline ? sentence(pipeline.status) : `${view.connections.length} conversations, none active`, completedAt: pipeline?.accepted_at ?? pipeline?.under_contract_at ?? pipeline?.closed_at ?? null },
    ];
  }
  const completed = steps.filter((step) => step.complete).length;
  return { audience: isAgent ? "agent" : "property-owner", completed, percent: Math.round((completed / steps.length) * 100), steps };
}

function CompactPropertyCard({ data, branch, onClick }: { data: CrmUserWorkspace; branch: WorkspacePropertyBranch; onClick: () => void }) {
  const finance = data.financialsByProperty[branch.property.id];
  const image = data.imagesByProperty[branch.property.id]?.[0];
  return <button type="button" onClick={onClick} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-emerald-300 hover:shadow-sm"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">{image ? <img src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-950 group-hover:text-emerald-700">{resolveListingName(branch.property, true)}</p><p className="mt-1 text-xs text-slate-500">{formatCurrency(finance?.asking_price ?? finance?.appraised_value)} · {branch.matches.length} matches</p><p className="mt-1 text-[10px] text-slate-400">{sentence(branch.property.asset_type)} · {sentence(propertyOperatingState(branch))}</p></div><ArrowRight className="h-4 w-4 text-slate-300" /></button>;
}

function PropertyGallery({ property, images, compact = false }: { property: Tables<"pledged_properties">; images: Tables<"property_images">[]; compact?: boolean }) {
  const sorted = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return <div className={`relative grid overflow-hidden bg-slate-100 ${compact ? "h-48" : "h-56 sm:h-72"} ${sorted.length > 1 ? "grid-cols-[minmax(0,1.7fr)_minmax(160px,.7fr)] gap-1" : "grid-cols-1"}`}>{sorted[0] ? <img src={resolvePropertyImageUrl(sorted[0].storage_path)} alt={resolveListingName(property, true)} className="h-full w-full object-cover" /> : <PropertyPhotoPlaceholder className="h-full w-full" />}{sorted.length > 1 && <div className="hidden grid-rows-2 gap-1 sm:grid">{sorted.slice(1, 3).map((image) => <img key={image.id} src={resolvePropertyImageUrl(image.storage_path)} alt="" className="h-full min-h-0 w-full object-cover" />)}</div>}<div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/45 to-transparent" />{sorted.length > 0 && <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-medium text-slate-700 shadow"><ImageIcon className="mr-1 inline h-3 w-3" />{sorted.length} photos</span>}</div>;
}

function RecordHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode }) { return <header className="border-b border-slate-200 bg-white px-5 py-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{eyebrow}</p><h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">{title}</h1><p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p></div>{actions && <div className="shrink-0">{actions}</div>}</div></header>; }
function Panel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="mb-4"><h2 className="font-semibold text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>{children}</section>; }
function Kpi({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Users }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-xl font-semibold text-slate-950">{value}</p></div><span className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Icon className="h-4 w-4" /></span></div><p className="mt-2 text-[11px] text-slate-500">{detail}</p></div>; }
function HeroFact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className={`rounded-lg border px-3 py-2.5 ${accent ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 truncate text-sm font-semibold ${accent ? "text-emerald-800" : "text-slate-900"}`}>{value || "—"}</p></div>; }
function Fact({ label, value, mono = false }: { label: string; value: string | number | null | undefined; mono?: boolean }) { return <div className="min-w-0"><dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className={`mt-1 break-words text-sm font-medium text-slate-800 ${mono ? "font-mono text-xs" : ""}`}>{value === null || value === undefined || value === "" ? "—" : value}</dd></div>; }
function ContactLine({ icon: Icon, value }: { icon: typeof Mail; value: string | null | undefined }) { return <div className="flex items-start gap-2.5 text-sm text-slate-600"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /><span className="min-w-0 break-words">{value || "Not provided"}</span></div>; }
function Status({ value }: { value: string }) { const normalized = value.toLowerCase(); const color = ["active", "accepted", "verified", "published", "connected", "completed"].includes(normalized) ? "bg-emerald-100 text-emerald-800" : ["pending", "requested", "draft", "awaiting_representation", "needs_agent", "not_started"].includes(normalized) ? "bg-amber-100 text-amber-800" : ["declined", "cancelled", "suspended", "failed"].includes(normalized) ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"; return <Badge className={`${color} border-0 text-[10px]`}>{sentence(value)}</Badge>; }
function TextBlock({ title, value }: { title: string; value: string | null }) { return <div><h3 className="text-xs font-semibold text-slate-900">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{value || "Not provided"}</p></div>; }
function Comparison({ label, current, candidate, highlight = false }: { label: string; current: string; candidate: string; highlight?: boolean }) { return <div className="grid grid-cols-[minmax(130px,.7fr)_minmax(150px,1fr)_minmax(150px,1fr)] border-t border-slate-100 px-4 py-3 text-sm"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-800">{current || "—"}</span><span className={`font-semibold ${highlight ? "text-emerald-700" : "text-slate-950"}`}>{candidate || "—"}</span></div>; }
function Score({ label, value }: { label: string; value: number }) { return <div><div className="flex items-center justify-between text-xs"><span className="text-slate-500">{label}</span><strong className="text-slate-900">{Math.round(value)}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div></div>; }
function EmptyState({ icon: Icon, title, detail }: { icon: typeof Users; title: string; detail: string }) { return <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center"><Icon className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-800">{title}</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{detail}</p></div>; }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"; }
function percent(value: number | null | undefined) { return value == null ? "" : `${value.toFixed(2)}%`; }
function percentRatio(value: number | null | undefined) { return value == null ? "" : `${(value * 100).toFixed(2)}%`; }

type EventCategory = "Account" | "Onboarding" | "Listings" | "Matches" | "Relationships" | "Messages" | "Support" | "Admin";
type EventItem = {
  id: string;
  title: string;
  detail: string;
  date: string;
  icon: typeof Activity;
  category: EventCategory;
  entityIds: string[];
};

function buildEvents(data: CrmUserWorkspace, view: CrmUserWorkspaceView): EventItem[] {
  const events: EventItem[] = [];
  const add = (event: Omit<EventItem, "entityIds"> & { entityIds?: Array<string | null | undefined> }) => {
    if (!event.date) return;
    events.push({ ...event, entityIds: event.entityIds?.filter((id): id is string => Boolean(id)) ?? [] });
  };
  const changedLater = (createdAt: string, updatedAt: string | null | undefined) =>
    Boolean(updatedAt && Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime()) > 60_000);
  const propertyName = (propertyId: string) => {
    const property = data.propertiesById[propertyId];
    return property ? resolveListingName(property, true) : "property";
  };

  add({ id: "account-created", title: "Account created", detail: data.authAccount?.email || data.profile.email || "ExchangeUp account", date: data.authAccount?.created_at ?? data.profile.created_at, icon: UserPlus, category: "Account" });
  if (data.authAccount?.email_confirmed_at) add({ id: "email-confirmed", title: "Email address confirmed", detail: data.authAccount.email || data.profile.email || "Authentication", date: data.authAccount.email_confirmed_at, icon: CheckCircle2, category: "Account" });
  if (data.authAccount?.phone_confirmed_at) add({ id: "phone-confirmed", title: "Phone number confirmed", detail: data.authAccount.phone || data.profile.phone || "Authentication", date: data.authAccount.phone_confirmed_at, icon: CheckCircle2, category: "Account" });
  if (data.authAccount?.last_sign_in_at) add({ id: "last-sign-in", title: "Most recent sign-in", detail: "Authentication activity", date: data.authAccount.last_sign_in_at, icon: Clock3, category: "Account" });
  add({ id: "profile-created", title: "Profile created", detail: data.profile.full_name || data.profile.email || "User profile", date: data.profile.created_at, icon: UserRound, category: "Account" });
  if (changedLater(data.profile.created_at, data.profile.updated_at)) add({ id: "profile-updated", title: "Profile last updated", detail: "Contact, company, brokerage, or trust-profile information changed", date: data.profile.updated_at, icon: UserRound, category: "Account" });
  if (data.accountState?.suspended_at) add({ id: "account-suspended", title: "Account suspended", detail: data.accountState.suspension_reason || "Administrative account restriction", date: data.accountState.suspended_at, icon: ShieldCheck, category: "Admin" });
  if (data.accountState?.reactivated_at) add({ id: "account-reactivated", title: "Account reactivated", detail: "Application access restored", date: data.accountState.reactivated_at, icon: ShieldCheck, category: "Admin" });

  const launchpadMilestones: Array<[string, string, string | null]> = [
    ["matching", "Matching walkthrough acknowledged", data.profile.launchpad_matching_ack_at],
    ["matches", "Matches walkthrough acknowledged", data.profile.launchpad_matches_ack_at],
    ["requests", "Client requests walkthrough acknowledged", data.profile.launchpad_client_requests_ack_at],
    ["pipeline", "Pipeline walkthrough acknowledged", data.profile.launchpad_pipeline_ack_at],
    ["completed", "Launchpad completed", data.profile.launchpad_completed_at],
  ];
  launchpadMilestones.forEach(([key, title, date]) => date && add({ id: `launchpad-${key}`, title, detail: `Onboarding${data.profile.launchpad_version ? ` · Version ${data.profile.launchpad_version}` : ""}`, date, icon: Rocket, category: "Onboarding" }));

  view.clients.forEach((client) => {
    add({ id: `client-created-${client.id}`, title: `Client added: ${client.client_name}`, detail: `${sentence(client.status)} client record`, date: client.created_at, icon: Users, category: "Relationships", entityIds: [client.id] });
    if (changedLater(client.created_at, client.updated_at)) add({ id: `client-updated-${client.id}`, title: `Client updated: ${client.client_name}`, detail: `${sentence(client.status)} client record`, date: client.updated_at, icon: Users, category: "Relationships", entityIds: [client.id] });
  });

  view.exchanges.forEach((exchange) => {
    const client = exchange.client_id ? data.clientsById[exchange.client_id] : null;
    const property = exchange.relinquished_property_id ? data.propertiesById[exchange.relinquished_property_id] : Object.values(data.propertiesById).find((item) => item.exchange_id === exchange.id);
    const label = property ? resolveListingName(property, true) : client?.client_name || "Untitled draft exchange";
    add({ id: `exchange-created-${exchange.id}`, title: exchange.status === "draft" ? `Draft started: ${label}` : `Exchange created: ${label}`, detail: `${sentence(exchange.owner_type)} workspace · ${sentence(exchange.status)}`, date: exchange.created_at, icon: ListChecks, category: "Listings", entityIds: [exchange.id, exchange.client_id, property?.id] });
    if (changedLater(exchange.created_at, exchange.updated_at)) add({ id: `exchange-updated-${exchange.id}`, title: `Exchange updated: ${label}`, detail: `Current status · ${sentence(exchange.status)}`, date: exchange.updated_at, icon: ListChecks, category: "Listings", entityIds: [exchange.id, exchange.client_id, property?.id] });
    if (exchange.actual_close_date) add({ id: `exchange-closed-${exchange.id}`, title: `Exchange closed: ${label}`, detail: "Actual closing date", date: exchange.actual_close_date, icon: CheckCircle2, category: "Listings", entityIds: [exchange.id, exchange.client_id, property?.id] });
  });

  view.properties.forEach((property) => {
    const label = resolveListingName(property, true);
    add({ id: `property-created-${property.id}`, title: `Property record created: ${label}`, detail: `${sentence(property.asset_type)} · ${sentence(property.status)}`, date: property.created_at, icon: Home, category: "Listings", entityIds: [property.id, property.exchange_id] });
    if (changedLater(property.created_at, property.updated_at)) add({ id: `property-updated-${property.id}`, title: `Property updated: ${label}`, detail: `${sentence(property.asset_type)} · ${sentence(property.status)}`, date: property.updated_at, icon: Home, category: "Listings", entityIds: [property.id, property.exchange_id] });
    if (property.listed_at) add({ id: `property-listed-${property.id}`, title: `Listing published: ${label}`, detail: `${sentence(property.asset_type)} listing`, date: property.listed_at, icon: Building2, category: "Listings", entityIds: [property.id, property.exchange_id] });
    if (property.withdrawn_at) add({ id: `property-withdrawn-${property.id}`, title: `Listing withdrawn: ${label}`, detail: "Property removed from active inventory", date: property.withdrawn_at, icon: Building2, category: "Listings", entityIds: [property.id, property.exchange_id] });
  });

  view.matches.forEach((match) => {
    const label = propertyName(match.seller_property_id);
    add({ id: `match-created-${match.id}`, title: `Match generated: ${label}`, detail: `${Math.round(match.total_score)} match score · ${sentence(match.status)}`, date: match.created_at, icon: Sparkles, category: "Matches", entityIds: [match.id, match.buyer_exchange_id, match.seller_property_id, match.relinquished_property_id, match.buyer_client_id, match.seller_client_id] });
    if (match.buyer_agent_viewed_at) add({ id: `match-buyer-viewed-${match.id}`, title: `Buyer side reviewed: ${label}`, detail: "Match opened by the buyer-side agent", date: match.buyer_agent_viewed_at, icon: Inbox, category: "Matches", entityIds: [match.id, match.buyer_exchange_id, match.seller_property_id] });
    if (match.seller_agent_viewed_at) add({ id: `match-seller-viewed-${match.id}`, title: `Listing side reviewed: ${label}`, detail: "Match opened by the listing-side agent", date: match.seller_agent_viewed_at, icon: Inbox, category: "Matches", entityIds: [match.id, match.buyer_exchange_id, match.seller_property_id] });
  });

  view.timeline.forEach((item) => add({ id: `timeline-${item.id}`, title: item.description, detail: `Exchange timeline · ${sentence(item.event_type)}`, date: item.created_at, icon: ArrowRight, category: "Listings", entityIds: [item.exchange_id] }));
  view.workflowEvents.forEach((item) => add({ id: `workflow-${item.id}`, title: `Match moved to ${sentence(item.to_stage)}`, detail: `Workflow · ${sentence(item.source)}`, date: item.created_at, icon: Workflow, category: "Matches", entityIds: [item.match_id] }));

  view.representations.forEach((row) => {
    add({ id: `representation-created-${row.id}`, title: "Agent relationship created", detail: `${row.agent_email} ↔ ${row.investor_email} · ${sentence(row.source)}`, date: row.created_at, icon: Users, category: "Relationships", entityIds: [row.id, row.requested_exchange_id, row.agent_id, row.investor_id] });
    if (row.accepted_at) add({ id: `representation-accepted-${row.id}`, title: "Agent relationship accepted", detail: `${row.agent_email} ↔ ${row.investor_email}`, date: row.accepted_at, icon: CheckCircle2, category: "Relationships", entityIds: [row.id, row.requested_exchange_id, row.agent_id, row.investor_id] });
    if (row.revoked_at) add({ id: `representation-revoked-${row.id}`, title: "Agent relationship ended", detail: row.ended_reason || sentence(row.status), date: row.revoked_at, icon: Users, category: "Relationships", entityIds: [row.id, row.requested_exchange_id, row.agent_id, row.investor_id] });
  });
  view.representationInvites.forEach((row) => {
    add({ id: `representation-invite-${row.id}`, title: `Representation invitation sent to ${row.email}`, detail: `${sentence(row.direction)} · ${sentence(row.delivery_status)}`, date: row.created_at, icon: Mail, category: "Relationships", entityIds: [row.id, row.representation_id] });
    if (row.accepted_at) add({ id: `representation-invite-accepted-${row.id}`, title: `Invitation accepted by ${row.email}`, detail: "Representation invitation", date: row.accepted_at, icon: CheckCircle2, category: "Relationships", entityIds: [row.id, row.representation_id] });
    if (row.cancelled_at) add({ id: `representation-invite-cancelled-${row.id}`, title: `Invitation cancelled for ${row.email}`, detail: "Representation invitation", date: row.cancelled_at, icon: Mail, category: "Relationships", entityIds: [row.id, row.representation_id] });
  });
  view.assignments.forEach((row) => {
    add({ id: `assignment-${row.id}`, title: "Agent assigned to exchange", detail: `${row.is_primary ? "Primary" : "Additional"} assignment · ${sentence(row.status)}`, date: row.assigned_at, icon: UserPlus, category: "Relationships", entityIds: [row.id, row.exchange_id, row.representation_id, row.agent_id, row.investor_id] });
    if (row.revoked_at) add({ id: `assignment-revoked-${row.id}`, title: "Agent removed from exchange", detail: "Assignment history preserved", date: row.revoked_at, icon: Users, category: "Relationships", entityIds: [row.id, row.exchange_id, row.representation_id, row.agent_id, row.investor_id] });
  });
  view.contactRequests.forEach((row) => {
    add({ id: `contact-request-${row.id}`, title: `Agent contact requested for ${propertyName(row.property_id)}`, detail: sentence(row.status), date: row.requested_at, icon: MessageSquare, category: "Relationships", entityIds: [row.id, row.exchange_id, row.match_id, row.property_id] });
    if (row.acted_at) add({ id: `contact-request-acted-${row.id}`, title: `Contact request ${sentence(row.status)}`, detail: propertyName(row.property_id), date: row.acted_at, icon: MessageSquare, category: "Relationships", entityIds: [row.id, row.exchange_id, row.match_id, row.property_id] });
  });
  view.recommendations.forEach((row) => {
    add({ id: `recommendation-${row.id}`, title: `Match recommended to client`, detail: sentence(row.response), date: row.created_at, icon: Sparkles, category: "Matches", entityIds: [row.id, row.exchange_id, row.match_id] });
    if (row.responded_at) add({ id: `recommendation-response-${row.id}`, title: `Client ${sentence(row.response)}`, detail: "Match recommendation response", date: row.responded_at, icon: CheckCircle2, category: "Matches", entityIds: [row.id, row.exchange_id, row.match_id] });
  });
  view.connectionIntents.forEach((row) => {
    add({ id: `connection-intent-${row.id}`, title: "Agent connection requested", detail: `${sentence(row.status)} · Waiting on ${sentence(row.waiting_on_side)}`, date: row.created_at, icon: MessageSquare, category: "Relationships", entityIds: [row.id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id, row.property_id] });
    if (row.resolved_at) add({ id: `connection-intent-resolved-${row.id}`, title: `Connection request ${sentence(row.status)}`, detail: row.resolution_note || "Agent connection intent resolved", date: row.resolved_at, icon: CheckCircle2, category: "Relationships", entityIds: [row.id, row.connection_id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id, row.property_id] });
  });
  view.connections.forEach((row) => {
    add({ id: `connection-${row.id}`, title: "Agent conversation started", detail: `${sentence(row.status)} · Match conversation`, date: row.initiated_at || row.created_at, icon: MessageSquare, category: "Messages", entityIds: [row.id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id] });
    if (row.accepted_at) add({ id: `connection-accepted-${row.id}`, title: "Agent conversation activated", detail: "Both agents can exchange messages", date: row.accepted_at, icon: MessageSquare, category: "Messages", entityIds: [row.id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id] });
    if (row.under_contract_at) add({ id: `connection-contract-${row.id}`, title: "Opportunity moved under contract", detail: "Agent-to-agent deal workflow", date: row.under_contract_at, icon: KanbanSquare, category: "Matches", entityIds: [row.id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id] });
    if (row.closed_at) add({ id: `connection-closed-${row.id}`, title: `Conversation ${sentence(row.status)}`, detail: "Agent-to-agent deal workflow", date: row.closed_at, icon: CheckCircle2, category: "Matches", entityIds: [row.id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id] });
    if (row.declined_at) add({ id: `connection-declined-${row.id}`, title: "Opportunity declined", detail: row.decline_reason || "Agent-to-agent connection", date: row.declined_at, icon: MessageSquare, category: "Matches", entityIds: [row.id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id] });
    if (row.failed_at) add({ id: `connection-failed-${row.id}`, title: "Opportunity failed", detail: row.failure_reason || "Agent-to-agent connection", date: row.failed_at, icon: MessageSquare, category: "Matches", entityIds: [row.id, row.buyer_exchange_id, row.seller_exchange_id, row.match_id] });
  });
  view.collaborationThreads.forEach((row) => add({ id: `thread-${row.id}`, title: "Private client-agent thread created", detail: "Client collaboration workspace", date: row.created_at, icon: MessageSquare, category: "Messages", entityIds: [row.id, row.exchange_id, row.match_id, row.representation_id] }));
  [...view.connectionMessageMetadata, ...view.collaborationMessageMetadata].forEach((row) => add({ id: `message-${row.id}`, title: "Message sent", detail: row.readAt ? `Read ${formatDate(row.readAt, true)}` : "Unread", date: row.createdAt, icon: MessageSquare, category: "Messages", entityIds: [row.parentId, row.senderId] }));
  view.savedProperties.forEach((row) => add({ id: `saved-${row.id}`, title: `Property saved: ${propertyName(row.property_id)}`, detail: "Saved by property owner", date: row.created_at, icon: Home, category: "Matches", entityIds: [row.id, row.property_id] }));
  view.listingInquiries.forEach((row) => {
    add({ id: `inquiry-${row.id}`, title: `Listing inquiry created: ${propertyName(row.property_id)}`, detail: sentence(row.status), date: row.created_at, icon: MessageSquare, category: "Relationships", entityIds: [row.id, row.property_id] });
    if (row.responded_at) add({ id: `inquiry-response-${row.id}`, title: `Listing inquiry ${sentence(row.status)}`, detail: propertyName(row.property_id), date: row.responded_at, icon: MessageSquare, category: "Relationships", entityIds: [row.id, row.property_id] });
  });
  view.clientInvites.forEach((row) => {
    add({ id: `client-invite-${row.id}`, title: `Client invited: ${row.email}`, detail: sentence(row.status), date: row.created_at, icon: Mail, category: "Relationships", entityIds: [row.id, row.client_id] });
    if (row.accepted_at) add({ id: `client-invite-accepted-${row.id}`, title: `Client joined: ${row.email}`, detail: "Client workspace invitation accepted", date: row.accepted_at, icon: CheckCircle2, category: "Relationships", entityIds: [row.id, row.client_id, row.accepted_user_id] });
  });
  view.identificationList.forEach((row) => {
    add({ id: `identification-${row.id}`, title: `Property added to identification list`, detail: `Position ${row.position} · ${sentence(row.status)}`, date: row.added_at, icon: ListChecks, category: "Matches", entityIds: [row.id, row.exchange_id, row.match_id, row.property_id] });
    if (row.removed_at) add({ id: `identification-removed-${row.id}`, title: "Property removed from identification list", detail: propertyName(row.property_id), date: row.removed_at, icon: ListChecks, category: "Matches", entityIds: [row.id, row.exchange_id, row.match_id, row.property_id] });
  });
  view.notifications.forEach((row) => add({ id: `notification-${row.id}`, title: row.title, detail: `Notification · ${row.read ? "Read" : "Unread"}`, date: row.created_at, icon: CheckCircle2, category: "Account" }));
  view.supportTickets.forEach((row) => {
    add({ id: `ticket-created-${row.id}`, title: `Support ticket opened: ${row.subject}`, detail: sentence(row.category), date: row.created_at, icon: LifeBuoy, category: "Support", entityIds: [row.id] });
    if (changedLater(row.created_at, row.updated_at)) add({ id: `ticket-updated-${row.id}`, title: `Support ticket ${sentence(row.status)}`, detail: row.subject, date: row.updated_at, icon: LifeBuoy, category: "Support", entityIds: [row.id] });
  });
  data.auditLog.forEach((row) => add({ id: `audit-${row.id}`, title: row.summary || sentence(row.action), detail: `Admin audit · ${sentence(row.entity_type)} · ${sentence(row.action)}`, date: row.created_at, icon: ShieldCheck, category: "Admin", entityIds: [row.id, row.entity_id] }));

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

function EventList({ events, compact = false }: { events: EventItem[]; compact?: boolean }) {
  return <div className="divide-y divide-slate-100">{events.map((event) => <div key={event.id} className={`flex gap-3 py-3 first:pt-0 last:pb-0 ${compact ? "items-start" : "items-start"}`}><span className="mt-0.5 rounded-full bg-slate-100 p-2"><event.icon className="h-3.5 w-3.5 text-slate-500" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-slate-900">{event.title}</span><Badge variant="outline" className="text-[9px] font-medium text-slate-500">{event.category}</Badge></span><span className="mt-0.5 block text-xs text-slate-500">{event.detail}</span><span className="mt-1 block text-[10px] text-slate-400 sm:hidden">{formatDate(event.date, true)}</span></span><span className="hidden shrink-0 text-[11px] text-slate-400 sm:block">{formatDate(event.date, true)}</span></div>)}</div>;
}
