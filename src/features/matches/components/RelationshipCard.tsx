import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { currency, scoreDotClass, scoreTextClass } from "./helpers";
import { StageActionButton } from "./StageActionButton";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Props {
  rel: Relationship;
  active: boolean;
  onClick: () => void;
}

export function RelationshipCard({ rel, active, onClick }: Props) {
  const displayName =
    rel.counterpartyName ??
    (rel.mySide === "buyer" ? "Anonymous seller agent" : "Anonymous buyer agent");
  const hasAttention = rel.unreadCount > 0 || rel.isNewMatch || rel.stage === "pending_in";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-lg border bg-card p-3 text-left transition-all",
        "hover:border-primary/40 hover:shadow-sm",
        active && "border-primary ring-1 ring-primary/30",
      )}
    >
      {/* Unread dot */}
      {hasAttention && (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
      )}

      {/* Header: avatar + name + score */}
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8">
            {rel.counterpartyAvatar && <AvatarImage src={rel.counterpartyAvatar} />}
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
              scoreDotClass(rel.score),
            )}
            title={`Match score ${Math.round(rel.score)}`}
          />
        </div>

        <div className="min-w-0 flex-1 pr-3">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {rel.counterpartyBrokerage ?? (rel.clientName ? `Client: ${rel.clientName}` : "—")}
          </p>
        </div>
      </div>

      {/* Property summary */}
      <div className="mt-2.5 rounded-md bg-muted/40 px-2.5 py-1.5">
        <p className="truncate text-xs font-medium text-foreground">{rel.propertyName}</p>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">
            {[rel.propertyCity, rel.propertyState].filter(Boolean).join(", ") || "—"}
          </span>
          <span className="shrink-0 font-medium text-foreground">{currency(rel.askingPrice)}</span>
        </div>
      </div>

      {/* Last message preview, only when active stage */}
      {rel.lastMessagePreview && (
        <p
          className={cn(
            "mt-2 line-clamp-1 text-[11px]",
            rel.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {rel.lastMessagePreview}
        </p>
      )}

      {/* Footer: score chip + time + CTA */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={cn("font-semibold", scoreTextClass(rel.score))}>
            {Math.round(rel.score)}
          </span>
          <span aria-hidden>·</span>
          <span>{formatDistanceToNow(new Date(rel.lastActivityAt), { addSuffix: false })}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <StageActionButton rel={rel} />
        </div>
      </div>
    </div>
  );
}
