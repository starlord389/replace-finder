import { useMemo } from "react";
import { PipelineColumn } from "./PipelineColumn";
import { COLUMNS, COLUMN_FOR_STAGE, type PipelineColumn as ColumnKey } from "./helpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Props {
  rels: Relationship[];
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  filter: ColumnKey | "all";
}

const EMPTY_HINTS: Record<ColumnKey, string> = {
  new: "No new matches",
  pending: "No pending requests",
  active: "No active conversations",
  closed: "Nothing closed yet",
};

export function PipelineBoard({ rels, selectedId, onSelect, filter }: Props) {
  const grouped = useMemo(() => {
    const g: Record<ColumnKey, Relationship[]> = { new: [], pending: [], active: [], closed: [] };
    for (const r of rels) g[COLUMN_FOR_STAGE[r.stage]].push(r);
    return g;
  }, [rels]);

  const visibleColumns = filter === "all" ? COLUMNS : COLUMNS.filter((c) => c.key === filter);

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2 snap-x snap-mandatory lg:snap-none">
      {visibleColumns.map((col) => (
        <div key={col.key} className="flex min-h-0 snap-start">
          <PipelineColumn
            columnKey={col.key}
            label={col.label}
            accent={col.accent}
            rels={grouped[col.key]}
            selectedId={selectedId}
            onSelect={onSelect}
            emptyHint={EMPTY_HINTS[col.key]}
          />
        </div>
      ))}
    </div>
  );
}
