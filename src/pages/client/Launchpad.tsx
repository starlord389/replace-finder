import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftRight, Handshake, Settings, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Launchpad() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ exchanges: 0, pendingMatches: 0, nextDeadline: null as string | null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [reqRes, matchRes] = await Promise.all([
        supabase.from("exchange_requests").select("id, identification_deadline, status").eq("user_id", user.id),
        supabase
          .from("matched_property_access")
          .select("id, match_result_id")
          .eq("user_id", user.id),
      ]);

      const reqs = reqRes.data ?? [];
      const activeExchanges = reqs.filter((r) => r.status !== "closed").length;

      // Find nearest deadline
      const deadlines = reqs
        .map((r) => r.identification_deadline)
        .filter(Boolean)
        .map((d) => new Date(d!))
        .filter((d) => d > new Date())
        .sort((a, b) => a.getTime() - b.getTime());

      // Get pending matches count
      const matchData = matchRes.data ?? [];
      let pendingCount = 0;
      if (matchData.length > 0) {
        const mrIds = matchData.map((m) => m.match_result_id).filter(Boolean);
        if (mrIds.length > 0) {
          const { data: mrData } = await supabase
            .from("match_results")
            .select("id, client_response")
            .in("id", mrIds);
          pendingCount = (mrData ?? []).filter((r) => !r.client_response).length;
        }
      }

      setStats({
        exchanges: activeExchanges,
        pendingMatches: pendingCount,
        nextDeadline: deadlines[0]?.toLocaleDateString() ?? null,
      });
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here's a quick overview and actions to get started.
      </p>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.exchanges}</p>
              <p className="text-xs text-muted-foreground">Active Exchanges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingMatches}</p>
              <p className="text-xs text-muted-foreground">Pending Matches</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{stats.nextDeadline ?? "None"}</p>
              <p className="text-xs text-muted-foreground">Next Deadline</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="mt-8 text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <Link to="/dashboard/exchanges/new">
          <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <Plus className="h-8 w-8 text-primary" />
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Start New Exchange</p>
              <p className="text-xs text-muted-foreground">Submit a 1031 exchange request</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/matches">
          <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <Handshake className="h-8 w-8 text-primary" />
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Review Matches</p>
              <p className="text-xs text-muted-foreground">View matched properties</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/settings">
          <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <Settings className="h-8 w-8 text-primary" />
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Edit Profile</p>
              <p className="text-xs text-muted-foreground">Update your settings</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
