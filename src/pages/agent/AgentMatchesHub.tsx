import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useUnifiedRelationships,
  type Relationship,
} from "@/features/matches/hooks/useUnifiedRelationships";
import { PipelineBoard } from "@/features/matches/components/PipelineBoard";
import { RelationshipDrawer } from "@/features/matches/components/RelationshipDrawer";
import { COLUMNS, COLUMN_FOR_STAGE, type PipelineColumn } from "@/features/matches/components/helpers";

const FILTERS: Array<{ value: PipelineColumn | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

// Map legacy stage filter values from old URL structure → new column filter
const LEGACY_STAGE_MAP: Record<string, PipelineColumn | "all"> = {
  live: "all",
  new: "new",
  pending: "pending",
  active: "active",
  closed: "closed",
  all: "all",
};

export default function AgentMatchesHub() {
  const { data: rels = [], isLoading } = useUnifiedRelationships();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const rawFilter = searchParams.get("stage") ?? searchParams.get("col") ?? "all";
  const filter = (LEGACY_STAGE_MAP[rawFilter] ?? "all") as PipelineColumn | "all";
  const selectedId = searchParams.get("id");

  // Translate legacy deep-links (?connection=, ?match=) into ?id=
  useEffect(() => {
    const legacyConn = searchParams.get("connection");
    const legacyMatch = searchParams.get("match");
    if (legacyConn || legacyMatch) {
      const targetId = legacyConn ?? legacyMatch!;
      const next = new URLSearchParams(searchParams);
      next.delete("connection");
      next.delete("match");
      next.set("id", targetId);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filter by search query (column filter is applied inside the board)
  const visibleRels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rels;
    return rels.filter(
      (r) =>
        r.propertyName.toLowerCase().includes(q) ||
        (r.counterpartyName ?? "").toLowerCase().includes(q) ||
        (r.clientName ?? "").toLowerCase().includes(q) ||
        (r.propertyCity ?? "").toLowerCase().includes(q),
    );
  }, [rels, search]);

  // Counts per column (across all rels, ignoring search)
  const counts = useMemo(() => {
    const c: Record<PipelineColumn, number> = { new: 0, pending: 0, active: 0, closed: 0 };
    for (const r of rels) c[COLUMN_FOR_STAGE[r.stage]]++;
    return c;
  }, [rels]);

  const selected = rels.find((r) => r.id === selectedId) ?? null;

  function setFilter(value: PipelineColumn | "all") {
    const next = new URLSearchParams(searchParams);
    if (value === "all") next.delete("stage");
    else next.set("stage", value);
    setSearchParams(next);
  }

  function select(rel: Relationship) {
    const next = new URLSearchParams(searchParams);
    next.set("id", rel.id);
    setSearchParams(next);
  }

  function clearSelection() {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    next.delete("tab");
    setSearchParams(next);
  }

  const totalCount = rels.length;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Matches</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Your pipeline of matches, requests, and conversations.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/agent/exchanges/new">
            <Plus className="mr-1 h-4 w-4" /> New exchange
          </Link>
        </Button>
      </div>

      {/* Filter + search bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center rounded-lg border bg-card p-0.5">
          {FILTERS.map((f) => {
            const count = f.value === "all" ? totalCount : counts[f.value as PipelineColumn];
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "ml-1.5 text-[10px]",
                    filter === f.value ? "opacity-80" : "opacity-60",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agent, property, client…"
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Pipeline board */}
      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : totalCount === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center">
            <p className="text-base font-semibold text-foreground">No matches yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Create an exchange to start receiving match recommendations.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link to="/agent/exchanges/new">
                <Plus className="mr-1 h-4 w-4" /> New exchange
              </Link>
            </Button>
          </div>
        ) : (
          <PipelineBoard
            rels={visibleRels}
            selectedId={selectedId}
            onSelect={select}
            filter={filter}
          />
        )}
      </div>

      {/* Detail drawer */}
      <RelationshipDrawer rel={selected} open={!!selected} onClose={clearSelection} />
    </div>
  );
}
