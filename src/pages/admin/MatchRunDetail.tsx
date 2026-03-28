import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Check, X, MessageSquare } from "lucide-react";
import {
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
  MATCH_RESULT_STATUS_LABELS,
  MATCH_RESULT_STATUS_COLORS,
  SCORE_DIMENSIONS,
} from "@/lib/constants";

type FilterTab = "all" | "interested" | "passed" | "awaiting";

export default function MatchRunDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [run, setRun] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    const [runRes, resultsRes] = await Promise.all([
      supabase.from("match_runs").select("*").eq("id", id!).single(),
      supabase
        .from("match_results")
        .select("*, inventory_properties(*)")
        .eq("match_run_id", id!)
        .order("total_score", { ascending: false }),
    ]);

    setRun(runRes.data);
    setResults(resultsRes.data ?? []);

    if (runRes.data?.request_id) {
      const { data: req } = await supabase.from("exchange_requests").select("*").eq("id", runRes.data.request_id).single();
      setRequest(req);
    }
    setLoading(false);
  };

  const updateResultStatus = async (resultId: string, status: "approved" | "rejected", result: any) => {
    const updates: any = { status, approved_by: user?.id, approved_at: new Date().toISOString() };
    const { error } = await supabase.from("match_results").update(updates).eq("id", resultId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    if (status === "approved" && request) {
      await supabase.from("matched_property_access").upsert(
        { request_id: result.request_id, property_id: result.property_id, match_result_id: resultId, user_id: request.user_id, granted_by: user?.id },
        { onConflict: "request_id,property_id" }
      );
    }
    if (status === "rejected") {
      await supabase.from("matched_property_access").delete().eq("request_id", result.request_id).eq("property_id", result.property_id);
    }
    toast({ title: `Match ${status}` });
    setResults((prev) => prev.map((r) => (r.id === resultId ? { ...r, ...updates } : r)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!run) {
    return <p className="py-20 text-center text-muted-foreground">Match run not found.</p>;
  }

  // Counts
  const interested = results.filter((r) => r.client_response === "interested").length;
  const passed = results.filter((r) => r.client_response === "passed").length;
  const awaiting = results.filter((r) => r.status === "approved" && !r.client_response).length;
  const notApproved = results.filter((r) => r.status === "pending" || r.status === "rejected").length;

  // Filter
  const filtered = results.filter((r) => {
    if (filter === "interested") return r.client_response === "interested";
    if (filter === "passed") return r.client_response === "passed";
    if (filter === "awaiting") return r.status === "approved" && !r.client_response;
    return true;
  });

  return (
    <div>
      <button
        onClick={() => navigate(request ? `/admin/requests/${request.id}` : "/admin/matches")}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Match Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {run.total_properties_scored} properties scored • {new Date(run.created_at).toLocaleString()}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${run.status === "completed" ? "bg-green-100 text-green-800" : run.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
          {run.status}
        </span>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Total" value={results.length} color="text-foreground" />
        <StatCard label="Interested" value={interested} color="text-green-700" bg="bg-green-50" />
        <StatCard label="Passed" value={passed} color="text-red-700" bg="bg-red-50" />
        <StatCard label="Awaiting Response" value={awaiting} color="text-amber-700" bg="bg-amber-50" />
        <StatCard label="Not Approved" value={notApproved} color="text-muted-foreground" bg="bg-muted" />
      </div>

      {/* Filter tabs */}
      <div className="mt-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">All ({results.length})</TabsTrigger>
            <TabsTrigger value="interested">Interested ({interested})</TabsTrigger>
            <TabsTrigger value="passed">Passed ({passed})</TabsTrigger>
            <TabsTrigger value="awaiting">Awaiting ({awaiting})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Results list */}
      <div className="mt-4 space-y-4">
        {filtered.map((r) => {
          const prop = r.inventory_properties;
          return (
            <div key={r.id} className="rounded-xl border bg-card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">
                      {prop?.name || prop?.address || "Unnamed Property"}
                    </h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MATCH_RESULT_STATUS_COLORS[r.status] || ""}`}>
                      {MATCH_RESULT_STATUS_LABELS[r.status]}
                    </span>
                    <ClientResponseBadge result={r} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[prop?.city, prop?.state].filter(Boolean).join(", ")}
                    {prop?.asset_type && ` • ${ASSET_TYPE_LABELS[prop.asset_type as keyof typeof ASSET_TYPE_LABELS] || prop.asset_type}`}
                    {prop?.strategy_type && ` • ${STRATEGY_TYPE_LABELS[prop.strategy_type as keyof typeof STRATEGY_TYPE_LABELS] || prop.strategy_type}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">{Math.round(r.total_score)}</p>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {SCORE_DIMENSIONS.map(({ key, label, weight }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{label} ({weight})</span>
                      <span className="font-medium text-foreground">{Math.round(r[key])}</span>
                    </div>
                    <Progress value={r[key]} className="h-1.5" />
                  </div>
                ))}
              </div>

              {/* Actions */}
              {r.status === "pending" && (
                <div className="mt-4 flex gap-2 border-t pt-4">
                  <Button size="sm" onClick={() => updateResultStatus(r.id, "approved", r)}>
                    <Check className="mr-1.5 h-3.5 w-3.5" /> Approve Match
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateResultStatus(r.id, "rejected", r)}>
                    <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              {filter === "all" ? "No results in this match run." : "No results match this filter."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg?: string }) {
  return (
    <div className={`rounded-lg border p-3 ${bg || "bg-card"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ClientResponseBadge({ result }: { result: any }) {
  if (result.client_response === "interested") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Interested</Badge>
              {result.client_response_note && <MessageSquare className="h-3.5 w-3.5 text-green-600" />}
            </div>
          </TooltipTrigger>
          {result.client_response_note && (
            <TooltipContent><p className="max-w-xs">{result.client_response_note}</p></TooltipContent>
          )}
        </Tooltip>
        {result.client_response_at && (
          <span className="text-[10px] text-muted-foreground ml-1">
            {new Date(result.client_response_at).toLocaleDateString()}
          </span>
        )}
      </TooltipProvider>
    );
  }

  if (result.client_response === "passed") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Passed</Badge>
              {result.client_response_note && <MessageSquare className="h-3.5 w-3.5 text-red-600" />}
            </div>
          </TooltipTrigger>
          {result.client_response_note && (
            <TooltipContent><p className="max-w-xs">{result.client_response_note}</p></TooltipContent>
          )}
        </Tooltip>
        {result.client_response_at && (
          <span className="text-[10px] text-muted-foreground ml-1">
            {new Date(result.client_response_at).toLocaleDateString()}
          </span>
        )}
      </TooltipProvider>
    );
  }

  if (result.status === "approved" && !result.client_response) {
    return <span className="text-xs text-muted-foreground">No Response</span>;
  }

  return null;
}
