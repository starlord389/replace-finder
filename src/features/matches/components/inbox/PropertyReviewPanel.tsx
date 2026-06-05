import { Link } from "react-router-dom";
import { MapPin, ExternalLink, FileText, Activity, Info, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { currency, scoreDotClass } from "../helpers";
import { WhyThisMatched } from "./WhyThisMatched";
import { MatchBreakdownChart } from "./MatchBreakdownChart";
import { AgentCommsCard } from "./AgentCommsCard";
import {
  financialMetrics,
  rankExplanation,
  UI_STATUS_CLASS,
  UI_STATUS_LABEL,
} from "./inboxHelpers";
import { useMatchActions } from "./useMatchActions";
import { propertyImage } from "./propertyImage";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import { ClientLeadLine } from "@/features/matches/components/shared/ClientLeadLine";


interface Props {
  rel: Relationship;
  /** Open the secondary actions/deal-room drawer. */
  onOpenActions?: () => void;
  rank?: number | null;
  totalInScope?: number;
}

const KEY_METRIC_KEYS = ["noi", "cap", "coc", "dscr", "occupancy", "equity", "loan", "cashflow"];

export function PropertyReviewPanel({ rel, onOpenActions, rank, totalInScope }: Props) {
  const allMetrics = financialMetrics(rel);
  const keyMetrics = KEY_METRIC_KEYS
    .map((k) => allMetrics.find((m) => m.key === k))
    .filter(Boolean) as ReturnType<typeof financialMetrics>;

  const { status, primary, handle, busy } = useMatchActions(rel, {
    onOpenConversation: onOpenActions,
    onSendToClient: onOpenActions,
  });

  const accent = getClientAccent(rel.clientId);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      {/* Single scroll area for the entire listing review */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* Client identity strip */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-b border-border border-l-[4px] px-5 py-2.5",
            accent.borderLeft,
            accent.soft,
          )}
        >
          <ClientLeadLine
            clientId={rel.clientId}
            clientName={rel.clientName}
            relinquishedLabel={rel.relinquishedLabel}
            size="md"
            pill
          />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Trading out — finding replacement property
          </span>
          <Button asChild variant="ghost" size="sm" className="ml-auto h-7 px-2 text-xs">
            <Link to={`/agent/exchanges/${rel.buyerExchangeId}`}>
              View exchange <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {/* Hero image */}
        <div className="relative h-56 w-full overflow-hidden bg-muted">
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
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold text-foreground">
                {rel.propertyName}
              </h2>
              <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ") || "—"}
                </span>
              </p>
              {rank != null && totalInScope ? (
                <p className="mt-1 text-[11px] font-medium text-foreground/70">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-bold">#{rank}</span>
                  <span className="ml-1.5">of {totalInScope} matches · Score {Math.round(rel.score)}</span>
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-semibold leading-none text-foreground">
                  {currency(rel.askingPrice)}
                </p>
                {rel.capRate != null && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {rel.capRate.toFixed(2)}% cap
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-bold text-white",
                    scoreDotClass(rel.score),
                  )}
                >
                  {Math.round(rel.score)}
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground">score</span>
              </div>
            </div>
          </div>


          {/* Action row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {primary ? (
              <Button
                size="sm"
                onClick={() => handle(primary.id, primary.label)}
                disabled={busy === primary.id}
              >
                {primary.label}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">No further action required</span>
            )}
            <Button variant="outline" size="sm" onClick={onOpenActions}>
              <Settings2 className="mr-1 h-3.5 w-3.5" />
              All actions
            </Button>
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link to={`/agent/matches/${rel.matchId}`}>
                Full details <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Key metrics strip */}
        <div className="border-b border-border px-5 py-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-8">
            {keyMetrics.map((m) => (
              <div key={m.key} className="rounded-lg border bg-background px-2.5 py-2">
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="truncate">{m.label}</span>
                  {m.estimated && <Info className="h-2.5 w-2.5 shrink-0" aria-label="Estimated" />}
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs (sticky header, content flows in the same scroll area) */}
        <Tabs defaultValue="overview" className="flex flex-col">
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 pt-3 backdrop-blur">
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
              <TabsTrigger value="why">Why This Matched</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="m-0 space-y-4 p-5">
            <WhyThisMatched rel={rel} />
          </TabsContent>

          <TabsContent value="financials" className="m-0 p-5">
            <FinancialGrid metrics={allMetrics} />
          </TabsContent>

          <TabsContent value="why" className="m-0 space-y-4 p-5">
            {rank != null && (
              <div className="rounded-lg border bg-primary/5 p-3 text-sm text-foreground/80">
                {rankExplanation(rel, rank)}
              </div>
            )}
            <WhyThisMatched rel={rel} />
            <MatchBreakdownChart rel={rel} />
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

          <TabsContent value="conversation" className="m-0 p-5">
            <AgentCommsCard rel={rel} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function FinancialGrid({ metrics }: { metrics: ReturnType<typeof financialMetrics> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metrics.map((m) => (
        <div key={m.key} className="rounded-lg border bg-background p-3">
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
