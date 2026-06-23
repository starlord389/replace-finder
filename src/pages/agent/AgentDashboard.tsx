import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Compass,
  Handshake,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAgentAttentionQuery } from "@/features/agent/hooks/useAgentAttentionQuery";
import type { AgentAttentionData } from "@/features/agent/hooks/useAgentAttentionQuery";
import { useAgentExchangesQuery } from "@/features/agent/hooks/useAgentExchangesQuery";
import { useAgentClientsCount } from "@/features/agent/hooks/useAgentClientsCount";
import { useAgentLaunchpadProgress } from "@/features/agent/hooks/useAgentLaunchpadProgress";
import { useUnifiedRelationships } from "@/features/matches/hooks/useUnifiedRelationships";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { getAgentVerificationUiState } from "@/lib/agentVerification";

import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { cn } from "@/lib/utils";

const OPEN_MATCH_STAGES = new Set([
  "new",
  "incoming",
  "pending_in",
  "pending_out",
  "connected",
  "conversing",
]);

function fmtPrice(v: number | null | undefined) {
  if (!v) return null;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  try {
    return differenceInDays(parseISO(iso), new Date());
  } catch {
    return null;
  }
}

function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
        {sublabel && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</div>
        )}
      </CardContent>
    </Card>
  );
}

interface TodayItem {
  key: string;
  tone: "red" | "amber" | "blue";
  title: string;
  subtitle: string;
  href: string;
  cta: string;
}

function buildTodayItems(attention: AgentAttentionData | undefined): TodayItem[] {
  if (!attention) return [];
  const items: TodayItem[] = [];

  const d = attention.urgentDeadlines[0];
  if (d) {
    items.push({
      key: `deadline-${d.exchangeId}-${d.deadlineType}`,
      tone: "red",
      title: `${d.clientName} · ${d.deadlineType} deadline`,
      subtitle:
        d.daysRemaining <= 0
          ? "Due today"
          : `${d.daysRemaining} day${d.daysRemaining === 1 ? "" : "s"} left`,
      href: `/agent/workspace/${d.exchangeId}`,
      cta: "Open",
    });
  }

  const topMatch = [...attention.unreviewedMatches].sort(
    (a, b) => b.totalScore - a.totalScore,
  )[0];
  if (topMatch) {
    items.push({
      key: `match-${topMatch.matchId}`,
      tone: "amber",
      title: `${topMatch.clientName} · new match`,
      subtitle: `${topMatch.propertyName} · score ${Math.round(topMatch.totalScore)}`,
      href: `/agent/workspace/${topMatch.buyerExchangeId}?match=${topMatch.matchId}`,
      cta: "Review",
    });
  }

  const conn = [...attention.pendingConnections].sort((a, b) =>
    (a.initiatedAt ?? "").localeCompare(b.initiatedAt ?? ""),
  )[0];
  if (conn) {
    items.push({
      key: `conn-${conn.connectionId}`,
      tone: "blue",
      title: `Connection request from ${conn.otherAgentName}`,
      subtitle: conn.propertyName ?? "Exchange connection",
      href: `/agent/connections/${conn.connectionId}`,
      cta: "Respond",
    });
  }

  return items;
}

