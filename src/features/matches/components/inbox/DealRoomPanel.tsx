import { useRef } from "react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { LifecycleTracker } from "./LifecycleTracker";
import { NextActionCard } from "./NextActionCard";
import { ClientSharingCard } from "./ClientSharingCard";
import { AgentCommsCard } from "./AgentCommsCard";
import { deriveUiStatus } from "./inboxHelpers";
import { useMatchLocalState } from "./useMatchLocalState";

interface Props {
  rel: Relationship;
}

export function DealRoomPanel({ rel }: Props) {
  const { state } = useMatchLocalState(rel.matchId);
  const status = deriveUiStatus(rel, state);
  const commsRef = useRef<HTMLDivElement>(null);

  function scrollToComms() {
    commsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <LifecycleTracker status={status} />
        <NextActionCard rel={rel} onOpenConversation={scrollToComms} />
        <ClientSharingCard rel={rel} />
        <div ref={commsRef}>
          <AgentCommsCard rel={rel} />
        </div>
      </div>
    </div>
  );
}
