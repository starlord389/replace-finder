import { Fragment } from "react";
import { Search, MoreHorizontal, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { PropertyMatchCard } from "./PropertyMatchCard";
import { FILTER_TABS, type UiStatus, type SortKey } from "./inboxHelpers";
import { SortFilterBar, type MatchFilters } from "./SortFilterBar";
import { getClientAccent } from "@/features/matches/lib/clientAccent";


interface Props {
  rels: Relationship[];
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filter: "all" | UiStatus;
  onFilterChange: (f: "all" | UiStatus) => void;
  counts: Record<"all" | UiStatus, number>;
  sort: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: MatchFilters;
  onFiltersChange: (f: MatchFilters) => void;
  scopeRels: Relationship[];
  rankMap: Map<string, number>;
  /** When true, render sticky client section headers between cards. */
  groupByClient?: boolean;
  onGroupByClientChange?: (v: boolean) => void;
}


// Primary chips shown inline; remainder go in a "More" popover.
const PRIMARY_KEYS: Array<"all" | UiStatus> = [
  "all",
  "new",
  "client_interested",
  "agent_connected",
  "closed",
];

export function InboxList({
  rels,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
  groupByClient = false,
  onGroupByClientChange,

  sort,
  onSortChange,
  filters,
  onFiltersChange,
  scopeRels,
  rankMap,
}: Props) {
  const primaryTabs = FILTER_TABS.filter((t) => PRIMARY_KEYS.includes(t.key));
  const moreTabs = FILTER_TABS.filter((t) => !PRIMARY_KEYS.includes(t.key));
  const moreActive = moreTabs.some((t) => t.key === filter);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      {/* Search */}
      <div className="shrink-0 border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search property, city, client…"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Filter chips (wrap, no horizontal scroll) */}
      <div className="shrink-0 border-b border-border px-2 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {primaryTabs.map((t) => {
            const count = counts[t.key] ?? 0;
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onFilterChange(t.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t.label}
                <span className={cn("ml-1 text-[10px]", active ? "opacity-80" : "opacity-60")}>
                  {count}
                </span>
              </button>
            );
          })}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  moreActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <MoreHorizontal className="h-3 w-3" />
                More
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1">
              {moreTabs.map((t) => {
                const count = counts[t.key] ?? 0;
                const active = filter === t.key;
                return (
                  <Button
                    key={t.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange(t.key)}
                    className={cn(
                      "w-full justify-between text-xs",
                      active && "bg-muted text-foreground",
                    )}
                  >
                    <span>{t.label}</span>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </Button>
                );
              })}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Sort + filters */}
      <SortFilterBar
        sort={sort}
        onSortChange={onSortChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
        scopeRels={scopeRels}
      />

      {/* Group-by-client toggle */}
      {onGroupByClientChange && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-1.5">
          <button
            type="button"
            onClick={() => onGroupByClientChange(!groupByClient)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              groupByClient
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Users className="h-3 w-3" />
            Group by client
          </button>
        </div>
      )}

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {rels.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-medium text-foreground">No matches</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different filter or search.
            </p>
          </div>
        ) : groupByClient ? (
          <GroupedList
            rels={rels}
            selectedId={selectedId}
            onSelect={onSelect}
            rankMap={rankMap}
          />
        ) : (
          <ul className="space-y-2">
            {rels.map((r) => (
              <li key={r.id}>
                <PropertyMatchCard
                  rel={r}
                  selected={r.id === selectedId}
                  onSelect={() => onSelect(r)}
                  rank={rankMap.get(r.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface GroupedListProps {
  rels: Relationship[];
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  rankMap: Map<string, number>;
}

function GroupedList({ rels, selectedId, onSelect, rankMap }: GroupedListProps) {
  // Group preserving incoming sort order; key = clientId (fallback to "Client").
  const groups: Array<{ clientId: string | null; clientName: string; items: Relationship[] }> = [];
  const indexByKey = new Map<string, number>();
  for (const r of rels) {
    const key = r.clientId ?? `__${r.clientName ?? "client"}`;
    let idx = indexByKey.get(key);
    if (idx == null) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({ clientId: r.clientId, clientName: r.clientName ?? "Client", items: [] });
    }
    groups[idx].items.push(r);
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const accent = getClientAccent(g.clientId);
        return (
          <Fragment key={g.clientId ?? g.clientName}>
            <div
              className={cn(
                "sticky top-0 z-[1] -mx-2 flex items-center justify-between gap-2 border-y px-3 py-1.5 backdrop-blur",
                accent.soft,
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", accent.dot)} />
                <span className={cn("truncate text-xs font-semibold", accent.fg)}>
                  {g.clientName}
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                {g.items.length} match{g.items.length === 1 ? "" : "es"}
              </span>
            </div>
            <ul className="space-y-2">
              {g.items.map((r) => (
                <li key={r.id}>
                  <PropertyMatchCard
                    rel={r}
                    selected={r.id === selectedId}
                    onSelect={() => onSelect(r)}
                    rank={rankMap.get(r.id)}
                    hideClientLead
                  />
                </li>
              ))}
            </ul>
          </Fragment>
        );
      })}
    </div>
  );
}
