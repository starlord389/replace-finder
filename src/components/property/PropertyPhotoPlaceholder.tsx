import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  compact?: boolean;
  tone?: "light" | "dark";
}

export function PropertyPhotoPlaceholder({ className, compact = false, tone = "light" }: Props) {
  const label = "No property photos provided";

  return (
    <div
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 text-center",
        tone === "dark"
          ? "bg-gradient-to-br from-[#403a34] to-[#272320] text-white/75"
          : "bg-gradient-to-br from-muted via-muted/80 to-muted/40 text-muted-foreground",
        className,
      )}
    >
      <ImageOff className={compact ? "h-5 w-5" : "h-8 w-8"} aria-hidden="true" />
      {compact ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="max-w-[15rem] px-3 text-xs font-medium">{label}</span>
      )}
    </div>
  );
}
