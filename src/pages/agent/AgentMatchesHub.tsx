import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  Search,
  MessageSquare,
  Handshake,
  ExternalLink,
  ArrowLeft,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { BOOT_STATUS_LABELS } from "@/lib/constants";
import {
  useUnifiedRelationships,
  STAGE_LABELS,
  isConnected,
  isLiveStage,
  type Relationship,
  type RelationshipStage,
} from "@/features/matches/hooks/useUnifiedRelationships";
import { ThreadView } from "@/features/messages/components/ThreadView";

// ── helpers ─────────────────────────────────────────────

function currency(v: number | null) {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function scoreClass(s: number) {
  if (s >= 85) return "bg-emerald-600 text-white";
  if (s >= 70) return "bg-amber-500 text-white";
  return "bg-rose-500 text-white";
}

const FILTERS: Array<{ value: string; label: string; match: (s: RelationshipStage) => boolean }> = [
  { value: "live", label: "Live", match: isLiveStage },
  { value: "new", label: "New", match: (s) => s === "new" || s === "incoming" },
  { value: "pending", label: "Pending", match: (s) => s === "pending_in" || s === "pending_out" },
  { value: "active", label: "Active", match: (s) => s === "connected" || s === "conversing" },
  { value: "closed", label: "Closed", match: (s) => s === "closed_won" || s === "closed_lost" },
  { value: "all", label: "All", match: () => true },
];

function BootChip({ status, total }: { status: string; total: number | null }) {
  if (status === "no_boot") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> No boot
      </span>
    );
  }
  if (status === "insufficient_data") return null;
  const Icon = status === "significant_boot" ? ShieldAlert : AlertTriangle;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
      <Icon className="h-3 w-3" /> {total ? currency(total) : BOOT_STATUS_LABELS[status] || status}
    </span>
  );
}

