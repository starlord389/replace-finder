import { useState, useMemo, useEffect, useRef, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Search, Send, ArrowLeft, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConversations, type Conversation } from "@/features/messages/hooks/useConversations";
import { useMessageThread } from "@/features/messages/hooks/useMessageThread";
import { useMarkRead } from "@/features/messages/hooks/useMarkRead";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function AgentMessages() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: conversations = [], isLoading } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.counterpartyName.toLowerCase().includes(q) ||
        c.propertyName.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (!isMobile && !selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].connectionId);
    }
  }, [isMobile, selectedId, filtered]);

  const selected = conversations.find((c) => c.connectionId === selectedId) ?? null;

  const showList = !isMobile || !selectedId;
  const showThread = !isMobile || !!selectedId;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-7xl gap-4">
      {/* Conversation list */}
      {showList && (
        <aside className={cn("flex flex-col rounded-lg border border-[#e4dcd0] bg-white", isMobile ? "w-full" : "w-80 shrink-0")}>
          <div className="border-b border-[#e4dcd0] p-4">
            <h1 className="mb-3 text-lg font-bold text-foreground">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents or properties..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No conversations yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Accepted connections appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#f0eae0]">
                {filtered.map((c) => (
                  <ConversationRow
                    key={c.connectionId}
                    conv={c}
                    active={c.connectionId === selectedId}
                    currentUserId={user?.id ?? ""}
                    onClick={() => setSelectedId(c.connectionId)}
                  />
                ))}
              </ul>
            )}
          </div>
        </aside>
      )}

      {/* Thread pane */}
      {showThread && (
        <section className="flex flex-1 flex-col rounded-lg border border-[#e4dcd0] bg-white">
          {selected ? (
            <ThreadView
              conversation={selected}
              onBack={isMobile ? () => setSelectedId(null) : undefined}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">Select a conversation</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Choose a thread from the left to start messaging.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ConversationRow({
  conv,
  active,
  currentUserId,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const initial = conv.counterpartyName.charAt(0).toUpperCase();
  const preview = conv.lastMessage
    ? conv.lastMessageSenderId === currentUserId
      ? `You: ${conv.lastMessage}`
      : conv.lastMessage
    : "No messages yet";
  const time = conv.lastMessageAt
    ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })
    : null;

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#faf7f1]",
          active && "bg-[#f4ede0]",
        )}
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {conv.counterpartyName}
            </p>
            {time && (
              <span className="shrink-0 text-[10px] text-muted-foreground">{time}</span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{conv.propertyName}</p>
          <div className="mt-1 flex items-center gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-xs",
                conv.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {preview}
            </p>
            {conv.unreadCount > 0 && (
              <Badge className="h-5 min-w-5 shrink-0 justify-center px-1.5 text-[10px]">
                {conv.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function ThreadView({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack?: () => void;
}) {
  const { user } = useAuth();
  const { data: messages = [], isLoading, send } = useMessageThread(conversation.connectionId);
  useMarkRead(conversation.connectionId);

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
    <>
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-[#e4dcd0] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {conversation.counterpartyName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {conversation.counterpartyName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{conversation.propertyName}</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to={`/agent/connections/${conversation.connectionId}`}>
            <span className="hidden sm:inline">View connection</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </header>

      {/* Messages */}
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

      {/* Composer */}
      <div className="border-t border-[#e4dcd0] p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…  (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button onClick={handleSend} disabled={!draft.trim() || send.isPending} size="icon" className="h-11 w-11 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
