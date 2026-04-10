import { type ReactNode } from "react";
import { CheckCircle2, ChevronRight, type LucideIcon } from "lucide-react";

interface LaunchpadChecklistCardProps {
  title: string;
  description: string;
  complete: boolean;
  icon: LucideIcon;
  onClick?: () => void;
  children?: ReactNode;
  isLast?: boolean;
}

function CompletionBadge({ complete }: { complete: boolean }) {
  if (complete) {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <span className="text-sm font-medium text-green-600">100%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
      <span className="text-sm font-medium text-muted-foreground">0%</span>
    </div>
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
}: LaunchpadChecklistCardProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 ${
          !isLast ? "border-b" : ""
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/60">
          <Icon className={`h-5 w-5 ${complete ? "text-muted-foreground" : "text-foreground/70"}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${complete ? "text-muted-foreground" : "text-primary"}`}>
            {title}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        <div className="shrink-0">
          <CompletionBadge complete={complete} />
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50" />
      </button>

      {children ? <div className="border-b px-5 pb-4 pt-1">{children}</div> : null}
    </div>
  );
}
