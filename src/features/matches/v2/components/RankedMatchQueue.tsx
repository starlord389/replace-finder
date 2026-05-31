
import { Inbox as InboxIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import {
  sortRelationships,
  type SortKey,
} from "@/features/matches/components/inbox/inboxHelpers";
import { PropertyMatchCard } from "@/features/matches/components/inbox/PropertyMatchCard";
import {
  SortFilterBar,
  type MatchFilters,
} from "@/features/matches/components/inbox/SortFilterBar";

interface Props {
  matches: Relationship[];
  sort: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: MatchFilters;
  onFiltersChange: (f: MatchFilters) => void;
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  /** Visible (sorted + filtered) list — passed in for shared rank numbering. */
  visible: Relationship[];
  rankMap: Map<string, number>;
}

export function RankedMatchQueue({
  matches,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
  visible,
  rankMap,
}: Props) {
  const totalScope = matches.length;
  const hiddenByFilters = totalScope - visible.length;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">
            Ranked matches{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({visible.length}
              {hiddenByFilters > 0 ? ` of ${totalScope}` : ""})
            </span>
          </p>
        </div>
      </div>

      <SortFilterBar
        sort={sort}
        onSortChange={onSortChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
        scopeRels={matches}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
            <InboxIcon className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
              {totalScope === 0 ? "No matches yet" : "No matches fit these filters"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalScope === 0
                ? "Matches will appear here as inventory is published."
                : "Loosen filters or pick a different sort."}
            </p>
          </div>
        ) : (
          <ul className={cn("space-y-2 p-2")}>
            {visible.map((rel) => (
              <li key={rel.id}>
                <PropertyMatchCard
                  rel={rel}
                  selected={rel.id === selectedId}
                  onSelect={() => onSelect(rel)}
                  rank={rankMap.get(rel.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Hoist out of the page so the workspace can compute visible+rank in one place. */
export function computeVisible(
  scope: Relationship[],
  filters: MatchFilters,
  sort: SortKey,
): { visible: Relationship[]; rankMap: Map<string, number> } {
  const filtered = scope
    .filter((r) => r.score >= filters.minScore)
    .filter((r) =>
      filters.states.length === 0
        ? true
        : r.propertyState
          ? filters.states.includes(r.propertyState)
          : false,
    )
    .filter((r) => {
      const p = r.askingPrice ?? null;
      if (filters.priceMin != null && (p == null || p < filters.priceMin)) return false;
      if (filters.priceMax != null && (p == null || p > filters.priceMax)) return false;
      return true;
    });
  const sorted = sortRelationships(filtered, sort);
  const rankMap = new Map<string, number>();
  sorted.forEach((r, i) => rankMap.set(r.id, i + 1));
  return { visible: sorted, rankMap };
}

// Avoid unused-import lint by surfacing useMemo (kept for callers that import sortRelationships indirectly)
void useMemo;
