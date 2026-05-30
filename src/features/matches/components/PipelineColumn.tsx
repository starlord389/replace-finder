import { cn } from "@/lib/utils";
import { RelationshipCard } from "./RelationshipCard";
import type { PipelineColumn as ColumnKey } from "./helpers";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Props {
  label: string;
  accent: string;
  columnKey: ColumnKey;
  rels: Relationship[];
  selectedId: string | null;
  onSelect: (rel: Relationship) => void;
  emptyHint?: string;
}

export function PipelineColumn({ label, accent, rels, selectedId, onSelect, emptyHint }: Props) {
  return (
    <div className="flex min-h-0 w-[300px] shrink-0 flex-col rounded-xl border bg-muted/30 md:w-[320px] lg:flex-1 lg:min-w-0">
      {/* Column header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", accent)} />
          <h3 className="text-sm font-semibold text-foreground truncate">{label}</h3>
          <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {rels.length}
          </span>
        </div>
      </div>

      {/* Column body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {rels.length === 0 ? (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-md border border-dashed border-border/60 px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">{emptyHint ?? "Nothing here"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rels.map((r) => (
              <RelationshipCard
                key={r.id}
                rel={r}
                active={r.id === selectedId}
                onClick={() => onSelect(r)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
