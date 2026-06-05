import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";

interface Props {
  clientId: string | null | undefined;
  clientName: string | null | undefined;
  relinquishedLabel?: string | null;
  size?: "sm" | "md";
  className?: string;
  /** When true, render the client name in a filled pill (used in panels) instead of inline. */
  pill?: boolean;
}

/**
 * The consistent "● {Client} · {Relinquished}" lead line used on every match /
 * listing / deal card so the agent always knows whose deal it is.
 */
export function ClientLeadLine({
  clientId,
  clientName,
  relinquishedLabel,
  size = "sm",
  className,
  pill = false,
}: Props) {
  const accent = getClientAccent(clientId);
  const name = clientName || "Client";
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", textSize, className)}>
      {pill ? (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold",
            accent.soft,
            accent.fg,
          )}
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)} />
          <span className="truncate">{name}</span>
        </span>
      ) : (
        <>
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", accent.dot)}
            aria-hidden
          />
          <span className="truncate font-semibold text-foreground">{name}</span>
        </>
      )}
      {relinquishedLabel ? (
        <>
          <span className="shrink-0 text-muted-foreground/70">·</span>
          <span className="truncate text-muted-foreground">{relinquishedLabel}</span>
        </>
      ) : null}
    </div>
  );
}
