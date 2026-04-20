import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Compass,
  Eye,
  Handshake,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAgentAttentionQuery } from "@/features/agent/hooks/useAgentAttentionQuery";
import { useAgentPipelineQuery } from "@/features/agent/hooks/useAgentPipelineQuery";
import { useAgentLaunchpadProgress } from "@/features/agent/hooks/useAgentLaunchpadProgress";
import { getAgentVerificationUiState } from "@/lib/agentVerification";
import SeedMockDataPanel from "@/features/dev/SeedMockDataPanel";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatProceeds(total: number, hasAnyValue: boolean): string {
  if (!hasAnyValue) return "—";
  if (total === 0) return "$0";
  return currencyFormatter.format(total);
}

function deadlineBadgeClass(days: number) {
  if (days <= 3) return "bg-red-50 text-red-700 border-red-200";
  if (days <= 7) return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-yellow-50 text-yellow-800 border-yellow-200";
}

export default function AgentDashboard() {
  const {
    user,
    profileName,
    isVerifiedAgent,
    agentVerificationStatus,
    isSuspendedAgent,
  } = useAuth();
  const { data: attention, isLoading: attentionLoading } =
    useAgentAttentionQuery(user?.id);
  const { data: pipeline, isLoading: pipelineLoading } =
    useAgentPipelineQuery(user?.id);
  const { data: launchpadProgress, isLoading: launchpadLoading } =
    useAgentLaunchpadProgress(user?.id);
  const verificationUi = getAgentVerificationUiState(agentVerificationStatus);

  if (attentionLoading || pipelineLoading || launchpadLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const launchpadIncomplete =
    !isSuspendedAgent && !launchpadProgress?.profile.launchpad_completed_at;
  const brokerageName = pipeline?.brokerageName ?? null;
  const hasAnyExchange =
    (pipeline?.active.count ?? 0) +
      (pipeline?.inIdentification.count ?? 0) +
      (pipeline?.inClosing.count ?? 0) +
      (pipeline?.closedLast30.count ?? 0) >
    0;

  const stageCards: Array<{
    key: string;
    label: string;
    bucket: typeof pipeline.active;
    icon: typeof TrendingUp;
    accent: string;
  }> = pipeline
    ? [
        {
          key: "active",
          label: "Active",
          bucket: pipeline.active,
          icon: Sparkles,
          accent: "text-foreground",
        },
        {
          key: "inIdentification",
          label: "In Identification",
          bucket: pipeline.inIdentification,
          icon: ClipboardList,
          accent: "text-amber-700",
        },
        {
          key: "inClosing",
          label: "In Closing",
          bucket: pipeline.inClosing,
          icon: Clock3,
          accent: "text-blue-700",
        },
        {
          key: "closedLast30",
          label: "Closed · last 30d",
          bucket: pipeline.closedLast30,
          icon: TrendingUp,
          accent: "text-green-700",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{profileName ? `, ${profileName}` : ""}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {brokerageName && <span>{brokerageName}</span>}
            {brokerageName && <span>·</span>}
            {isVerifiedAgent ? (
              <span className="inline-flex items-center gap-1 text-green-600">
                <ShieldCheck className="h-3.5 w-3.5" /> {verificationUi.badgeLabel}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" /> Suspended
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/agent/clients/new">
              <Plus className="mr-1.5 h-4 w-4" /> Add Client
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/agent/exchanges/new">
              <ArrowLeftRight className="mr-1.5 h-4 w-4" /> New Exchange
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/agent/matches">
              <Eye className="mr-1.5 h-4 w-4" /> View Matches
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
                You have a few launchpad steps left. Complete them to unlock
                the full match pipeline.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="border-amber-300 bg-white hover:bg-amber-100">
            <Link to="/agent/launchpad">
              Open launchpad
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}

      {/* Needs your attention */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Needs your attention
          </CardTitle>
          <CardDescription>
            Everything open on your desk right now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attention?.isEmpty ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-6 text-sm text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">You&apos;re all caught up.</p>
                <p className="text-green-700">
                  No urgent deadlines, unreviewed matches, or pending
                  connection requests. Nice.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Urgent deadlines */}
              {attention && attention.urgentDeadlines.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Clock3 className="h-4 w-4 text-red-500" />
                      Urgent deadlines ({attention.urgentDeadlines.length})
                    </h3>
                    <Link
                      to="/agent/exchanges"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      View all exchanges →
                    </Link>
                  </div>
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
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${deadlineBadgeClass(d.daysRemaining)}`}
                          >
                            {d.daysRemaining === 0
                              ? "today"
                              : `${d.daysRemaining}d left`}
                          </span>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/agent/exchanges/${d.exchangeId}`}>
                              Open
                              <ArrowRight className="ml-1 h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unreviewed matches */}
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
                  <ul className="divide-y rounded-lg border">
                    {attention.unreviewedMatches.map((m) => (
                      <li
                        key={m.matchId}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {m.clientName} · {m.propertyName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Score {Math.round(m.totalScore)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/agent/matches/${m.matchId}`}>
                            Review
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pending connection requests */}
              {attention && attention.pendingConnections.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Users className="h-4 w-4 text-blue-600" />
                      Connection requests awaiting you ({attention.pendingConnections.length})
                    </h3>
                    <Link
                      to="/agent/connections"
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      View all connections →
                    </Link>
                  </div>
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
                            Respond
                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
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

      {/* Pipeline */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">Pipeline</h2>
          <Link
            to="/agent/exchanges"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all exchanges →
          </Link>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {stageCards.map((stage) => (
            <Card key={stage.key}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <stage.icon className={`h-4 w-4 ${stage.accent}`} />
                  {stage.label}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {stage.bucket.count}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stage.bucket.count === 1 ? "exchange" : "exchanges"}
                  </span>
                </div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">
                  {formatProceeds(stage.bucket.totalProceeds, stage.bucket.hasAnyValue)}
                  <span className="ml-1 text-xs">
                    {stage.bucket.hasAnyValue ? "proceeds" : "no value set"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty onboarding CTA */}
      {!hasAnyExchange && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">
              Start your first 1031 exchange
            </CardTitle>
            <CardDescription>
              Add a client, pledge their property to the network, and the
              dashboard will start filling up with matches and deadlines you
              can act on.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/agent/clients/new">
                Add your first client
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/agent/exchanges/new">
                New exchange
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <SeedMockDataPanel />
    </div>
  );
}
