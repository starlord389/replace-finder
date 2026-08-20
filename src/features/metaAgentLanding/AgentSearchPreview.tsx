import { useEffect, useState } from "react";
import { Check, CircleCheck, MapPin, Radar, UserRound } from "lucide-react";
import { AgentWorkflowAdvanceScenes } from "@/features/metaAgentLanding/AgentWorkflowAdvanceSegment";
import { AgentWorkflowBuildScenes } from "@/features/metaAgentLanding/AgentWorkflowBuildSegment";
import { AgentWorkflowDiscoverScenes } from "@/features/metaAgentLanding/AgentWorkflowDiscoverSegment";
import { AgentWorkflowReviewScenes } from "@/features/metaAgentLanding/AgentWorkflowReviewSegment";
import {
  CURRENT_PROPERTY,
  ILLUSTRATIVE_CLIENT,
  ILLUSTRATIVE_MATCHES,
} from "@/features/metaAgentLanding/agentWorkflowData";
import {
  getAgentWorkflowAdvanceVisualPhase,
  getAgentWorkflowBuildVisualPhase,
  type AgentWorkflowPhaseId,
} from "@/features/metaAgentLanding/agentWorkflowStory";
import { useAgentWorkflowPlayback } from "@/features/metaAgentLanding/useAgentWorkflowPlayback";

type LivePhase =
  | "request"
  | "analyzing"
  | "results"
  | "property"
  | "financials"
  | "match"
  | "contact"
  | "conversation"
  | "typing"
  | "sent"
  | "published";

const BUILD_PHASES: readonly AgentWorkflowPhaseId[] = [
  "property-details",
  "financial-details",
  "replacement-criteria",
  "listing-review",
  "listing-published",
];

const MANUAL_PHASES: Record<Exclude<LivePhase, "request" | "published">, AgentWorkflowPhaseId> = {
  analyzing: "calculating-position",
  results: "matches",
  property: "property-overview",
  financials: "financial-comparison",
  match: "match-rationale",
  contact: "listing-agent",
  conversation: "conversation-open",
  typing: "message-typing",
  sent: "message-sent",
};

function heroVisualPhase(phase: AgentWorkflowPhaseId): LivePhase {
  if (BUILD_PHASES.includes(phase)) return getAgentWorkflowBuildVisualPhase(phase);
  if (phase === "calculating-position" || phase === "evaluating-network") return "analyzing";
  if (phase === "matches" || phase === "opening-match") return "results";
  if (phase === "property-overview") return "property";
  if (phase === "financial-comparison") return "financials";
  if (phase === "match-rationale") return "match";
  return getAgentWorkflowAdvanceVisualPhase(phase);
}

