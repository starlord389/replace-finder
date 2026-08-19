import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { AgentWorkflowDiscoverScenes } from "@/features/metaAgentLanding/AgentWorkflowDiscoverSegment";
import {
  AgentWorkflowFrame,
  AgentWorkflowNavigation,
} from "@/features/metaAgentLanding/AgentWorkflowFoundation";
import {
  CURRENT_PROPERTY,
  ILLUSTRATIVE_CLIENT,
  ILLUSTRATIVE_MATCHES,
} from "@/features/metaAgentLanding/agentWorkflowData";
import {
  getAgentWorkflowReviewVisualPhase,
  type AgentWorkflowPhaseId,
} from "@/features/metaAgentLanding/agentWorkflowStory";
import { useAgentWorkflowPlayback } from "@/features/metaAgentLanding/useAgentWorkflowPlayback";

type ReviewScenesProps = {
  phase: AgentWorkflowPhaseId;
  selectedMatchIndex?: number;
  onSelectMatch?: (index: number) => void;
  onGoToPhase?: (phase: AgentWorkflowPhaseId) => void;
};

export function AgentWorkflowReviewScenes({
  phase,
  selectedMatchIndex = 0,
  onSelectMatch,
  onGoToPhase,
}: ReviewScenesProps) {
  const selectedMatch = ILLUSTRATIVE_MATCHES[selectedMatchIndex] ?? ILLUSTRATIVE_MATCHES[0];
  const visualPhase = getAgentWorkflowReviewVisualPhase(phase);
  const isDetail = ["property", "financials", "match"].includes(visualPhase);
  const openMatch = (index: number) => {
    onSelectMatch?.(index);
    onGoToPhase?.("property-overview");
  };

  return (
    <>
      <AgentWorkflowDiscoverScenes
        phase={phase}
        onSelectMatch={(index) => openMatch(index)}
      />

      <section
        className="agent-live-scene agent-live-scene--review workflow-review-shared__scene workflow-review-shared__scene--detail"
        aria-hidden={!isDetail}
      >
        <AgentWorkflowNavigation active="Matches" matchesCount={ILLUSTRATIVE_MATCHES.length} />
        <div className="agent-live-review__toolbar workflow-review-shared__toolbar">
          <button type="button" className="agent-live-review__back" onClick={() => onGoToPhase?.("matches")}>
            <ArrowLeft /> All matched properties
          </button>
          <div className="agent-live-review__tabs" role="tablist" aria-label="Matched property review">
            <button type="button" role="tab" aria-selected={visualPhase === "property"} onClick={() => onGoToPhase?.("property-overview")}>Property</button>
            <button type="button" role="tab" aria-selected={visualPhase === "financials"} onClick={() => onGoToPhase?.("financial-comparison")}>Financial comparison</button>
            <button type="button" role="tab" aria-selected={visualPhase === "match"} onClick={() => onGoToPhase?.("match-rationale")}>Why it fits</button>
          </div>
        </div>

        <div className="agent-live-review__panels workflow-review-shared__panels">
          <section className="agent-live-review__panel agent-live-review__panel--property" aria-hidden={visualPhase !== "property"}>
            <div className="agent-live-property-overview__media">
              <img src={selectedMatch.image} alt={`${selectedMatch.address} property`} />
              <span>{selectedMatch.type}</span>
            </div>
            <div className="agent-live-property-overview__body">
              <div className="agent-live-property-overview__heading">
                <div><small>Matched property</small><h3>{selectedMatch.address}</h3><p><MapPin /> {selectedMatch.market}</p></div>
                <span><strong>{selectedMatch.score}</strong><small>match</small></span>
              </div>
              <p className="workflow-review-shared__description">{selectedMatch.description}</p>
              <dl>
                <div><dt>Asking price</dt><dd>{selectedMatch.price}</dd></div>
                <div><dt>Cap rate</dt><dd>{selectedMatch.capRate}</dd></div>
                <div><dt>Annual NOI</dt><dd>{selectedMatch.noi}</dd></div>
                <div><dt>Asset type</dt><dd>{selectedMatch.type}</dd></div>
              </dl>
              <div className="agent-live-property-overview__location"><MapPin /><span><small>Location fit</small><strong>{selectedMatch.market} · Inside the client’s preferred area</strong></span></div>
            </div>
          </section>

          <section className="agent-live-review__panel agent-live-review__panel--financials" aria-hidden={visualPhase !== "financials"}>
            <div className="agent-live-comparison">
              <div className="agent-live-comparison__heading">
                <div><small>Current property compared with matched property</small><h4>{CURRENT_PROPERTY.address} vs. {selectedMatch.address}</h4></div>
                <span><CheckCircle2 /> {selectedMatch.roeImprovement} projected ROE</span>
              </div>
              <div className="agent-live-comparison__labels"><span>Metric</span><span>Current</span><span>Matched</span><span>Change</span></div>
              <ReviewComparisonRow label="Property value" current={CURRENT_PROPERTY.value} replacement={selectedMatch.price} change={selectedMatch.valueIncrease} />
              <ReviewComparisonRow label="Annual NOI" current={CURRENT_PROPERTY.noi} replacement={selectedMatch.noi} change={selectedMatch.noiChange} />
              <ReviewComparisonRow label="Loan / LTV" current={`${CURRENT_PROPERTY.loan} · ${CURRENT_PROPERTY.ltv}`} replacement={`${selectedMatch.loan} · ${selectedMatch.ltv}`} change="Within 75%" />
              <ReviewComparisonRow label="Cash flow / ROE" current={`${CURRENT_PROPERTY.cashFlow} · ${CURRENT_PROPERTY.roe}`} replacement={`${selectedMatch.cashFlow} · ${selectedMatch.roe}`} change={selectedMatch.roeImprovement} />
            </div>
            <div className="agent-live-financials__outcome"><CheckCircle2 /><span><small>Financial result</small><strong>Projected ROE improves from {CURRENT_PROPERTY.roe} to {selectedMatch.roe} while the property remains inside the {CURRENT_PROPERTY.buyingRange} purchasing capacity.</strong></span></div>
          </section>

          <section className="agent-live-review__panel agent-live-review__panel--match" aria-hidden={visualPhase !== "match"}>
            <div className="agent-live-match-explainer__heading">
              <div><small>Why this match fits</small><h3>{selectedMatch.address} passed every required check</h3></div>
              <span>{selectedMatch.score} match</span>
            </div>
            <div className="agent-live-match-explainer__grid">
              <article><small>Financial and search fit</small><ul>
                <li><CheckCircle2 /><span><strong>Affordable trade-up</strong><small>{selectedMatch.price} is within the {CURRENT_PROPERTY.buyingRange} purchasing capacity</small></span></li>
                <li><CheckCircle2 /><span><strong>Better projected return</strong><small>{CURRENT_PROPERTY.roe} current ROE → {selectedMatch.roe} projected ROE</small></span></li>
                <li><CheckCircle2 /><span><strong>Financing remains inside the limit</strong><small>{selectedMatch.loan} replacement loan · {selectedMatch.ltv} LTV</small></span></li>
                <li><CheckCircle2 /><span><strong>Matches the client’s criteria</strong><small>{selectedMatch.type} · {selectedMatch.market}</small></span></li>
              </ul></article>
              <aside><small>Agent review result</small><h4>Worth presenting</h4><div className="workflow-review-live__score"><strong>{selectedMatch.score}</strong><span>match score</span></div><p><strong>{selectedMatch.roeImprovement}</strong><span>projected ROE improvement</span></p><p><strong>{selectedMatch.cashFlowChange}</strong><span>projected annual cash-flow change</span></p></aside>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}

function ReviewComparisonRow({ label, current, replacement, change }: { label: string; current: string; replacement: string; change: string }) {
  return <div className="agent-live-comparison__row"><strong>{label}</strong><span>{current}</span><span>{replacement}</span><b>{change}</b></div>;
}

export function AgentWorkflowReviewDemo() {
  const playback = useAgentWorkflowPlayback("review");
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);

  return (
    <AgentWorkflowFrame
      stageRef={playback.stageRef}
      phaseId={playback.phase.id}
      visualPhase={getAgentWorkflowReviewVisualPhase(playback.phase.id)}
      cycle={playback.cycle}
      liveClassName="workflow-discover-live workflow-discover-shared workflow-review-live workflow-review-shared"
      ariaLabel="Animated matched-property review and financial comparison preview"
      workspace={`${ILLUSTRATIVE_CLIENT.name} · Matches`}
      privacy="Agent workspace"
      eyebrow="Review the matches"
      heading="Understand the property, financial improvement, and match reasoning"
      status={playback.phase.label}
      disclosure="Illustrative property and financing data · agent review workflow"
    >
      <AgentWorkflowReviewScenes
        phase={playback.phase.id}
        selectedMatchIndex={selectedMatchIndex}
        onSelectMatch={setSelectedMatchIndex}
        onGoToPhase={playback.goToPhase}
      />
    </AgentWorkflowFrame>
  );
}
