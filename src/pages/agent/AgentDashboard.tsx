import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ArrowLeftRight, Handshake, Link2, Plus, Eye, ShieldCheck, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";

interface DeadlineAlert {
  exchangeId: string;
  clientName: string;
  deadlineType: "identification" | "closing";
  deadline: string;
  daysRemaining: number;
}

export default function AgentDashboard() {
  const { user, profileName, isVerifiedAgent, agentVerificationStatus } = useAuth();
  const [brokerageName, setBrokerageName] = useState<string | null>(null);
  const [clientCount, setClientCount] = useState(0);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [deadlines, setDeadlines] = useState<DeadlineAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, clientsRes, exchangesRes, matchesRes, connectionsRes, deadlinesRes] =
        await Promise.all([
          supabase.from("profiles").select("brokerage_name").eq("id", user.id).single(),
          supabase.from("agent_clients").select("id", { count: "exact", head: true }).eq("agent_id", user.id).eq("status", "active"),
          supabase.from("exchanges").select("id", { count: "exact", head: true }).eq("agent_id", user.id).in("status", ["active", "in_identification", "in_closing"]),
          supabase.from("exchanges").select("id").eq("agent_id", user.id).then(async ({ data: exs }) => {
            if (!exs?.length) return { count: 0 };
            const { count } = await supabase.from("matches").select("id", { count: "exact", head: true }).in("buyer_exchange_id", exs.map((e) => e.id));
            return { count: count ?? 0 };
          }),
          supabase.from("exchange_connections").select("id", { count: "exact", head: true }).or(`buyer_agent_id.eq.${user.id},seller_agent_id.eq.${user.id}`).eq("status", "pending"),
          supabase.from("exchanges").select("id, identification_deadline, closing_deadline, client_id, agent_clients(client_name)").eq("agent_id", user.id).in("status", ["in_identification", "in_closing"]).not("identification_deadline", "is", null),
        ]);

      setBrokerageName(profileRes.data?.brokerage_name ?? null);
      setClientCount(clientsRes.count ?? 0);
      setExchangeCount(exchangesRes.count ?? 0);
      setMatchCount(typeof matchesRes === "object" && "count" in matchesRes ? (matchesRes.count as number) : 0);
      setConnectionCount(connectionsRes.count ?? 0);

      const today = new Date();
      const alerts: DeadlineAlert[] = [];
      if (deadlinesRes.data) {
        for (const ex of deadlinesRes.data) {
          const clientName = (ex as any).agent_clients?.client_name ?? "Unknown Client";
          if (ex.identification_deadline) {
            const days = differenceInDays(parseISO(ex.identification_deadline), today);
            if (days >= 0) alerts.push({ exchangeId: ex.id, clientName, deadlineType: "identification", deadline: ex.identification_deadline, daysRemaining: days });
          }
          if (ex.closing_deadline) {
            const days = differenceInDays(parseISO(ex.closing_deadline), today);
            if (days >= 0) alerts.push({ exchangeId: ex.id, clientName, deadlineType: "closing", deadline: ex.closing_deadline, daysRemaining: days });
          }
        }
      }
      alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
      setDeadlines(alerts);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const kpis = [
    { label: "Active Clients", value: clientCount, icon: Users },
    { label: "Active Exchanges", value: exchangeCount, icon: ArrowLeftRight },
    { label: "Total Matches", value: matchCount, icon: Handshake },
    { label: "Pending Connections", value: connectionCount, icon: Link2 },
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
              <ShieldCheck className="h-3.5 w-3.5" /> Verified Agent
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <Clock className="h-3.5 w-3.5" /> Pending Verification
            </span>
          )}
        </div>
      </div>

      {/* Verification banner */}
      {agentVerificationStatus === "pending" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Your account is pending verification. You can start adding clients and setting up exchanges while we verify your credentials.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
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
        ))}
      </div>

      {/* Deadline alerts */}
      {deadlines.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Upcoming Deadlines</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {deadlines.slice(0, 6).map((d, i) => (
              <Card key={i} className={`border ${deadlineColor(d.daysRemaining)}`}>
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
