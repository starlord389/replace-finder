import { cn } from "@/lib/utils";
import { STAGE_LABELS, type RelationshipStage } from "@/features/matches/hooks/useUnifiedRelationships";

export function currency(v: number | null) {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

export function scoreDotClass(s: number) {
  if (s >= 85) return "bg-emerald-500";
  if (s >= 70) return "bg-amber-500";
  return "bg-rose-500";
}

export function scoreTextClass(s: number) {
  if (s >= 85) return "text-emerald-700";
  if (s >= 70) return "text-amber-700";
  return "text-rose-700";
}

/** Score chip fill + foreground — darker fills so white digits meet WCAG AA contrast. */
export function scoreChipClass(s: number) {
  if (s >= 85) return "bg-emerald-700 text-white";
  if (s >= 70) return "bg-amber-700 text-white";
  return "bg-rose-700 text-white";
}

export type PipelineColumn = "new" | "pending" | "active" | "closed";

export const COLUMN_FOR_STAGE: Record<RelationshipStage, PipelineColumn> = {
  new: "new",
  incoming: "new",
  pending_in: "pending",
  pending_out: "pending",
  connected: "active",
  conversing: "active",
  closed_won: "closed",
  closed_lost: "closed",
};

export const COLUMNS: Array<{ key: PipelineColumn; label: string; accent: string }> = [
  { key: "new", label: "New", accent: "bg-blue-500" },
  { key: "pending", label: "Pending", accent: "bg-amber-500" },
  { key: "active", label: "Active", accent: "bg-emerald-500" },
  { key: "closed", label: "Closed", accent: "bg-muted-foreground/40" },
];

export function StageBadge({ stage, className }: { stage: RelationshipStage; className?: string }) {
  const variants: Record<RelationshipStage, string> = {
    new: "bg-blue-50 text-blue-700 border-blue-200",
    incoming: "bg-violet-50 text-violet-700 border-violet-200",
    pending_in: "bg-amber-50 text-amber-800 border-amber-200",
    pending_out: "bg-muted text-muted-foreground border-border",
    connected: "bg-emerald-50 text-emerald-700 border-emerald-200",
    conversing: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed_won: "bg-secondary text-secondary-foreground border-border",
    closed_lost: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        variants[stage],
        className,
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
