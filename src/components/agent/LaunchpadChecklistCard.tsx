import { type ReactNode } from "react";
import { CheckCircle2, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LaunchpadStepStatus = "done" | "in_progress" | "attention" | "todo";

interface LaunchpadChecklistCardProps {
  title: string;
  description: string;
  complete: boolean;
  icon: LucideIcon;
  onClick?: () => void;
  children?: ReactNode;
  isLast?: boolean;
  tip?: string;
  status?: LaunchpadStepStatus;
  progressLabel?: string;
}

function StatusChip({ status, progressLabel }: { status: LaunchpadStepStatus; progressLabel?: string }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Done
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
        {progressLabel ?? "In progress"}
      </span>
    );
  }
  if (status === "attention") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
        Next up
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Not started
    </span>
  );
}

export default function LaunchpadChecklistCard({
  title,
  description,
  complete,
  icon: Icon,
  onClick,
  children,
  isLast = false,
  tip,
  status,
}: LaunchpadChecklistCardProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50",
          !isLast && "border-b",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60">
          <Icon
            className={cn(
              "h-5 w-5",
              complete ? "text-muted-foreground" : "text-foreground/70",
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold",
              complete ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {title}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          {tip ? (
            <p className="mt-1.5 text-xs text-muted-foreground/80">{tip}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {status ? <StatusChip status={status} progressLabel={progressLabel} /> : null}
          <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
        </div>
      </button>

      {children ? <div className="border-b px-5 pb-4 pt-1">{children}</div> : null}
    </div>
  );
}
