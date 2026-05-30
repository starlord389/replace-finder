import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { PropertyMatchCard } from "./PropertyMatchCard";
import { FILTER_TABS, type UiStatus } from "./inboxHelpers";

interface Props {
  rels: Relationship[];
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  search: string;
  onSearchChange: (v: string) => void;
  filter: "all" | UiStatus;
  onFilterChange: (f: "all" | UiStatus) => void;
  counts: Record<"all" | UiStatus, number>;
}

export function InboxList({
  rels,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-card">
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search property, city, client, agent…"
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0.5 overflow-x-auto px-2 py-2 scrollbar-thin">
          {FILTER_TABS.map((t) => {
            const count = counts[t.key] ?? 0;
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onFilterChange(t.key)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
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
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {rels.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-medium text-foreground">No matches</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different filter or search.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rels.map((r) => (
              <li key={r.id}>
                <PropertyMatchCard
                  rel={r}
                  selected={r.id === selectedId}
                  onSelect={() => onSelect(r)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
