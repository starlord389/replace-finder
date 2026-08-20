import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Inbox,
  MailWarning,
  MessageSquareText,
  Plus,
  Sparkles,
  UserPlus,
  UserRoundCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAgentAttentionQuery, type AgentAttentionData } from "@/features/agent/hooks/useAgentAttentionQuery";
import { useAgentClientsCount } from "@/features/agent/hooks/useAgentClientsCount";
import { useAgentLaunchpadProgress } from "@/features/agent/hooks/useAgentLaunchpadProgress";
import { useAgentListings, type AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import { useUnifiedRelationships, isLiveStage } from "@/features/matches/hooks/useUnifiedRelationships";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { deriveUiStatus } from "@/features/matches/components/inbox/inboxHelpers";
import { readMatchLocalState, useMatchLocalStateVersion } from "@/features/matches/components/inbox/useMatchLocalState";
import {
  useAgentContactRequests,
  useRepresentationInvites,
  useRepresentations,
} from "@/features/representation/hooks/useRepresentations";
import type {
  AgentContactRequest,
  Representation,
  RepresentationInvite,
} from "@/features/representation/types";
import { DemoDataControls } from "@/features/workspace/components/DemoDataControls";
import { ListingPreviewDialog } from "@/features/workspace/components/ListingPreviewDialog";
import { PropertyPhotoPlaceholder } from "@/components/property/PropertyPhotoPlaceholder";
import { getSuspendedAccountUi } from "@/lib/accountAccess";
import { cn } from "@/lib/utils";

const OPEN_MATCH_STAGES = new Set([
  "new",
  "incoming",
  "pending_in",
  "pending_out",
  "connected",
  "conversing",
]);

const PENDING_REPRESENTATION_STATUSES = new Set([
  "pending_signup",
  "pending_verification",
  "awaiting_acceptance",
  "awaiting_investor_confirmation",
]);

function formatMoney(value: number | null | undefined) {
  if (!value) return "Price pending";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  attention = false,
}: {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  href: string;
  attention?: boolean;
}) {
  return (
    <Link to={href} className="group block">
      <Card className={cn(
        "h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-sm",
        attention && value > 0 && "border-amber-200 bg-amber-50/40",
      )}>
        <CardContent className="flex h-full items-start justify-between gap-3 p-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={cn(
            "rounded-xl bg-primary/10 p-2.5 text-primary",
            attention && value > 0 && "bg-amber-100 text-amber-700",
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface DashboardAction {
  id: string;
  title: string;
  detail: string;
  category: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  tone: "amber" | "blue" | "red" | "green";
  priority: number;
  timestamp?: string | null;
}

function buildActionCenterItems({
  attention,
  representations,
  contactRequests,
  invitations,
  relationships,
}: {
  attention?: AgentAttentionData;
  representations: Representation[];
  contactRequests: AgentContactRequest[];
  invitations: RepresentationInvite[];
  relationships: Relationship[];
}) {
  const actions: DashboardAction[] = [];
  const representationIds = new Set(representations.map((representation) => representation.id));

  for (const relationship of relationships.filter((item) => item.unreadCount > 0 && item.connectionId)) {
    const unreadLabel = `${relationship.unreadCount} unread message${relationship.unreadCount === 1 ? "" : "s"}`;
    const conversationHref = relationship.mySide === "buyer"
      ? `/agent/matches?listing=${relationship.buyerExchangeId}&match=${relationship.matchId}&view=conversation`
      : relationship.openHref;
    actions.push({
      id: `message-${relationship.connectionId}`,
      title: relationship.counterpartyName
        ? `New message from ${relationship.counterpartyName}`
        : "New message from the other agent",
      detail: `${unreadLabel} · ${relationship.propertyName}`,
      category: "Conversation",
      cta: "Reply",
      href: conversationHref,
      icon: MessageSquareText,
      tone: "blue",
      priority: 1,
      timestamp: relationship.lastActivityAt,
    });
  }

  for (const request of contactRequests.filter((item) => item.status === "requested")) {
    actions.push({
      id: `contact-${request.id}`,
      title: "A client wants you to review a match",
      detail: request.investor_note?.trim() || "Review the selected property before contacting the listing agent.",
      category: "Client request",
      cta: "Review request",
      href: `/agent/representation?request=${request.id}`,
      icon: Inbox,
      tone: "green",
      priority: 2,
      timestamp: request.requested_at,
    });
  }

  for (const representation of representations.filter(
    (item) => item.source !== "agent_invite" && ["awaiting_acceptance", "pending_verification"].includes(item.status),
  )) {
    actions.push({
      id: `representation-${representation.id}`,
      title: "New representation request",
      detail: `${representation.investor_email} would like to work with you. Review the relationship before accepting.`,
      category: "Potential client",
      cta: "Review client",
      href: "/agent/representation",
      icon: UserPlus,
      tone: "green",
      priority: 3,
      timestamp: representation.created_at,
    });
  }

  for (const invitation of invitations.filter(
    (item) => representationIds.has(item.representation_id) && item.status === "pending" && item.delivery_status === "failed",
  )) {
    actions.push({
      id: `invitation-${invitation.id}`,
      title: "A client invitation needs attention",
      detail: `The workspace invitation to ${invitation.email} was not delivered.`,
      category: "Invitation",
      cta: "Fix invitation",
      href: "/agent/representation",
      icon: MailWarning,
      tone: "red",
      priority: 4,
      timestamp: invitation.created_at,
    });
  }

  for (const match of attention?.unreviewedMatches ?? []) {
    actions.push({
      id: `match-${match.matchId}`,
      title: `New match for ${match.clientName}`,
      detail: `${match.propertyName} · Match score ${Math.round(match.totalScore)}`,
      category: "Match review",
      cta: "Review match",
      href: `/agent/matches?listing=${match.buyerExchangeId}&match=${match.matchId}`,
      icon: Sparkles,
      tone: "amber",
      priority: 5,
      timestamp: match.createdAt,
    });
  }

  return actions
    .sort((left, right) => left.priority - right.priority || (right.timestamp ?? "").localeCompare(left.timestamp ?? ""))
    .slice(0, 6);
}

function ActionCenter({ actions }: { actions: DashboardAction[] }) {
  const toneStyles = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    green: "bg-emerald-100 text-emerald-700",
  } as const;

  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Action center
            </CardTitle>
            <CardDescription className="mt-1">
              Your highest-priority client, match, and agent tasks in one place.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/agent/representation">Open Client Requests</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Everything is handled</p>
              <p className="mt-1 text-sm text-emerald-800">
                No unread conversations, client requests, match reviews, or invitation problems need you right now.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <li key={action.id} className="flex items-center gap-3 p-3.5 sm:p-4">
                  <div className={cn("rounded-xl p-2.5", toneStyles[action.tone])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{action.title}</p>
                      <Badge variant="secondary" className="text-[10px]">{action.category}</Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{action.detail}</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="shrink-0">
                    <Link to={action.href}>
                      {action.cta}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineSnapshot({ relationships }: { relationships: Relationship[] }) {
  useMatchLocalStateVersion();
  const counts = { new: 0, conversation: 0, loi: 0, contract: 0, closed: 0 };
  for (const relationship of relationships) {
    switch (deriveUiStatus(relationship, readMatchLocalState(relationship.matchId))) {
      case "new":
      case "sent_to_client":
        counts.new += 1;
        break;
      case "client_interested":
      case "in_conversation":
        counts.conversation += 1;
        break;
      case "loi":
        counts.loi += 1;
        break;
      case "under_contract":
        counts.contract += 1;
        break;
      case "closed":
        counts.closed += 1;
        break;
      default:
        break;
    }
  }

  const stages = [
    ["New", counts.new],
    ["Talking", counts.conversation],
    ["LOI", counts.loi],
    ["Contract", counts.contract],
    ["Closed", counts.closed],
  ] as const;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Pipeline snapshot</CardTitle>
            <CardDescription>Where active opportunities stand.</CardDescription>
          </div>
          <Link to="/agent/pipeline" className="text-xs font-semibold text-primary hover:underline">
            Open pipeline
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Link to="/agent/pipeline" className="grid grid-cols-5 overflow-hidden rounded-xl border hover:bg-muted/30">
          {stages.map(([label, count], index) => (
            <div key={label} className={cn("px-1 py-3 text-center", index > 0 && "border-l")}>
              <p className="text-lg font-bold text-foreground">{count}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            </div>
          ))}
        </Link>
      </CardContent>
    </Card>
  );
}

function ClientNetworkCard({
  activeRepresentations,
  pendingInvitations,
  matchRequests,
}: {
  activeRepresentations: number;
  pendingInvitations: number;
  matchRequests: number;
}) {
  const rows = [
    { label: "Connected property owners", value: activeRepresentations, icon: UserRoundCheck },
    { label: "Invitations awaiting acceptance", value: pendingInvitations, icon: Users },
    { label: "Match requests ready to review", value: matchRequests, icon: Inbox },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Client network</CardTitle>
        <CardDescription>Owners using the platform with you as their agent.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                {row.label}
              </div>
              <span className="font-semibold text-foreground">{row.value}</span>
            </div>
          );
        })}
        <Button variant="outline" className="w-full" asChild>
          <Link to="/agent/representation">Manage Client Requests</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function OpportunityList({ relationships }: { relationships: Relationship[] }) {
  const opportunities = [...relationships]
    .filter((relationship) => isLiveStage(relationship.stage))
    .sort((left, right) => right.score - left.score || (right.lastActivityAt ?? "").localeCompare(left.lastActivityAt ?? ""))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Best current opportunities</CardTitle>
            <CardDescription>Highest-ranked active matches across your client portfolio.</CardDescription>
          </div>
          <Link to="/agent/matches" className="shrink-0 text-xs font-semibold text-primary hover:underline">View all matches</Link>
        </div>
      </CardHeader>
      <CardContent>
        {opportunities.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Sparkles className="mx-auto h-7 w-7 text-muted-foreground/50" />
            <p className="mt-2 text-sm font-medium">No active matches yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Activate a client listing to start matching.</p>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border">
            {opportunities.map((relationship) => {
              const location = [relationship.propertyCity, relationship.propertyState].filter(Boolean).join(", ");
              return (
                <li key={relationship.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {Math.round(relationship.score)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{relationship.propertyName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {relationship.clientName || "Client"}{location ? ` · ${location}` : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={relationship.openHref}>
                      Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ListingPortfolio({
  listings,
  onOpen,
}: {
  listings: AgentListing[];
  onOpen: (listing: AgentListing) => void;
}) {
  const recent = listings.slice(0, 4);
  if (recent.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Client listings</CardTitle>
            <CardDescription>Recent relinquished properties and their current status.</CardDescription>
          </div>
          <Link to="/agent/listings" className="shrink-0 text-xs font-semibold text-primary hover:underline">View all listings</Link>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {recent.map((listing) => {
          const location = [listing.city, listing.state].filter(Boolean).join(", ");
          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => onOpen(listing)}
              className="group flex overflow-hidden rounded-xl border bg-background text-left transition-colors hover:border-primary/30 hover:bg-muted/20"
            >
              <div className="h-24 w-28 shrink-0 overflow-hidden bg-muted">
                {listing.coverUrl ? (
                  <img src={listing.coverUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
                ) : (
                  <PropertyPhotoPlaceholder compact />
                )}
              </div>
              <div className="min-w-0 flex-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{listing.clientName || "Client"}</p>
                  <Badge variant={listing.status === "active" ? "default" : "secondary"} className="text-[9px]">
                    {formatStatus(listing.status)}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{listing.propertyName || location || "Property details pending"}</p>
                <p className="mt-2 text-xs font-semibold text-foreground">{formatMoney(listing.askingPrice)}</p>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function AgentDashboard() {
  const {
    user,
    profileName,
    isAccountSuspended,
  } = useAuth();
  const { data: attention, isLoading: attentionLoading } = useAgentAttentionQuery(user?.id);
  const { data: clientCount = 0, isLoading: clientsLoading } = useAgentClientsCount(user?.id);
  const { data: relationships = [], isLoading: relationshipsLoading } = useUnifiedRelationships();
  const { data: launchpadProgress, isLoading: launchpadLoading } = useAgentLaunchpadProgress(user?.id);
  const { data: listings = [], isLoading: listingsLoading } = useAgentListings(user?.id);
  const { data: representations = [], isLoading: representationsLoading } = useRepresentations("agent");
  const { data: contactRequests = [], isLoading: requestsLoading } = useAgentContactRequests("agent");
  const { data: invitations = [], isLoading: invitationsLoading } = useRepresentationInvites();
  const [previewListing, setPreviewListing] = useState<AgentListing | null>(null);

  const suspendedUi = getSuspendedAccountUi();
  const launchpadIncomplete = !isAccountSuspended && !launchpadProgress?.profile.launchpad_completed_at;

  const isLoading = attentionLoading
    || clientsLoading
    || relationshipsLoading
    || launchpadLoading
    || listingsLoading
    || representationsLoading
    || requestsLoading
    || invitationsLoading;

  const scopedInvitationIds = useMemo(
    () => new Set(representations.map((representation) => representation.id)),
    [representations],
  );
  const activeRepresentations = representations.filter((representation) => representation.status === "active");
  const pendingOutboundInvitations = representations.filter(
    (representation) => representation.source === "agent_invite" && PENDING_REPRESENTATION_STATUSES.has(representation.status),
  );
  const actionableContactRequests = contactRequests.filter((request) => request.status === "requested");
  const incomingRepresentationRequests = representations.filter(
    (representation) => representation.source !== "agent_invite" && ["awaiting_acceptance", "pending_verification"].includes(representation.status),
  );
  const failedInvitations = invitations.filter(
    (invitation) => scopedInvitationIds.has(invitation.representation_id) && invitation.status === "pending" && invitation.delivery_status === "failed",
  );
  const clientRequestAttentionCount = actionableContactRequests.length
    + incomingRepresentationRequests.length
    + failedInvitations.length;

  const activeListings = listings.filter((listing) => listing.status === "active").length;
  const draftListings = listings.filter((listing) => listing.status === "draft").length;
  const agentRelationships = relationships.filter((relationship) => Boolean(relationship.clientId));
  const openMatchCount = agentRelationships.filter((relationship) => OPEN_MATCH_STAGES.has(relationship.stage)).length;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = agentRelationships.filter((relationship) => {
    if (relationship.stage !== "new" && relationship.stage !== "incoming") return false;
    const timestamp = relationship.lastActivityAt ? parseISO(relationship.lastActivityAt).getTime() : Number.NaN;
    return Number.isFinite(timestamp) && timestamp >= oneWeekAgo;
  }).length;

  const conversationRelationships = useMemo(
    () => relationships.filter((relationship) => Boolean(relationship.connectionId)),
    [relationships],
  );
  const unreadMessageCount = conversationRelationships.reduce((total, relationship) => total + relationship.unreadCount, 0);
  const unreadConversationCount = conversationRelationships.filter((relationship) => relationship.unreadCount > 0).length;
  const firstUnreadConversation = conversationRelationships.find((relationship) => relationship.unreadCount > 0);
  const unreadConversationHref = firstUnreadConversation
    ? firstUnreadConversation.mySide === "buyer"
      ? `/agent/matches?listing=${firstUnreadConversation.buyerExchangeId}&match=${firstUnreadConversation.matchId}&view=conversation`
      : firstUnreadConversation.openHref
    : "/agent/pipeline";

  const actionItems = useMemo(
    () => buildActionCenterItems({ attention, representations, contactRequests, invitations, relationships: conversationRelationships }),
    [attention, contactRequests, invitations, representations, conversationRelationships],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DemoDataControls />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{profileName ? `, ${profileName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is what needs attention across your clients, matches, and active deals.
          </p>
          {isAccountSuspended ? (
            <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" /> Suspended
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/agent/exchanges/new">
              <Building2 className="mr-1.5 h-4 w-4" /> New Listing
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/agent/clients/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add Client
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/agent/representation">
              <Inbox className="mr-1.5 h-4 w-4" /> Client Requests
              {clientRequestAttentionCount > 0 ? (
                <Badge className="ml-2 h-5 min-w-5 justify-center px-1.5">{clientRequestAttentionCount}</Badge>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>

      {isAccountSuspended ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {suspendedUi.description}
        </div>
      ) : null}

      {launchpadIncomplete ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Finish your Launchpad</p>
              <p className="text-amber-800">Complete the remaining setup and workflow walkthrough steps.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="border-amber-300 bg-white hover:bg-amber-100">
            <Link to="/agent/launchpad">Continue Launchpad <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Clients" value={clientCount} detail={`${activeRepresentations.length} connected to a workspace`} icon={Users} href="/agent/clients" />
        <KpiCard label="Active listings" value={activeListings} detail={draftListings > 0 ? `${draftListings} draft${draftListings === 1 ? "" : "s"}` : "No drafts waiting"} icon={Building2} href="/agent/listings" />
        <KpiCard label="Open matches" value={openMatchCount} detail={newThisWeek > 0 ? `${newThisWeek} new this week` : "No new matches this week"} icon={Sparkles} href="/agent/matches" />
        <KpiCard label="Unread messages" value={unreadMessageCount} detail={unreadMessageCount > 0 ? `Across ${unreadConversationCount} conversation${unreadConversationCount === 1 ? "" : "s"}` : "All conversations caught up"} icon={MessageSquareText} href={unreadConversationHref} attention />
        <KpiCard label="Client Requests" value={clientRequestAttentionCount} detail={clientRequestAttentionCount > 0 ? "Ready for your attention" : "Nothing waiting"} icon={Inbox} href="/agent/representation" attention />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <ActionCenter actions={actionItems} />
          <OpportunityList relationships={agentRelationships} />
        </div>
        <aside className="space-y-6">
          <PipelineSnapshot relationships={agentRelationships} />
          <ClientNetworkCard
            activeRepresentations={activeRepresentations.length}
            pendingInvitations={pendingOutboundInvitations.length}
            matchRequests={actionableContactRequests.length}
          />
        </aside>
      </div>

      <ListingPortfolio listings={listings} onOpen={setPreviewListing} />

      {listings.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Start your first 1031 exchange</CardTitle>
            <CardDescription>Add a client and create their relinquished-property listing to begin matching.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild><Link to="/agent/clients/new">Add your first client <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button variant="outline" asChild><Link to="/agent/exchanges/new">Create listing</Link></Button>
          </CardContent>
        </Card>
      ) : null}

      <ListingPreviewDialog
        listing={previewListing}
        open={Boolean(previewListing)}
        onOpenChange={(open) => {
          if (!open) setPreviewListing(null);
        }}
      />
    </div>
  );
}
