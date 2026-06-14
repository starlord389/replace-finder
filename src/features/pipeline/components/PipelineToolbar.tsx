import { Search, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PipelineFilters, SortKey } from "@/features/pipeline/lib/pipelineFilters";
import { cn } from "@/lib/utils";

interface PipelineToolbarProps {
  filters: PipelineFilters;
  onChange: (next: PipelineFilters) => void;
  clientOptions: Array<{ id: string; name: string }>;
  assetOptions: string[];
  resultCount: number;
  totalCount: number;
}

const SORT_LABEL: Record<SortKey, string> = {
  activity: "Recent activity",
  deadline: "Nearest deadline",
  value: "Deal value",
  score: "Best score",
};

export function PipelineToolbar({
  filters,
  onChange,
  clientOptions,
  assetOptions,
  resultCount,
  totalCount,
}: PipelineToolbarProps) {
  const hasFilters =
    filters.search.trim() !== "" ||
    filters.clientIds.length > 0 ||
    filters.assetTypes.length > 0 ||
    filters.riskOnly ||
    filters.sort !== "activity";

  const toggleClient = (id: string) => {
    const next = filters.clientIds.includes(id)
      ? filters.clientIds.filter((c) => c !== id)
      : [...filters.clientIds, id];
    onChange({ ...filters, clientIds: next });
  };

  const toggleAsset = (a: string) => {
    const next = filters.assetTypes.includes(a)
      ? filters.assetTypes.filter((x) => x !== a)
      : [...filters.assetTypes, a];
    onChange({ ...filters, assetTypes: next });
  };

  return (
    <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-lg border bg-card/95 px-3 py-2 backdrop-blur">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search client, property, city…"
          className="h-8 pl-8 text-sm"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            Client
            {filters.clientIds.length > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                {filters.clientIds.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <div className="max-h-72 overflow-y-auto p-2">
            {clientOptions.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No clients</p>
            ) : (
              clientOptions.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={filters.clientIds.includes(c.id)}
                    onCheckedChange={() => toggleClient(c.id)}
                  />
                  <span className="truncate">{c.name}</span>
                </label>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            Asset
            {filters.assetTypes.length > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                {filters.assetTypes.length}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-0">
          <div className="max-h-72 overflow-y-auto p-2">
            {assetOptions.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No asset types</p>
            ) : (
              assetOptions.map((a) => (
                <label
                  key={a}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={filters.assetTypes.includes(a)}
                    onCheckedChange={() => toggleAsset(a)}
                  />
                  <span className="truncate capitalize">{a}</span>
                </label>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Select
        value={filters.sort}
        onValueChange={(v) => onChange({ ...filters, sort: v as SortKey })}
      >
        <SelectTrigger className="h-8 w-[160px] text-sm">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <SelectItem key={k} value={k}>
              {SORT_LABEL[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            onChange({
              search: "",
              clientIds: [],
              assetTypes: [],
              sort: "activity",
              riskOnly: false,
            })
          }
        >
          <X className="mr-1 h-3.5 w-3.5" /> Reset
        </Button>
      )}

      <span
        className={cn(
          "ml-auto text-[11px] text-muted-foreground",
          hasFilters && "font-medium text-foreground",
        )}
      >
        {resultCount} of {totalCount}
      </span>
    </div>
  );
}
