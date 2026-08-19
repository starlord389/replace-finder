import {
  ArrowRight,
  Check,
  CircleCheck,
  MapPin,
  Radar,
  Sparkles,
} from "lucide-react";
import { AgentWorkflowPublishedScene } from "@/features/metaAgentLanding/AgentWorkflowBuildSegment";
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
  getAgentWorkflowDiscoverVisualPhase,
  type AgentWorkflowPhaseId,
} from "@/features/metaAgentLanding/agentWorkflowStory";
import { useAgentWorkflowPlayback } from "@/features/metaAgentLanding/useAgentWorkflowPlayback";

type DiscoverScenesProps = {
  phase: AgentWorkflowPhaseId;
  onSelectMatch?: (index: number) => void;
};

export function AgentWorkflowDiscoverScenes({ phase, onSelectMatch }: DiscoverScenesProps) {
  const isCalculating = phase === "calculating-position";
  const isEvaluating = phase === "evaluating-network";
  const isMatches = phase === "matches" || phase === "opening-match";
  const isOpeningMatch = phase === "opening-match";

  return (
    <>
      <AgentWorkflowPublishedScene active={phase === "listing-published"} />

      <section
        className="agent-live-scene agent-live-scene--analysis workflow-discover-shared__scene workflow-discover-shared__scene--engine"
        aria-hidden={!isCalculating && !isEvaluating}
      >
        <AgentWorkflowNavigation active="Listings" />
        <div key={phase} className="workflow-discover-shared__engine-body">
          <div className="agent-live-analysis__heading">
            <span>{isCalculating ? <Sparkles /> : <Radar />}</span>
            <div>
              <small>ExchangeUp matching engine</small>
              <h3>{isCalculating ? "Calculating the exchange position" : "Evaluating eligible properties across the network"}</h3>
              <p>{isCalculating ? "Equity, leverage, and current performance establish what can qualify." : "Every candidate must clear the financial rules and the client’s optional criteria."}</p>
            </div>
            <i />
          </div>
          <div className="agent-live-analysis__progress"><span /></div>

          {isCalculating ? (
            <div className="agent-live-analysis__steps">
              <DiscoveryCheck index="01" label="Estimate exchange equity" value={`${CURRENT_PROPERTY.value} value − ${CURRENT_PROPERTY.loan} loan = ${CURRENT_PROPERTY.equity}`} />
              <DiscoveryCheck index="02" label="Calculate purchasing capacity" value={`${CURRENT_PROPERTY.equity} ÷ 25% equity requirement = ${CURRENT_PROPERTY.buyingRange}`} />
              <DiscoveryCheck index="03" label="Establish the return baseline" value={`${CURRENT_PROPERTY.cashFlow} cash flow ÷ ${CURRENT_PROPERTY.equity} equity = ${CURRENT_PROPERTY.roe} ROE`} />
              <DiscoveryCheck index="04" label="Apply the replacement criteria" value="Multifamily · MA, RI, or NH · 75% maximum LTV" />
            </div>
          ) : (
            <div className="workflow-discover-shared__screening">
              <div className="workflow-discover-shared__screening-summary">
                <span><Radar /></span>
                <div><small>Network evaluation</small><strong>7 properties reviewed automatically</strong><p>ExchangeUp is narrowing the network to financially stronger, eligible replacements.</p></div>
              </div>
              <div className="workflow-discover-shared__screening-steps">
                <DiscoveryCheck index="7" label="Available properties" value="Active properties inside the search scope" />
                <DiscoveryCheck index="4" label="Within purchasing capacity" value={`Asking price at or below ${CURRENT_PROPERTY.buyingRange}`} />
                <DiscoveryCheck index="2" label="Higher projected ROE" value={`Both improve on the current ${CURRENT_PROPERTY.roe} return`} />
                <DiscoveryCheck index="2" label="Qualified matches" value="Financial rules and optional criteria passed" />
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className="agent-live-scene agent-live-scene--results workflow-discover-shared__scene workflow-discover-shared__scene--matches"
        aria-hidden={!isMatches}
      >
        <AgentWorkflowNavigation active="Matches" matchesCount={ILLUSTRATIVE_MATCHES.length} />
        <div className="workflow-discover-shared__matches-heading">
          <div><small>{ILLUSTRATIVE_CLIENT.name} · Active search</small><h3>Matched properties</h3></div>
          <span><Radar /> Search remains active</span>
        </div>
        <div className="workflow-discover-shared__filters">
          <span>Current property <strong>{CURRENT_PROPERTY.value}</strong></span>
          <span>Purchasing capacity <strong>{CURRENT_PROPERTY.buyingRange}</strong></span>
          <span>Minimum return <strong>Above {CURRENT_PROPERTY.roe} ROE</strong></span>
        </div>
        <div className="workflow-discover-shared__match-grid">
          {ILLUSTRATIVE_MATCHES.map((match, index) => (
            <article key={match.address} className={isOpeningMatch && index === 0 ? "is-opening" : undefined}>
              {onSelectMatch && <button type="button" aria-label={`Review ${match.address} comparison`} onClick={() => onSelectMatch(index)} />}
              <div className="workflow-discover-shared__match-media">
                <img src={match.image} alt={`${match.address} exterior`} />
                <span>#{index + 1} {index === 0 ? "Best match" : "Strong match"}</span>
                <i><strong>{match.score}</strong><small>match</small></i>
              </div>
              <div className="workflow-discover-shared__match-body">
                <small>{match.type}</small>
                <strong>{match.address}</strong>
                <p><MapPin /> {match.market}</p>
                <dl><div><dt>Asking</dt><dd>{match.price}</dd></div><div><dt>Projected ROE</dt><dd>{match.roe}</dd></div><div><dt>ROE lift</dt><dd>{match.roeImprovement}</dd></div></dl>
              </div>
            </article>
          ))}
        </div>
        <div className="workflow-discover-shared__automatic"><CircleCheck /><span><small>Automatic discovery is still running</small><strong>New qualifying properties will continue appearing in this client’s Matches tab.</strong></span><ArrowRight /></div>
      </section>
    </>
  );
}

function DiscoveryCheck({ index, label, value }: { index: string; label: string; value: string }) {
  return (
    <div className="agent-live-analysis__step">
      <span>{index}</span><div><strong>{label}</strong><small>{value}</small></div><i><Check /></i>
    </div>
  );
}

export function AgentWorkflowDiscoverDemo() {
  const playback = useAgentWorkflowPlayback("discover");
  return (
    <AgentWorkflowFrame
      stageRef={playback.stageRef}
      phaseId={playback.phase.id}
      visualPhase={getAgentWorkflowDiscoverVisualPhase(playback.phase.id)}
      cycle={playback.cycle}
      liveClassName="workflow-build-live workflow-discover-live workflow-discover-shared"
      ariaLabel="Animated automatic replacement-property discovery preview"
      workspace={`${ILLUSTRATIVE_CLIENT.name} · Matches`}
      privacy="Private agent workspace"
      eyebrow="Automatic matching"
      heading="Calculate the exchange position and surface matches"
      status={playback.phase.label}
      disclosure="Illustrative property and financing data · automatic matching workflow"
    >
      <AgentWorkflowDiscoverScenes phase={playback.phase.id} />
    </AgentWorkflowFrame>
  );
}
