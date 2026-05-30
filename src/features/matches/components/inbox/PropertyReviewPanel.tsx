import { Link } from "react-router-dom";
import { MapPin, ExternalLink, FileText, Activity, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { currency, scoreDotClass } from "../helpers";
import { WhyThisMatched } from "./WhyThisMatched";
import { MatchBreakdownChart } from "./MatchBreakdownChart";
import {
  deriveUiStatus,
  financialMetrics,
  UI_STATUS_CLASS,
  UI_STATUS_LABEL,
} from "./inboxHelpers";
import { useMatchLocalState } from "./useMatchLocalState";
import { propertyImage } from "./propertyImage";

interface Props {
  rel: Relationship;
}

export function PropertyReviewPanel({ rel }: Props) {
  const { state } = useMatchLocalState(rel.matchId);
  const status = deriveUiStatus(rel, state);
  const metrics = financialMetrics(rel);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      {/* Hero image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-muted">
        <img
          src={propertyImage(rel.propertyImageUrl, rel.id)}
          alt=""
          className="h-full w-full object-cover"
        />
        <span
          className={cn(
            "absolute right-3 top-3 inline-flex items-center rounded-full border bg-card/95 px-2.5 py-1 text-xs font-medium backdrop-blur",
            UI_STATUS_CLASS[status],
          )}
        >
          {UI_STATUS_LABEL[status]}
        </span>
      </div>

      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-foreground">
              {rel.propertyName}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ") || "—"}
              </span>
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={`/agent/matches/${rel.matchId}`}>
              Full details <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="font-semibold text-foreground">{currency(rel.askingPrice)}</span>
          {rel.capRate != null && (
            <span className="text-muted-foreground">{rel.capRate.toFixed(2)}% cap</span>
          )}
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className={cn(
                "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white",
                scoreDotClass(rel.score),
              )}
            >
              {Math.round(rel.score)}
            </span>
            match score
          </span>
          {rel.clientName && (
            <span className="truncate text-muted-foreground">For {rel.clientName}</span>
          )}
        </div>
      </div>

      {/* Tabs (only the content area scrolls) */}
      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 overflow-x-auto border-b border-border px-5 pt-3">
          <TabsList className="w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="breakdown">Match Breakdown</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="overview" className="m-0 space-y-4 p-5">
            <WhyThisMatched rel={rel} />
            <FinancialGrid metrics={metrics.slice(0, 6)} />
          </TabsContent>

          <TabsContent value="financials" className="m-0 p-5">
            <FinancialGrid metrics={metrics} />
          </TabsContent>

          <TabsContent value="breakdown" className="m-0 p-5">
            <MatchBreakdownChart rel={rel} />
          </TabsContent>

          <TabsContent value="documents" className="m-0 p-5">
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-12 text-center">
              <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No documents shared yet</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Documents the other agent shares (OM, T-12, rent roll) will appear here.
              </p>
              <Button disabled size="sm" variant="outline" className="mt-4">
                Request documents
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="m-0 p-5">
            <ActivityTimeline rel={rel} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function FinancialGrid({ metrics }: { metrics: ReturnType<typeof financialMetrics> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div
          key={m.key}
          className="rounded-lg border bg-background p-3"
        >
          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {m.label}
            {m.estimated && <Info className="h-3 w-3" aria-label="Estimated value" />}
          </div>
          <p className="mt-1 text-base font-semibold text-foreground">{m.value}</p>
        </div>
      ))}
    </div>
  );
}

function ActivityTimeline({ rel }: { rel: Relationship }) {
  const events: Array<{ ts: string; label: string }> = [];
  events.push({ ts: rel.lastActivityAt, label: "Most recent activity" });
  if (rel.acceptedAt) events.push({ ts: rel.acceptedAt, label: "Connection accepted" });
  if (rel.underContractAt) events.push({ ts: rel.underContractAt, label: "Under contract" });
  if (rel.closedAt) events.push({ ts: rel.closedAt, label: "Deal closed" });
  events.push({ ts: rel.lastActivityAt, label: "Match created" });

  return (
    <ol className="relative space-y-3 border-l border-border pl-4">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
          <p className="text-sm font-medium text-foreground">{e.label}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(e.ts).toLocaleString()}
          </p>
        </li>
      ))}
      {events.length === 1 && (
        <p className="pt-2 text-xs text-muted-foreground">
          <Activity className="mr-1 inline h-3 w-3" /> More activity will appear as the deal progresses.
        </p>
      )}
    </ol>
  );
}
