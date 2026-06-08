import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { scoreDotClass } from "../../helpers";
import { rankExplanation } from "../inboxHelpers";
import { WhyThisMatched } from "../WhyThisMatched";
import { MatchBreakdownChart } from "../MatchBreakdownChart";

interface Props {
  rel: Relationship;
  rank?: number | null;
  totalInScope?: number;
}

export function MatchTab({ rel, rank, totalInScope }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-card p-8 text-center">
        <span
          className={cn(
            "flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg",
            scoreDotClass(rel.score),
          )}
        >
          {Math.round(rel.score)}
        </span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">Match Score</h2>
        {rank != null && totalInScope ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked <span className="font-semibold text-foreground">#{rank}</span> of {totalInScope} matches for {rel.clientName ?? "your client"}
          </p>
        ) : null}
        {rank != null && (
          <p className="mx-auto mt-3 max-w-xl rounded-lg bg-card px-4 py-2 text-sm text-foreground/80">
            {rankExplanation(rel, rank)}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WhyThisMatched rel={rel} />
        <MatchBreakdownChart rel={rel} />
      </div>
    </div>
  );
}
