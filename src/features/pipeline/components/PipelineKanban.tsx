import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { STAGE_DEFS, type StageKey } from "@/features/pipeline/lib/pipelineStages";
import type { ListingMeta } from "@/features/pipeline/lib/pipelineFilters";
import { useUpdatePipelineStage } from "@/features/pipeline/hooks/usePipelineStageOverride";
import { PipelineListingCard } from "./PipelineListingCard";

function fmtMoney(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function StageColumn({
  stage,
  title,
  subtitle,
  items,
}: {
  stage: StageKey;
  title: string;
  subtitle: string;
  items: ListingMeta[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stage}`, data: { stage } });
  const value = items.reduce((sum, m) => sum + (m.listing.askingPrice ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[260px] w-72 shrink-0 flex-col rounded-xl border bg-muted/30 p-3 transition-colors",
        isOver && "bg-primary/5 ring-2 ring-primary/40",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground">
            {items.length}
          </span>
          {value > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {fmtMoney(value)}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-card/50 p-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              Drop a listing here or wait for activity
            </p>
          </div>
        ) : (
          items.map((m) => <PipelineListingCard key={m.listing.id} meta={m} />)
        )}
      </div>
    </div>
  );
}

interface PipelineKanbanProps {
  rows: ListingMeta[];
  hasFilters: boolean;
  onResetFilters: () => void;
}

export function PipelineKanban({
  rows,
  hasFilters,
  onResetFilters,
}: PipelineKanbanProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateStage = useUpdatePipelineStage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const columns = useMemo(() => {
    const grouped: Record<StageKey, ListingMeta[]> = {
      new: [],
      interested: [],
      connected: [],
      loi: [],
      under_contract: [],
      closed: [],
    };
    for (const r of rows) grouped[r.stage].push(r);
    return grouped;
  }, [rows]);

  const activeMeta = activeId ? rows.find((r) => r.listing.id === activeId) : null;

  const handleStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!user || !e.over) return;
    const overData = e.over.data.current as { stage?: StageKey } | undefined;
    const targetStage = overData?.stage;
    if (!targetStage) return;
    const exchangeId = String(e.active.id);
    const meta = rows.find((r) => r.listing.id === exchangeId);
    if (!meta || meta.stage === targetStage) return;

    // If target matches auto-stage, clear the override so the listing tracks automatically.
    const newOverride: StageKey | null =
      targetStage === meta.autoStage ? null : targetStage;

    updateStage.mutate(
      { exchangeId, stage: newOverride, userId: user.id },
      {
        onSuccess: () => {
          toast({
            title:
              newOverride === null
                ? "Stage reset to auto"
                : `Moved to ${STAGE_DEFS.find((s) => s.key === targetStage)?.title}`,
          });
        },
        onError: () => {
          toast({
            title: "Couldn't move listing",
            description: "Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-10 text-center">
        <p className="text-sm font-semibold text-foreground">
          {hasFilters ? "No listings match these filters" : "Nothing in the pipeline yet"}
        </p>
        <p className="mt-1 max-w-md text-xs text-muted-foreground">
          {hasFilters
            ? "Try clearing the search or filters to see all listings."
            : "Create a listing and we'll start tracking it here automatically."}
        </p>
        <div className="mt-3 flex gap-2">
          {hasFilters ? (
            <Button size="sm" variant="outline" onClick={onResetFilters}>
              Reset filters
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/agent/exchanges/new">
                <Plus className="mr-1 h-4 w-4" /> New listing
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-2">
        {STAGE_DEFS.map((col) => (
          <StageColumn
            key={col.key}
            stage={col.key}
            title={col.title}
            subtitle={col.subtitle}
            items={columns[col.key]}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeMeta ? (
          <div className="w-72">
            <PipelineListingCard meta={activeMeta} isDragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