export function AgentSearchPreview() {
  const playback = useAgentWorkflowPlayback("full");
  const workflowPhase = playback.phase.id;
  const livePhase = heroVisualPhase(workflowPhase);
  const isBuildPhase = playback.phase.stage === "build";
  const isDiscoverPhase = playback.phase.stage === "discover";
  const isReviewPhase = playback.phase.stage === "review";
  const isAdvancePhase = playback.phase.stage === "advance";
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);

  useEffect(() => setSelectedMatchIndex(0), [playback.cycle]);

  const hasResults = !["request", "analyzing"].includes(livePhase);
  const setManualPhase = (phase: LivePhase) => {
    if (phase === "request") return playback.goToPhase("property-details");
    if (phase === "published") return playback.goToPhase("listing-published");
    playback.goToPhase(MANUAL_PHASES[phase]);
  };
  const workspace = isBuildPhase
    ? `${ILLUSTRATIVE_CLIENT.name} · New listing`
    : isAdvancePhase
      ? `${ILLUSTRATIVE_CLIENT.name} · 184 River Avenue`
      : `${ILLUSTRATIVE_CLIENT.name} · Matches`;

  return (
    <div ref={playback.stageRef} className="agent-console-stage">
      <figure aria-labelledby="agent-search-preview-caption" className="agent-console" data-workflow-phase={workflowPhase}>
        <figcaption id="agent-search-preview-caption" className="agent-console__topbar">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="agent-console__workspace">{workspace}</span>
          <span className="agent-console__privacy">{isAdvancePhase ? "Agents only" : "Agent workspace"}</span>
        </figcaption>

        <div
          key={playback.cycle}
          className={`agent-live-demo agent-workflow-master${isBuildPhase ? " workflow-build-live" : ""}${isDiscoverPhase ? " workflow-build-live workflow-discover-live workflow-discover-shared" : ""}${isReviewPhase ? " workflow-discover-live workflow-discover-shared workflow-review-live workflow-review-shared" : ""}${isAdvancePhase ? " workflow-discover-live workflow-discover-shared workflow-review-live workflow-review-shared workflow-advance-live workflow-advance-shared" : ""}`}
          data-live-phase={livePhase}
          data-workflow-phase={workflowPhase}
          data-workflow-stage={playback.phase.stage}
          aria-label="Illustrative live replacement-property matching workflow"
        >
          <div className="agent-live-demo__camera">
            <aside className="agent-live-demo__inbox">
              <div className="agent-live-demo__inbox-heading">
                <div><small>Active client workspace</small><strong>{ILLUSTRATIVE_CLIENT.name}</strong></div>
                <span className="agent-live-demo__active"><i /> Active</span>
              </div>
              <article className="agent-live-client-summary">
                <div className="agent-live-client-summary__heading"><span>{ILLUSTRATIVE_CLIENT.initials}</span><div><small>Riverside exchange</small><strong>42 days remaining</strong></div></div>
                <div className="agent-live-client-summary__property"><img src={CURRENT_PROPERTY.image} alt={`${CURRENT_PROPERTY.address} property`} /><div><small>Current property</small><strong>{CURRENT_PROPERTY.address}</strong><p><MapPin /> {CURRENT_PROPERTY.market}</p></div></div>
                <dl><div><dt>Estimated equity</dt><dd>{CURRENT_PROPERTY.equity}</dd></div><div><dt>Buying range</dt><dd>Up to {CURRENT_PROPERTY.buyingRange}</dd></div></dl>
              </article>
              <article className="agent-live-search-brief">
                <div className="agent-live-search-brief__label"><span>Search brief</span><time>Ready</time></div>
                <strong>Find a stronger replacement for this client</strong>
                <ul><li><Check /> Within the {CURRENT_PROPERTY.buyingRange} buying range</li><li><Check /> Must improve the current {CURRENT_PROPERTY.roe} ROE</li><li><Check /> New England income property</li></ul>
                <div className="agent-live-search-brief__status">
                  {(livePhase === "request" || livePhase === "published") && <><i /> Search brief ready</>}
                  {livePhase === "analyzing" && <><Radar /> Ranking replacements</>}
                  {hasResults && <><CircleCheck /> 2 options ready</>}
                </div>
              </article>
            </aside>

            <section className="agent-live-demo__workspace">
              <div className="agent-live-demo__workspace-heading">
                <div>
                  <small>{isBuildPhase ? "Create a listing" : isDiscoverPhase ? "Automatic matching" : isReviewPhase ? "Review the matches" : "Advance the opportunity"}</small>
                  <strong>{isBuildPhase ? "Add the property, exchange criteria, and publish" : isDiscoverPhase ? "Calculate the exchange position and surface matches" : isReviewPhase ? "Understand the property, financial improvement, and match reasoning" : "Move from a reviewed match into an agent conversation"}</strong>
                </div>
                <span><i /> {playback.phase.label}</span>
              </div>
              <div className="agent-live-demo__request-line"><span><UserRound /></span><p><small>Client objective</small><strong>Improve the return from {CURRENT_PROPERTY.address}</strong></p><div><small>Buying range</small><strong>Up to {CURRENT_PROPERTY.buyingRange}</strong></div></div>
              <div className="agent-live-demo__canvas">
                {isBuildPhase && <AgentWorkflowBuildScenes phase={workflowPhase} />}
                {isDiscoverPhase && <AgentWorkflowDiscoverScenes phase={workflowPhase} onSelectMatch={(index) => { setSelectedMatchIndex(index); setManualPhase("property"); }} />}
                {isReviewPhase && <AgentWorkflowReviewScenes phase={workflowPhase} selectedMatchIndex={selectedMatchIndex} onSelectMatch={setSelectedMatchIndex} onGoToPhase={playback.goToPhase} />}
                {isAdvancePhase && <AgentWorkflowAdvanceScenes phase={workflowPhase} selectedMatchIndex={selectedMatchIndex} onSelectMatch={setSelectedMatchIndex} onGoToPhase={playback.goToPhase} />}
              </div>
            </section>
          </div>
        </div>
        <div className="agent-console__disclosure">Illustrative property data · real property photography · no real client information</div>
      </figure>
    </div>
  );
}
