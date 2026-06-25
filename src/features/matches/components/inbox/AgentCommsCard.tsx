import { useState } from "react";
import { MessageSquare, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThreadView } from "@/features/messages/components/ThreadView";
import { isConnected, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { QUICK_MESSAGES } from "./inboxHelpers";

interface Props {
  rel: Relationship;
}

export function AgentCommsCard({ rel }: Props) {
  const connected = isConnected(rel.stage) && !!rel.connectionId;
  const [draft, setDraft] = useState<string | undefined>(undefined);

  const displayName =
    rel.counterpartyName ??
    (rel.mySide === "buyer" ? "Anonymous seller agent" : "Anonymous buyer agent");

  function inject(msg: string) {
    setDraft(msg);
  }

  return (
    <div className="flex min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Conversation</h3>
        </div>
        <span className="truncate text-xs text-muted-foreground">{displayName}</span>
      </div>

      {/* Quick messages */}
      <div className="border-b border-border bg-muted/30 px-3 py-2">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Quick messages
        </p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_MESSAGES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => inject(m)}
              disabled={!connected}
              className={cn(
                "rounded-full border bg-background px-2.5 py-1 text-[11px] text-foreground/80 transition-colors",
                connected
                  ? "hover:border-primary/40 hover:text-primary"
                  : "cursor-not-allowed opacity-50",
              )}
              title={connected ? "Insert into composer" : "Connect first to message"}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {connected ? (
        <div className="flex h-[420px] min-h-0 flex-col">
          <ThreadView
            key={rel.connectionId}
            connectionId={rel.connectionId!}
            counterpartyName={displayName}
            embedded
            hideHeader
            initialDraft={draft}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {rel.stage === "pending_out"
                ? "Awaiting their response"
                : rel.stage === "pending_in"
                ? "They want to connect"
                : "Connect to start messaging"}
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Once connected, you can message directly and use quick replies above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
