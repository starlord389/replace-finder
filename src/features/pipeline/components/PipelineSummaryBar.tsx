import { Briefcase, AlertTriangle, Sparkles, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtMoney(v: number | null): string {
  if (!v) return "$0";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

interface PipelineSummaryBarProps {
  totalListings: number;
  totalValue: number;
  atRiskCount: number;
  bestScore: number | null;
  activeMatches: number;
  riskOnly: boolean;
  onToggleRisk: (next: boolean) => void;
}

interface PillProps {
  icon: typeof Briefcase;
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "warning" | "primary";
  active?: boolean;
  onClick?: () => void;
}

function Pill({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = "default",
  active = false,
  onClick,
}: PillProps) {
  const toneCls =
    tone === "warning"
      ? "border-amber-200 bg-amber-50/60"
      : tone === "primary"
        ? "border-primary/20 bg-primary/5"
        : "border-border bg-card";

  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
        toneCls,
        onClick && "hover:bg-muted/40",
        active && "ring-2 ring-primary/40",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          tone === "warning"
            ? "bg-amber-100 text-amber-700"
            : tone === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-foreground/70",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-base font-bold leading-tight text-foreground">{value}</p>
        {sublabel && (
          <p className="text-[11px] text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </Wrapper>
  );
}

export function PipelineSummaryBar({
  totalListings,
  totalValue,
  atRiskCount,
  bestScore,
  activeMatches,
  riskOnly,
  onToggleRisk,
}: PipelineSummaryBarProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Pill
        icon={Briefcase}
        label="Listings"
        value={`${totalListings}`}
        sublabel={totalValue > 0 ? `${fmtMoney(totalValue)} total` : "No value set"}
      />
      <Pill
        icon={AlertTriangle}
        label="At-risk"
        value={`${atRiskCount}`}
        sublabel="Deadline ≤ 14d"
        tone="warning"
        active={riskOnly}
        onClick={() => onToggleRisk(!riskOnly)}
      />
      <Pill
        icon={Handshake}
        label="Active matches"
        value={`${activeMatches}`}
        sublabel="Across listings"
      />
      <Pill
        icon={Sparkles}
        label="Best score"
        value={bestScore !== null ? `${Math.round(bestScore)}` : "—"}
        sublabel="Top opportunity"
        tone="primary"
      />
    </div>
  );
}
