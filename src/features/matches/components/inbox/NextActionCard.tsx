import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { UI_STATUS_LABEL } from "./inboxHelpers";
import { useMatchActions } from "./useMatchActions";

interface Props {
  rel: Relationship;
  onOpenConversation?: () => void;
  onSendToClient?: () => void;
}

export function NextActionCard({ rel, onOpenConversation, onSendToClient }: Props) {
  const { status, primary, secondary, handle, busy } = useMatchActions(rel, {
    onOpenConversation,
    onSendToClient,
  });

  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Next action</h3>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {UI_STATUS_LABEL[status]}
        </span>
      </div>
      <div className="space-y-2">
        {primary ? (
          <Button
            className="w-full"
            onClick={() => handle(primary.id, primary.label)}
            disabled={busy === primary.id}
          >
            {primary.label}
          </Button>
        ) : (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            This deal is complete. No further action required.
          </p>
        )}
        {secondary.map((a) => (
          <Button
            key={a.id}
            variant={a.tone === "destructive" ? "ghost" : "outline"}
            size="sm"
            className={cn(
              "w-full justify-start",
              a.tone === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
            )}
            onClick={() => handle(a.id, a.label)}
            disabled={busy === a.id}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
