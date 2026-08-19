import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  AgentWorkflowFrame,
  AgentWorkflowNavigation,
} from "@/features/metaAgentLanding/AgentWorkflowFoundation";
import { AgentWorkflowReviewScenes } from "@/features/metaAgentLanding/AgentWorkflowReviewSegment";
import {
  ILLUSTRATIVE_CLIENT,
  ILLUSTRATIVE_LISTING_AGENT,
  ILLUSTRATIVE_MATCHES,
  ILLUSTRATIVE_OPENING_MESSAGE,
} from "@/features/metaAgentLanding/agentWorkflowData";
import {
  getAgentWorkflowAdvanceVisualPhase,
  type AgentWorkflowPhaseId,
} from "@/features/metaAgentLanding/agentWorkflowStory";
import { useAgentWorkflowPlayback } from "@/features/metaAgentLanding/useAgentWorkflowPlayback";

type AdvanceScenesProps = {
  phase: AgentWorkflowPhaseId;
  selectedMatchIndex?: number;
  onSelectMatch?: (index: number) => void;
  onGoToPhase?: (phase: AgentWorkflowPhaseId) => void;
};

export function AgentWorkflowAdvanceScenes({
  phase,
  selectedMatchIndex = 0,
  onSelectMatch,
  onGoToPhase,
}: AdvanceScenesProps) {
  const selectedMatch = ILLUSTRATIVE_MATCHES[selectedMatchIndex] ?? ILLUSTRATIVE_MATCHES[0];
  const visualPhase = getAgentWorkflowAdvanceVisualPhase(phase);
  const isContact = visualPhase === "contact";
  const isConversation = visualPhase === "conversation" || visualPhase === "typing" || visualPhase === "sent";

  if (visualPhase === "match") {
    return (
      <AgentWorkflowReviewScenes
        phase="match-rationale"
        selectedMatchIndex={selectedMatchIndex}
        onSelectMatch={onSelectMatch}
        onGoToPhase={onGoToPhase}
      />
    );
  }

  return (
    <section
      className="agent-live-scene agent-live-scene--review workflow-advance-shared__scene"
      aria-live="polite"
    >
      <AgentWorkflowNavigation active={isConversation ? "Pipeline" : "Matches"} matchesCount={ILLUSTRATIVE_MATCHES.length} />

      <div className="agent-live-review__toolbar workflow-advance-shared__toolbar">
        <button type="button" className="agent-live-review__back" onClick={() => onGoToPhase?.("match-rationale")}>
          <ArrowLeft /> Match details
        </button>
        <div className="agent-live-review__tabs" role="tablist" aria-label="Advance matched property">
          <button type="button" role="tab" aria-selected={false} onClick={() => onGoToPhase?.("property-overview")}>Property</button>
          <button type="button" role="tab" aria-selected={false} onClick={() => onGoToPhase?.("financial-comparison")}>Financials</button>
          <button type="button" role="tab" aria-selected={false} onClick={() => onGoToPhase?.("match-rationale")}>Why it fits</button>
          <button type="button" role="tab" aria-selected={isContact || isConversation} onClick={() => onGoToPhase?.("listing-agent")}>Contact agent</button>
        </div>
      </div>

      <div className="agent-live-review__panels workflow-advance-shared__panels">
        <section className="agent-live-review__panel agent-live-review__panel--contact" aria-hidden={!isContact}>
          <div className="agent-live-contact__heading">
            <div><small>Verified listing agent</small><h3>Reach the agent for this property</h3></div>
            <span><i /> Available</span>
          </div>
          <div className="agent-live-contact__card">
            <div className="agent-live-contact__identity">
              <span>{ILLUSTRATIVE_LISTING_AGENT.initials}</span>
              <div><strong>{ILLUSTRATIVE_LISTING_AGENT.name}</strong><p>{ILLUSTRATIVE_LISTING_AGENT.brokerage}</p><small>Verified listing agent</small></div>
            </div>
            <div className="agent-live-contact__property">
              <img src={selectedMatch.image} alt="" />
              <span><small>Regarding</small><strong>{selectedMatch.address}</strong><p>{selectedMatch.price} · {selectedMatch.market}</p></span>
            </div>
            <div className="agent-live-contact__actions">
              <button type="button" className="agent-live-contact__primary" onClick={() => onGoToPhase?.("conversation-open")}>
                <Mail /> Start agent conversation <ArrowRight />
              </button>
            </div>
          </div>
          <div className="agent-live-contact__note">
            <ShieldCheck />
            <span><small>No approval step</small><strong>Verified agents can begin the conversation immediately. Client contact details are not shared automatically.</strong></span>
          </div>
        </section>

        <section className="agent-live-review__panel agent-live-review__panel--conversation" aria-hidden={!isConversation}>
          <div className="agent-live-thread">
            <div className="agent-live-thread__header">
              <span>{ILLUSTRATIVE_LISTING_AGENT.initials}</span>
              <div><small>Conversation with listing agent</small><strong>{ILLUSTRATIVE_LISTING_AGENT.name}</strong><p>{selectedMatch.address} · {selectedMatch.market}</p></div>
              <i><CircleCheck /> Agents connected</i>
            </div>
            <div className="agent-live-thread__body">
              <div className="agent-live-thread__notice"><ShieldCheck /> Verified agent-to-agent conversation · client contact information is protected</div>
              {visualPhase === "sent" && (
                <div className="agent-live-thread__message"><span>You</span><p>{ILLUSTRATIVE_OPENING_MESSAGE}</p><small>Just now · Delivered</small></div>
              )}
            </div>
            <div className="agent-live-thread__composer" data-message-state={visualPhase}>
              <span>{visualPhase === "typing" ? ILLUSTRATIVE_OPENING_MESSAGE : "Write a message…"}</span>
              <button type="button" aria-label={`Send message to ${ILLUSTRATIVE_LISTING_AGENT.name}`} onClick={() => onGoToPhase?.("message-sent")}><Send /></button>
            </div>
            {visualPhase === "sent" && (
              <div className="agent-live-thread__complete"><CircleCheck /> Conversation started. The opportunity moved to In Conversation in the pipeline.</div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export function AgentWorkflowAdvanceDemo() {
  const playback = useAgentWorkflowPlayback("advance");
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);

  return (
    <AgentWorkflowFrame
      stageRef={playback.stageRef}
      phaseId={playback.phase.id}
      visualPhase={getAgentWorkflowAdvanceVisualPhase(playback.phase.id)}
      cycle={playback.cycle}
      liveClassName="workflow-discover-live workflow-discover-shared workflow-review-live workflow-review-shared workflow-advance-live workflow-advance-shared"
      ariaLabel="Animated listing-agent conversation workflow"
      workspace={`${ILLUSTRATIVE_CLIENT.name} · 184 River Avenue`}
      privacy="Verified agents only"
      eyebrow="Advance the opportunity"
      heading="Move from a reviewed match into an agent conversation"
      status={playback.phase.label}
      disclosure="Illustrative property and conversation data · verified agent workflow"
    >
      <AgentWorkflowAdvanceScenes
        phase={playback.phase.id}
        selectedMatchIndex={selectedMatchIndex}
        onSelectMatch={setSelectedMatchIndex}
        onGoToPhase={playback.goToPhase}
      />
    </AgentWorkflowFrame>
  );
}
