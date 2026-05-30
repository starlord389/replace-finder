import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { ThreadView } from "@/features/messages/components/ThreadView";
import { ContextPanel } from "./ContextPanel";
import { StageActionButton } from "./StageActionButton";
import { StageBadge } from "./helpers";
import { isConnected, type Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

interface Props {
  rel: Relationship | null;
  open: boolean;
  onClose: () => void;
}

export function RelationshipDrawer({ rel, open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-[560px]"
      >
        {rel && <DrawerBody rel={rel} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ rel }: { rel: Relationship }) {
  const connected = isConnected(rel.stage) && !!rel.connectionId;
  const displayName =
    rel.counterpartyName ??
    (rel.mySide === "buyer" ? "Anonymous seller agent" : "Anonymous buyer agent");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Sticky header */}
      <div className="flex items-start gap-3 border-b border-border bg-card px-5 py-4">
        <Avatar className="h-10 w-10 shrink-0">
          {rel.counterpartyAvatar && <AvatarImage src={rel.counterpartyAvatar} />}
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <StageBadge stage={rel.stage} />
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {rel.counterpartyBrokerage ?? rel.propertyName}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to={`/agent/matches/${rel.matchId}`}>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Context (collapsible). Expanded by default when not yet conversing. */}
      <ContextPanel rel={rel} defaultOpen={!connected} />

      {/* Body */}
      {connected ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ThreadView
            connectionId={rel.connectionId!}
            counterpartyName={displayName}
            subtitle={rel.propertyName}
            embedded
            hideHeader
          />
        </div>
      ) : (
        <PreConnectionBody rel={rel} />
      )}
    </div>
  );
}

function PreConnectionBody({ rel }: { rel: Relationship }) {
  const hint =
    rel.stage === "pending_out"
      ? "Your connection request is awaiting their response. We'll notify you when they reply."
      : rel.stage === "pending_in"
      ? "This agent wants to connect. Review the match and respond."
      : rel.stage === "new"
      ? "Send a connection request to unlock direct messaging with this agent."
      : rel.stage === "incoming"
      ? "Another agent's exchange matched your listing. Review to start a conversation."
      : rel.stage === "closed_won"
      ? "This deal is closed. Open the full match to review history."
      : "This match is closed.";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">
          {rel.stage === "closed_won" || rel.stage === "closed_lost" ? "Conversation closed" : "Connect to start messaging"}
        </p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="border-t border-border bg-card px-5 py-3">
        <StageActionButton rel={rel} size="default" fullWidth />
      </div>
    </div>
  );
}
