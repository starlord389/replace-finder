import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { getClientAccent } from "@/features/matches/lib/clientAccent";

export interface PipelineListingCardProps {
  exchangeId: string;
  clientId: string | null;
  clientName: string | null;
  propertyTitle: string;
  location: string | null;
  matchCount: number;
  lastActivityAt: string | null;
  stageLabel: string;
}

export function PipelineListingCard({
  exchangeId,
  clientId,
  clientName,
  propertyTitle,
  location,
  matchCount,
  lastActivityAt,
  stageLabel,
}: PipelineListingCardProps) {
  const accent = getClientAccent(clientId);
  return (
    <Link
      to={`/agent/workspace/${exchangeId}`}
      className={cn(
        "group block rounded-lg border border-l-[4px] bg-card p-3 transition-all hover:shadow-md hover:border-primary/30",
        accent.borderLeft,
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
        <span className="truncate">{clientName ?? "No client"}</span>
      </div>
      <h3 className="mt-1 truncate text-sm font-semibold text-foreground group-hover:text-primary">
        {propertyTitle}
      </h3>
      {location && (
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" /> {location}
        </p>
      )}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-medium">
          {matchCount} {matchCount === 1 ? "match" : "matches"}
        </span>
        {lastActivityAt && (
          <span>{formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })}</span>
        )}
      </div>
    </Link>
  );
}