function TodayPanel({ attention }: { attention: AgentAttentionData | undefined }) {
  const items = buildTodayItems(attention);
  const toneClasses = {
    red: { dot: "bg-red-500", ring: "ring-red-100" },
    amber: { dot: "bg-amber-500", ring: "ring-amber-100" },
    blue: { dot: "bg-blue-500", ring: "ring-blue-100" },
  } as const;

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          What to do first
        </CardTitle>
        <CardDescription>
          The three highest-priority actions on your desk right now.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="font-medium">You&apos;re ahead of everything today.</p>
          </div>
        ) : (
          <ol className="divide-y overflow-hidden rounded-lg border">
            {items.map((it, idx) => {
              const tone = toneClasses[it.tone];
              return (
                <li
                  key={it.key}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-muted-foreground ring-1 ring-border">
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full ring-4",
                      tone.dot,
                      tone.ring,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {it.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {it.subtitle}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={it.href}>
                      {it.cta}
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineFunnel({ relationships }: { relationships: Relationship[] }) {
  const counts = {
    new: 0,
    conversing: 0,
    loi: 0,
    uc: 0,
    closed: 0,
  };
  for (const r of relationships) {
    switch (r.stage) {
      case "new":
      case "incoming":
        counts.new += 1;
        break;
      case "pending_in":
      case "pending_out":
      case "connected":
      case "conversing":
        counts.conversing += 1;
        break;
      case "closed_won":
        counts.closed += 1;
        break;
      default:
        break;
    }
  }
  const stages: Array<{ key: keyof typeof counts; label: string }> = [
    { key: "new", label: "New" },
    { key: "conversing", label: "Conv." },
    { key: "loi", label: "LOI" },
    { key: "uc", label: "UC" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Pipeline</CardTitle>
          <Link
            to="/agent/pipeline"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            View →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Link
          to="/agent/pipeline"
          className="grid grid-cols-5 gap-1 rounded-lg border bg-card p-1 transition-colors hover:bg-muted/40"
        >
          {stages.map((s) => (
            <div key={s.key} className="flex flex-col items-center px-1 py-2">
              <span className="text-lg font-semibold text-foreground">
                {counts[s.key]}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </Link>
      </CardContent>
    </Card>
  );
}

function DeadlineRail({
  exchanges,
}: {
  exchanges: ReturnType<typeof useAgentExchangesQuery>["data"];
}) {
  type Row = {
    key: string;
    exchangeId: string;
    clientName: string;
    type: "identification" | "closing";
    days: number;
  };
  const rows: Row[] = [];
  for (const e of exchanges ?? []) {
    const dId = daysUntil(e.identification_deadline);
    const dCl = daysUntil(e.closing_deadline);
    const clientName = e.agent_clients?.client_name ?? "Client";
    if (dId !== null && dId >= 0 && dId <= 30) {
      rows.push({
        key: `${e.id}-id`,
        exchangeId: e.id,
        clientName,
        type: "identification",
        days: dId,
      });
    }
    if (dCl !== null && dCl >= 0 && dCl <= 30) {
      rows.push({
        key: `${e.id}-cl`,
        exchangeId: e.id,
        clientName,
        type: "closing",
        days: dCl,
      });
    }
  }
  rows.sort((a, b) => a.days - b.days);
  const top = rows.slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          Deadlines · 30d
        </CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No deadlines within the next 30 days.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {top.map((r) => (
              <li
                key={r.key}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {r.clientName}
                  </p>
                  <p className="truncate text-[11px] capitalize text-muted-foreground">
                    {r.type}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      r.days <= 7
                        ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200"
                        : r.days <= 14
                          ? "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {r.days === 0 ? "today" : `${r.days}d`}
                  </span>
                  <Link
                    to={`/agent/workspace/${r.exchangeId}`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function AgentDashboard() {
  const {
    user,
    profileName,
    isVerifiedAgent,
    agentVerificationStatus,
    isSuspendedAgent,
  } = useAuth();
  const { data: attention, isLoading: attentionLoading } = useAgentAttentionQuery(user?.id);
  const { data: exchanges = [], isLoading: exchangesLoading } = useAgentExchangesQuery(user?.id);
  const { data: clientCount = 0, isLoading: clientsLoading } = useAgentClientsCount(user?.id);
  const { data: relationships = [], isLoading: relsLoading } = useUnifiedRelationships();
  const { data: launchpadProgress, isLoading: launchpadLoading } = useAgentLaunchpadProgress(user?.id);

  const verificationUi = getAgentVerificationUiState(agentVerificationStatus);
  const launchpadIncomplete =
    !isSuspendedAgent && !launchpadProgress?.profile.launchpad_completed_at;

  const isLoading =
    attentionLoading || exchangesLoading || clientsLoading || relsLoading || launchpadLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // KPI derivations
  const activeListings = exchanges.filter((e) => e.status === "active").length;
  const draftListings = exchanges.length - activeListings;
  const clientsWithActiveListing = new Set(
    exchanges.filter((e) => e.status === "active" && e.client_id).map((e) => e.client_id),
  ).size;
  const openMatchCount = relationships.filter((r) => OPEN_MATCH_STAGES.has(r.stage)).length;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = relationships.filter((r) => {
    if (r.stage !== "new" && r.stage !== "incoming") return false;
    const t = r.lastActivityAt ? parseISO(r.lastActivityAt).getTime() : NaN;
    return Number.isFinite(t) && t >= oneWeekAgo;
  }).length;

  let idCount = 0;
  let clCount = 0;
  for (const e of exchanges) {
    const dId = daysUntil(e.identification_deadline);
    const dCl = daysUntil(e.closing_deadline);
    if (dId !== null && dId >= 0 && dId <= 30) idCount += 1;
    if (dCl !== null && dCl >= 0 && dCl <= 30) clCount += 1;
  }
  const upcomingDeadlines = idCount + clCount;

  // Top matches across all clients
  const topMatches = [...relationships]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
    })
    .slice(0, 6);

  // Listings summary (top 6 newest)
  const topListings = exchanges.slice(0, 6);
  const hasAnyExchange = exchanges.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{profileName ? `, ${profileName}` : ""}
          </h1>
          {!isVerifiedAgent && (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" /> Suspended
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/agent/clients/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add Client
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/agent/exchanges/new">
              <Building2 className="mr-1.5 h-4 w-4" /> New Listing
            </Link>
          </Button>
        </div>
      </div>

      {isSuspendedAgent ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {verificationUi.description}
        </div>
      ) : null}

      {launchpadIncomplete ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium">Finish setting up your workspace</p>
              <p className="text-amber-800">
                You have a few launchpad steps left. Complete them to unlock the full match pipeline.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-amber-300 bg-white hover:bg-amber-100"
          >
            <Link to="/agent/launchpad">
              Open launchpad <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      {/* Two-column cockpit */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="space-y-6 min-w-0">
          <TodayPanel attention={attention} />

          {/* Needs your attention */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Needs your attention
              </CardTitle>
              <CardDescription>Everything open on your desk right now.</CardDescription>
            </CardHeader>
            <CardContent>
              {attention?.isEmpty ? (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-sm text-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">You&apos;re all caught up.</p>
                    <p className="text-green-700">
                      No urgent deadlines, unreviewed matches, or pending connection requests. Nice.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {attention && attention.urgentDeadlines.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Clock3 className="h-4 w-4 text-red-500" />
                        Urgent deadlines ({attention.urgentDeadlines.length})
                      </h3>
                      <ul className="divide-y rounded-lg border">
                        {attention.urgentDeadlines.map((d) => (
                          <li
                            key={`${d.exchangeId}-${d.deadlineType}`}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {d.clientName}
                              </p>
                              <p className="text-xs capitalize text-muted-foreground">
                                {d.deadlineType} deadline
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                              <span className="rounded-full border bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border-amber-200">
                                {d.daysRemaining === 0 ? "today" : `${d.daysRemaining}d left`}
                              </span>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/agent/workspace/${d.exchangeId}`}>
                                  Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {attention && attention.unreviewedMatches.length > 0 && (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Handshake className="h-4 w-4 text-primary" />
                          New matches to review ({attention.unreviewedMatches.length})
                        </h3>
                        <Link
                          to="/agent/matches"
                          className="text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          View all matches →
                        </Link>
                      </div>
                      <ul className="divide-y overflow-hidden rounded-lg border">
                        {attention.unreviewedMatches.map((m) => {
                          const accent = getClientAccent(m.clientId ?? m.clientName);
                          const target = `/agent/workspace/${m.buyerExchangeId}?match=${m.matchId}`;
                          return (
                            <li
                              key={m.matchId}
                              className={`flex items-center justify-between gap-3 border-l-[3px] ${accent.borderLeft} px-4 py-3`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {m.clientName}
                                  </p>
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                  {m.propertyName} · Score {Math.round(m.totalScore)}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={target}>
                                  Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {attention && attention.pendingConnections.length > 0 && (
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Users className="h-4 w-4 text-blue-600" />
                        Connection requests awaiting you ({attention.pendingConnections.length})
                      </h3>
                      <ul className="divide-y rounded-lg border">
                        {attention.pendingConnections.map((c) => (
                          <li
                            key={c.connectionId}
                            className="flex items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                From {c.otherAgentName}
                                {c.otherAgentBrokerage ? ` · ${c.otherAgentBrokerage}` : ""}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {c.propertyName ?? "Exchange connection"}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/agent/connections/${c.connectionId}`}>
                                Respond <ArrowRight className="ml-1 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top matches across all clients */}
          {topMatches.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Top matches</CardTitle>
                    <CardDescription>Highest-scoring opportunities across every client.</CardDescription>
                  </div>
                  <Link
                    to="/agent/matches"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    View all →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y overflow-hidden rounded-lg border">
                  {topMatches.map((r) => {
                    const accent = getClientAccent(r.clientId ?? r.clientName);
                    const target = `/agent/workspace/${r.buyerExchangeId}?match=${r.matchId}`;
                    const location = [r.propertyCity, r.propertyState].filter(Boolean).join(", ");
                    return (
                      <li
                        key={r.id}
                        className={`flex items-center justify-between gap-3 border-l-[3px] ${accent.borderLeft} px-4 py-3`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
                            <p className="truncate text-sm font-semibold text-foreground">
                              {r.clientName ?? "Client"}
                            </p>
                            {r.relinquishedLabel && (
                              <span className="truncate text-xs text-muted-foreground">
                                · {r.relinquishedLabel}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.propertyName}
                            {location ? ` · ${location}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {Math.round(r.score)}
                          </span>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={target}>
                              Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Listings summary */}
          {topListings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Listings</CardTitle>
                    <CardDescription>
                      {exchanges.length} {exchanges.length === 1 ? "listing" : "listings"} across your clients.
                    </CardDescription>
                  </div>
                  <Link
                    to="/agent/listings"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    View all →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="divide-y overflow-hidden rounded-lg border">
                  {topListings.map((e) => {
                    const accent = getClientAccent(e.client_id ?? e.agent_clients?.client_name ?? e.id);
                    const city = e.pledged_properties?.city ?? null;
                    const state = e.pledged_properties?.state ?? null;
                    const location = [city, state].filter(Boolean).join(", ");
                    const price = fmtPrice(e.exchange_proceeds);
                    const target = `/agent/workspace/${e.id}`;
                    return (
                      <li
                        key={e.id}
                        className={`flex items-center justify-between gap-3 border-l-[3px] ${accent.borderLeft} px-4 py-3`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} />
                            <p className="truncate text-sm font-semibold text-foreground">
                              {e.agent_clients?.client_name ?? "Client"}
                            </p>
                            {location && (
                              <span className="truncate text-xs text-muted-foreground">
                                · {location}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {e.pledged_properties?.address ?? "Address pending"}
                            {price ? ` · ${price}` : ""}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={target}>
                            Open <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Empty onboarding */}
          {!hasAnyExchange && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Start your first 1031 exchange</CardTitle>
                <CardDescription>
                  Add a client, pledge their property to the network, and the dashboard will start
                  filling up with matches and deadlines you can act on.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link to="/agent/clients/new">
                    Add your first client <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/agent/exchanges/new">New listing</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right rail */}
        <aside className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Active clients"
              value={clientCount}
              sublabel={`${clientsWithActiveListing} with active listing`}
              icon={Users}
            />
            <KpiCard
              label="Listings"
              value={activeListings}
              sublabel={
                draftListings > 0
                  ? `${draftListings} draft${draftListings === 1 ? "" : "s"}`
                  : "All active"
              }
              icon={Building2}
            />
            <KpiCard
              label="Open matches"
              value={openMatchCount}
              sublabel={
                newThisWeek > 0
                  ? `${newThisWeek} new this week`
                  : "No new this week"
              }
              icon={Handshake}
            />
            <KpiCard
              label="Deadlines · 30d"
              value={upcomingDeadlines}
              sublabel={`${idCount} ID · ${clCount} closing`}
              icon={CalendarClock}
            />
          </div>

          <PipelineFunnel relationships={relationships} />
          <DeadlineRail exchanges={exchanges} />
        </aside>
      </div>

      <SeedMockDataPanel />
    </div>
  );
}
