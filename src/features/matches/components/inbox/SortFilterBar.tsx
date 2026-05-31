import { useMemo } from "react";
import { ArrowUpDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SORT_OPTIONS, type SortKey } from "./inboxHelpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { cn } from "@/lib/utils";

export interface MatchFilters {
  minScore: number;
  states: string[];
  priceMin: number | null;
  priceMax: number | null;
}

export const EMPTY_FILTERS: MatchFilters = {
  minScore: 0,
  states: [],
  priceMin: null,
  priceMax: null,
};

interface Props {
  sort: SortKey;
  onSortChange: (k: SortKey) => void;
  filters: MatchFilters;
  onFiltersChange: (f: MatchFilters) => void;
  scopeRels: Relationship[]; // for building state options
}

export function SortFilterBar({
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  scopeRels,
}: Props) {
  const allStates = useMemo(() => {
    const s = new Set<string>();
    scopeRels.forEach((r) => r.propertyState && s.add(r.propertyState));
    return [...s].sort();
  }, [scopeRels]);

  const activeCount =
    (filters.minScore > 0 ? 1 : 0) +
    (filters.states.length > 0 ? 1 : 0) +
    (filters.priceMin != null ? 1 : 0) +
    (filters.priceMax != null ? 1 : 0);

  function toggleState(st: string) {
    onFiltersChange({
      ...filters,
      states: filters.states.includes(st)
        ? filters.states.filter((x) => x !== st)
        : [...filters.states, st],
    });
  }

  return (
    <div className="flex items-center gap-1.5 border-b border-border px-2 py-2">
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortKey)}>
        <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-1.5 text-xs font-medium shadow-none hover:bg-muted focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.key} value={o.key} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "ml-auto h-7 gap-1 px-2 text-xs",
              activeCount > 0 && "bg-primary/10 text-primary hover:bg-primary/15",
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold">Filter matches</p>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => onFiltersChange(EMPTY_FILTERS)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-medium">Min match score</span>
                <span className="text-muted-foreground">{filters.minScore}</span>
              </div>
              <Slider
                value={[filters.minScore]}
                min={0}
                max={100}
                step={5}
                onValueChange={([v]) => onFiltersChange({ ...filters, minScore: v })}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-medium">Price range</p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin ?? ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceMin: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax ?? ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      priceMax: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {allStates.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-medium">Market</p>
                <div className="flex flex-wrap gap-1">
                  {allStates.map((st) => {
                    const active = filters.states.includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => toggleState(st)}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        {st}
                        {active && <X className="ml-1 inline h-2.5 w-2.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
