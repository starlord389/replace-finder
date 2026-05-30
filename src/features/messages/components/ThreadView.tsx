import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMessageThread } from "@/features/messages/hooks/useMessageThread";
import { useMarkRead } from "@/features/messages/hooks/useMarkRead";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ThreadViewProps {
  connectionId: string;
  counterpartyName: string;
  subtitle?: string;
  onBack?: () => void;
  headerExtra?: React.ReactNode;
  embedded?: boolean;
  hideHeader?: boolean;
}

/**
 * Reusable message thread. Used both standalone and embedded inside the
 * Matches hub drawer. Pass `hideHeader` when the parent already shows the
 * counterparty name (e.g. the drawer header).
 */
export function ThreadView({
  connectionId,
  counterpartyName,
  subtitle,
  onBack,
  headerExtra,
  embedded = false,
  hideHeader = false,
}: ThreadViewProps) {
  const { user } = useAuth();
  const { data: messages = [], isLoading, send } = useMessageThread(connectionId);
  useMarkRead(connectionId);

  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || send.isPending) return;
    setDraft("");
    try {
      await send.mutateAsync(trimmed);
    } catch {
      setDraft(trimmed);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex h-full flex-col", embedded && "min-h-0")}>
      {!hideHeader && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {counterpartyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{counterpartyName}</p>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {headerExtra}
        </header>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No messages yet. Send the first one below.
          </p>
        ) : (
          messages.map((m) => {
            const own = m.sender_id === user?.id;
            return (
              <div key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    own
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      own ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…  (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || send.isPending}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
