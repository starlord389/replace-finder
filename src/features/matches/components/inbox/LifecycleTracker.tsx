import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIFECYCLE_ORDER, UI_STATUS_LABEL, type UiStatus } from "./inboxHelpers";

interface Props {
  status: UiStatus;
  variant?: "compact" | "full";
}

export function LifecycleTracker({ status, variant = "compact" }: Props) {
  const isArchived = status === "archived";
  const currentIdx = isArchived ? -1 : LIFECYCLE_ORDER.indexOf(status);

  if (variant === "compact") {
    return (
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isArchived ? "Archived" : `Stage ${currentIdx + 1} of ${LIFECYCLE_ORDER.length}`}
          </span>
          <span className="truncate text-xs font-semibold text-foreground">
            {isArchived ? "—" : UI_STATUS_LABEL[status]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {LIFECYCLE_ORDER.map((s, i) => {
            const done = !isArchived && i < currentIdx;
            const current = !isArchived && i === currentIdx;
            return (
              <div
                key={s}
                title={UI_STATUS_LABEL[s]}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  done && "bg-emerald-500",
                  current && "bg-primary",
                  !done && !current && "bg-muted",
                )}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Lifecycle</h3>
        {isArchived && (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Archived
          </span>
        )}
      </div>
      <ol className="space-y-2">
        {LIFECYCLE_ORDER.map((s, i) => {
          const done = !isArchived && i < currentIdx;
          const current = !isArchived && i === currentIdx;
          return (
            <li key={s} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  current && "border-primary bg-primary text-primary-foreground",
                  !done && !current && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-xs",
                  current ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {UI_STATUS_LABEL[s]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
