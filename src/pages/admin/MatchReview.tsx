import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function MatchReview() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("match_runs")
      .select("*, exchange_requests(relinquished_city, relinquished_state, user_id)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRuns(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Match Review</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and approve property matches for exchange requests.
      </p>

      {runs.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            No match runs yet. Run matching from a request detail page.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {runs.map((run) => {
            const req = run.exchange_requests;
            return (
              <button
                key={run.id}
                onClick={() => navigate(`/admin/matches/${run.id}`)}
                className="flex w-full items-center justify-between rounded-xl border bg-card p-5 text-left transition-colors hover:bg-muted"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {req?.relinquished_city && req?.relinquished_state
                      ? `${req.relinquished_city}, ${req.relinquished_state}`
                      : "Exchange Request"}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {run.total_properties_scored ?? 0} properties scored •{" "}
                    {new Date(run.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    run.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : run.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {run.status}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
