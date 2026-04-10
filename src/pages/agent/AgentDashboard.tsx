import { Link } from "react-router-dom";
import { Users, ArrowLeftRight, Handshake, Link2, Plus, Eye, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAgentDashboardQuery } from "@/features/agent/hooks/useAgentDashboardQuery";
import type { DeadlineAlert } from "@/features/agent/hooks/useAgentDashboardQuery";
import { getAgentVerificationUiState } from "@/lib/agentVerification";

export default function AgentDashboard() {
  const { user, profileName, isVerifiedAgent, agentVerificationStatus, isSuspendedAgent } = useAuth();
  const { data, isLoading } = useAgentDashboardQuery(user?.id);
  const verificationUi = getAgentVerificationUiState(agentVerificationStatus);

  const brokerageName = data?.brokerageName ?? null;
  const clientCount = data?.clientCount ?? 0;
  const exchangeCount = data?.exchangeCount ?? 0;
  const matchCount = data?.matchCount ?? 0;
  const connectionCount = data?.connectionCount ?? 0;
  const deadlines = data?.deadlines ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const kpis = [
    { label: "Active Clients", value: clientCount, icon: Users, link: "/agent/clients" },
    { label: "Active Exchanges", value: exchangeCount, icon: ArrowLeftRight, link: "/agent/exchanges" },
    { label: "Total Matches", value: matchCount, icon: Handshake, link: "/agent/matches" },
    { label: "Pending Connections", value: connectionCount, icon: Link2, link: "/agent/connections" },
  ];

  const deadlineColor = (days: number) => {
    if (days < 7) return "text-red-600 bg-red-50 border-red-200";
    if (days <= 21) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {isSuspendedAgent ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {verificationUi.description}
        </div>
      ) : (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {verificationUi.description}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Deadline alerts */}
      {deadlines.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Upcoming Deadlines</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {deadlines.slice(0, 6).map((d: DeadlineAlert) => (
              <Card key={`${d.exchangeId}-${d.deadlineType}`} className={`border ${deadlineColor(d.daysRemaining)}`}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{d.clientName}</p>
                    <p className="text-xs capitalize">{d.deadlineType} deadline</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-bold">{d.daysRemaining}d</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {deadlines.length === 0 && clientCount > 0 && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          No upcoming deadlines. Create exchanges for your clients to start tracking 1031 timelines.
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/agent/clients/new"><Plus className="mr-2 h-4 w-4" /> Add Client</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/agent/exchanges/new"><ArrowLeftRight className="mr-2 h-4 w-4" /> New Exchange</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/agent/matches"><Eye className="mr-2 h-4 w-4" /> View Matches</Link>
        </Button>
      </div>

      {/* Getting started */}
      {clientCount === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Get started by adding your first client</CardTitle>
            <CardDescription>
              Add the clients you're representing in 1031 exchanges. Once you have a client, you can pledge their property to the network and start receiving matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/agent/clients/new">
                Add Your First Client <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