function StageBadge({ stage }: { stage: RelationshipStage }) {
  const variants: Record<RelationshipStage, string> = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    incoming: "bg-violet-100 text-violet-800 border-violet-200",
    pending_in: "bg-amber-100 text-amber-900 border-amber-200",
    pending_out: "bg-muted text-muted-foreground border-border",
    connected: "bg-emerald-100 text-emerald-800 border-emerald-200",
    conversing: "bg-emerald-100 text-emerald-800 border-emerald-200",
    closed_won: "bg-secondary text-secondary-foreground border-border",
    closed_lost: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        variants[stage],
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

// ── List row ────────────────────────────────────────────

function ListRow({
  rel,
  active,
  onClick,
}: {
  rel: Relationship;
  active: boolean;
  onClick: () => void;
}) {
  const displayName = rel.counterpartyName ?? (rel.mySide === "buyer" ? "Anonymous seller agent" : "Anonymous buyer agent");
  const subtitle = rel.propertyName + (rel.propertyCity ? ` · ${rel.propertyCity}, ${rel.propertyState}` : "");
  const preview =
    rel.lastMessagePreview ??
    (rel.stage === "new"
      ? `Match score ${Math.round(rel.score)} — ${currency(rel.askingPrice)}`
      : rel.stage === "incoming"
      ? `Another agent's exchange matched your listing.`
      : rel.stage === "pending_in"
      ? "Connection request — review and respond."
      : rel.stage === "pending_out"
      ? "Connection request sent — awaiting response."
      : rel.stage === "closed_lost" && rel.declineReason
      ? `Declined: ${rel.declineReason}`
      : null);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted/40",
        active && "bg-muted",
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        {rel.counterpartyAvatar && <AvatarImage src={rel.counterpartyAvatar} />}
        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "truncate text-sm",
              rel.unreadCount > 0 || rel.isNewMatch ? "font-semibold text-foreground" : "font-medium text-foreground",
            )}
          >
            {displayName}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(rel.lastActivityAt), { addSuffix: false })}
          </span>
        </div>

        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>

        {preview && (
          <p
            className={cn(
              "mt-1 truncate text-xs",
              rel.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1.5">
          <StageBadge stage={rel.stage} />
          <span
            className={cn(
              "inline-flex h-5 min-w-[28px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
              scoreClass(rel.score),
            )}
          >
            {Math.round(rel.score)}
          </span>
          {rel.unreadCount > 0 && (
            <Badge className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{rel.unreadCount}</Badge>
          )}
          {rel.isNewMatch && !rel.unreadCount && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              New
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Detail tabs ─────────────────────────────────────────

function OverviewTab({ rel }: { rel: Relationship }) {
  const isPendingIn = rel.stage === "pending_in";
  return (
    <div className="space-y-5 p-5">
      {/* Hero card */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {rel.propertyImageUrl ? (
          <img
            src={rel.propertyImageUrl}
            alt={rel.propertyName}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-muted">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-2xl font-bold text-foreground">{currency(rel.askingPrice)}</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {rel.propertyName}
                {rel.propertyCity && ` · ${rel.propertyCity}, ${rel.propertyState}`}
              </p>
            </div>
            <span
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold",
                scoreClass(rel.score),
              )}
            >
              {Math.round(rel.score)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            {rel.capRate != null && <span>{rel.capRate.toFixed(1)}% cap</span>}
            <BootChip status={rel.bootStatus} total={rel.estimatedBoot} />
          </div>
        </div>
      </div>

      {/* Counterparty */}
      {rel.counterpartyName ? (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Counterparty
          </p>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {rel.counterpartyAvatar && <AvatarImage src={rel.counterpartyAvatar} />}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {rel.counterpartyName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{rel.counterpartyName}</p>
              {rel.counterpartyBrokerage && (
                <p className="truncate text-xs text-muted-foreground">{rel.counterpartyBrokerage}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-muted/40 p-4 text-center">
          <p className="text-sm font-medium text-foreground">Counterparty hidden</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Agent details are revealed once a connection is accepted.
          </p>
        </div>
      )}

      {/* Client */}
      {rel.mySide === "buyer" && rel.clientName && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your client
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">{rel.clientName}</p>
        </div>
      )}

      {/* Primary actions */}
      <div className="flex flex-wrap gap-2">
        {(rel.stage === "new" || rel.stage === "incoming") && (
          <Button asChild>
            <Link to={`/agent/matches/${rel.matchId}`}>
              {rel.mySide === "buyer" ? "Review & initiate connection" : "Review match"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )}
        {isPendingIn && rel.connectionId && (
          <Button asChild>
            <Link to={`/agent/connections/${rel.connectionId}`}>
              Respond to request
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )}
        {rel.connectionId && (
          <Button asChild variant="outline">
            <Link to={`/agent/connections/${rel.connectionId}`}>
              Open full connection
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost">
          <Link to={`/agent/matches/${rel.matchId}`}>
            View match details
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ConversationTab({ rel, onBack }: { rel: Relationship; onBack?: () => void }) {
  if (!rel.connectionId || !isConnected(rel.stage)) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">Connect first to message</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {rel.mySide === "buyer"
            ? "Initiate a connection from the Overview tab. Once accepted, you can message this agent here."
            : "Once the connection is accepted, messages with this agent will appear here."}
        </p>
      </div>
    );
  }
  return (
    <ThreadView
      connectionId={rel.connectionId}
      counterpartyName={rel.counterpartyName ?? "Counterparty"}
      subtitle={rel.propertyName}
      onBack={onBack}
      embedded
    />
  );
}

function PropertyTab({ rel }: { rel: Relationship }) {
  return (
    <div className="space-y-4 p-5">
      <div className="overflow-hidden rounded-xl border bg-card">
        {rel.propertyImageUrl ? (
          <img src={rel.propertyImageUrl} alt={rel.propertyName} className="h-64 w-full object-cover" />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-muted">
            <Building2 className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subject property
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">{rel.propertyName}</p>
        {(rel.propertyCity || rel.propertyState) && (
          <p className="text-sm text-muted-foreground">
            {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ")}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Asking price</dt>
            <dd className="mt-0.5 font-medium text-foreground">{currency(rel.askingPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Cap rate</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {rel.capRate != null ? `${rel.capRate.toFixed(1)}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Match score</dt>
            <dd className="mt-0.5 font-medium text-foreground">{Math.round(rel.score)} / 100</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Boot status</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {BOOT_STATUS_LABELS[rel.bootStatus] || rel.bootStatus}
            </dd>
          </div>
        </dl>

        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to={`/agent/matches/${rel.matchId}`}>
            Open full property page
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function TimelineTab({ rel }: { rel: Relationship }) {
  const events: Array<{ label: string; at: string | null; done: boolean }> = [
    { label: "Match created", at: rel.lastActivityAt, done: true },
    {
      label: "Connection requested",
      at: rel.connectionId ? rel.lastActivityAt : null,
      done: !!rel.connectionId,
    },
    { label: "Connection accepted", at: rel.acceptedAt, done: !!rel.acceptedAt },
    { label: "First message", at: rel.lastMessagePreview ? rel.lastActivityAt : null, done: !!rel.lastMessagePreview },
    { label: "Under contract", at: rel.underContractAt, done: !!rel.underContractAt },
    { label: "Inspection complete", at: rel.inspectionCompleteAt, done: !!rel.inspectionCompleteAt },
    { label: "Financing approved", at: rel.financingApprovedAt, done: !!rel.financingApprovedAt },
    { label: "Closed", at: rel.closedAt, done: !!rel.closedAt },
  ];

  return (
    <div className="p-5">
      <ol className="relative space-y-4 border-l border-border pl-6">
        {events.map((e, i) => (
          <li key={i} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                e.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {e.done ? "✓" : i + 1}
            </span>
            <p
              className={cn(
                "text-sm",
                e.done ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              {e.label}
            </p>
            {e.at && e.done && (
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(e.at), { addSuffix: true })}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Main hub page ───────────────────────────────────────

export default function AgentMatchesHub() {
  const { data: rels = [], isLoading } = useUnifiedRelationships();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const stageFilter = searchParams.get("stage") ?? "live";
  const selectedId = searchParams.get("id");
  const activeTab = searchParams.get("tab") ?? "overview";
  const [search, setSearch] = useState("");

  // Translate legacy ?connection=, ?match= deep-links into our format
  useEffect(() => {
    const legacyConn = searchParams.get("connection");
    const legacyMatch = searchParams.get("match");
    if (legacyConn || legacyMatch) {
      const targetId = legacyConn ?? legacyMatch!;
      const next = new URLSearchParams(searchParams);
      next.delete("connection");
      next.delete("match");
      next.set("id", targetId);
      if (legacyConn) next.set("tab", "conversation");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    const def = FILTERS.find((f) => f.value === stageFilter) ?? FILTERS[0];
    const q = search.trim().toLowerCase();
    return rels
      .filter((r) => def.match(r.stage))
      .filter((r) => {
        if (!q) return true;
        return (
          r.propertyName.toLowerCase().includes(q) ||
          (r.counterpartyName ?? "").toLowerCase().includes(q) ||
          (r.clientName ?? "").toLowerCase().includes(q) ||
          (r.propertyCity ?? "").toLowerCase().includes(q)
        );
      });
  }, [rels, stageFilter, search]);

  // Auto-select first on desktop if nothing selected
  useEffect(() => {
    if (!isMobile && !selectedId && filtered.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set("id", filtered[0].id);
      setSearchParams(next, { replace: true });
    }
  }, [isMobile, selectedId, filtered, searchParams, setSearchParams]);

  const selected = rels.find((r) => r.id === selectedId) ?? null;

  // Auto-pick a sensible default tab when selection or its stage changes
  useEffect(() => {
    if (!selected) return;
    const hasTab = searchParams.get("tab");
    if (hasTab) return;
    const defaultTab = isConnected(selected.stage) ? "conversation" : "overview";
    const next = new URLSearchParams(searchParams);
    next.set("tab", defaultTab);
    setSearchParams(next, { replace: true });
  }, [selected, searchParams, setSearchParams]);

  function setStage(value: string) {
    const next = new URLSearchParams(searchParams);
    next.set("stage", value);
    next.delete("id");
    next.delete("tab");
    setSearchParams(next);
  }

  function select(rel: Relationship) {
    const next = new URLSearchParams(searchParams);
    next.set("id", rel.id);
    next.delete("tab");
    setSearchParams(next);
  }

  function setTab(tab: string) {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next, { replace: true });
  }

  function clearSelection() {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    next.delete("tab");
    setSearchParams(next);
  }

  // Stage counts for filter chips
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of FILTERS) c[f.value] = rels.filter((r) => f.match(r.stage)).length;
    return c;
  }, [rels]);

  const showList = !isMobile || !selectedId;
  const showDetail = !isMobile || !!selectedId;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matches</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Matches, connections, and conversations in one pipeline.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/agent/exchanges/new">
            <Plus className="mr-1 h-4 w-4" /> New exchange
          </Link>
        </Button>
      </div>

      {/* Master / detail */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* List */}
        {showList && (
          <aside
            className={cn(
              "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card",
              isMobile ? "w-full" : "w-[360px] shrink-0",
            )}
          >
            {/* Filters + search */}
            <div className="space-y-3 border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search agent, property, client…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStage(f.value)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      stageFilter === f.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {f.label}
                    {counts[f.value] > 0 && (
                      <span className="ml-1 opacity-70">{counts[f.value]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">Nothing here yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stageFilter === "live"
                      ? "When you have active matches, connections, or conversations, they'll appear here."
                      : "Try a different filter or clear your search."}
                  </p>
                </div>
              ) : (
                filtered.map((r) => (
                  <ListRow key={r.id} rel={r} active={r.id === selectedId} onClick={() => select(r)} />
                ))
              )}
            </div>
          </aside>
        )}

        {/* Detail */}
        {showDetail && (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
            {selected ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  {isMobile && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearSelection}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <Avatar className="h-9 w-9">
                    {selected.counterpartyAvatar && <AvatarImage src={selected.counterpartyAvatar} />}
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {(selected.counterpartyName ?? selected.propertyName).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {selected.counterpartyName ?? selected.propertyName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selected.counterpartyName ? selected.propertyName : "Counterparty hidden until connected"}
                    </p>
                  </div>
                  <StageBadge stage={selected.stage} />
                </div>

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setTab}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <TabsList className="mx-4 mt-3 grid w-[calc(100%-2rem)] grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="conversation" disabled={!isConnected(selected.stage)}>
                      Conversation
                      {selected.unreadCount > 0 && (
                        <Badge className="ml-1.5 h-4 min-w-4 justify-center px-1 text-[9px]">
                          {selected.unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="property">Property</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-0 flex-1 overflow-y-auto">
                    <OverviewTab rel={selected} />
                  </TabsContent>
                  <TabsContent value="conversation" className="mt-0 flex min-h-0 flex-1 flex-col">
                    <ConversationTab rel={selected} />
                  </TabsContent>
                  <TabsContent value="property" className="mt-0 flex-1 overflow-y-auto">
                    <PropertyTab rel={selected} />
                  </TabsContent>
                  <TabsContent value="timeline" className="mt-0 flex-1 overflow-y-auto">
                    <TimelineTab rel={selected} />
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <Handshake className="mb-3 h-12 w-12 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">Select a match</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose a relationship from the list to see overview, conversation, property, and timeline.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
