import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Mail,
  MapPin,
  Radar,
  Send,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  CURRENT_PROPERTY,
  ILLUSTRATIVE_CLIENT,
  ILLUSTRATIVE_MATCHES,
} from "@/features/metaAgentLanding/agentWorkflowData";
import {
  AgentWorkflowBuildScenes,
} from "@/features/metaAgentLanding/AgentWorkflowBuildSegment";
import { AgentWorkflowDiscoverScenes } from "@/features/metaAgentLanding/AgentWorkflowDiscoverSegment";
import {
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
  sent: "message-sent",
};

function heroVisualPhase(phase: AgentWorkflowPhaseId): LivePhase {
  if (BUILD_PHASES.includes(phase)) return getAgentWorkflowBuildVisualPhase(phase);
  if (phase === "calculating-position" || phase === "evaluating-network") return "analyzing";
  if (phase === "matches" || phase === "opening-match") return "results";
  if (phase === "property-overview") return "property";
  if (phase === "financial-comparison") return "financials";
  if (phase === "match-rationale") return "match";
  if (phase === "contact-tab" || phase === "listing-agent") return "contact";
  if (phase === "conversation-open" || phase === "message-typing") return "conversation";
  return "sent";
}

export function AgentSearchPreview() {
  const playback = useAgentWorkflowPlayback("full");
  const workflowPhase = playback.phase.id;
  const livePhase = heroVisualPhase(workflowPhase);
  const isBuildPhase = playback.phase.stage === "build";
  const isDiscoverPhase = playback.phase.stage === "discover";
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const selectedMatch = ILLUSTRATIVE_MATCHES[selectedMatchIndex];

  useEffect(() => {
    setSelectedMatchIndex(0);
  }, [playback.cycle]);

  const isReviewing = ["property", "financials", "match", "contact", "conversation", "sent"].includes(livePhase);
  const hasResults = !["request", "analyzing"].includes(livePhase);
  const setManualPhase = (phase: LivePhase) => {
    if (phase === "request") {
      playback.goToPhase("property-details");
      return;
    }
    if (phase === "published") {
      playback.goToPhase("listing-published");
      return;
    }
    playback.goToPhase(MANUAL_PHASES[phase]);
  };

  return (
    <div ref={playback.stageRef} className="agent-console-stage">
      <figure aria-labelledby="agent-search-preview-caption" className="agent-console" data-workflow-phase={workflowPhase}>
        <figcaption id="agent-search-preview-caption" className="agent-console__topbar">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="agent-console__workspace">{isBuildPhase ? `${ILLUSTRATIVE_CLIENT.name} · New listing` : isDiscoverPhase ? `${ILLUSTRATIVE_CLIENT.name} · Matches` : "Riverside exchange"}</span>
          <span className="agent-console__privacy">Private agent workspace</span>
        </figcaption>

        <div
          key={playback.cycle}
          className={`agent-live-demo agent-workflow-master${isBuildPhase ? " workflow-build-live" : ""}${isDiscoverPhase ? " workflow-build-live workflow-discover-live workflow-discover-shared" : ""}`}
          data-live-phase={livePhase}
          data-workflow-phase={workflowPhase}
          data-workflow-stage={playback.phase.stage}
          aria-label="Illustrative live replacement-property matching workflow"
        >
          <div className="agent-live-demo__camera">
            <aside className="agent-live-demo__inbox">
            <div className="agent-live-demo__inbox-heading">
              <div><small>Active client workspace</small><strong>Elaine Thomas</strong></div>
              <span className="agent-live-demo__active"><i /> Active</span>
            </div>

            <article className="agent-live-client-summary">
              <div className="agent-live-client-summary__heading">
                <span>ET</span>
                <div><small>Riverside exchange</small><strong>42 days remaining</strong></div>
              </div>
              <div className="agent-live-client-summary__property">
                <img src="/mf-4.jpg" alt={`${CURRENT_PROPERTY.address} property`} />
                <div><small>Property being sold</small><strong>{CURRENT_PROPERTY.address}</strong><p><MapPin /> {CURRENT_PROPERTY.market}</p></div>
              </div>
              <dl>
                <div><dt>Estimated equity</dt><dd>{CURRENT_PROPERTY.equity}</dd></div>
                <div><dt>Buying range</dt><dd>Up to {CURRENT_PROPERTY.buyingRange}</dd></div>
              </dl>
            </article>

            <article className="agent-live-search-brief">
              <div className="agent-live-search-brief__label"><span>Search brief</span><time>Ready</time></div>
              <strong>Find a stronger replacement for this client</strong>
              <ul>
                <li><Check /> Within the {CURRENT_PROPERTY.buyingRange} buying range</li>
                <li><Check /> Must improve the current {CURRENT_PROPERTY.roe} ROE</li>
                <li><Check /> New England income property</li>
              </ul>
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
                <small>{isBuildPhase ? "Create a listing" : isDiscoverPhase ? "Automatic matching" : "Replacement search"}</small>
                <strong>{isBuildPhase ? "Add the property, exchange criteria, and publish" : isDiscoverPhase ? "Calculate the exchange position and surface matches" : "Riverside exchange"}</strong>
              </div>
              <span><i /> {isBuildPhase || isDiscoverPhase ? playback.phase.label : isReviewing ? (livePhase === "sent" ? "Agent contacted" : "Reviewing match") : "Search always on"}</span>
            </div>

            <div className="agent-live-demo__request-line">
              <span><UserRound /></span>
              <p><small>Client objective</small><strong>Improve the return from {CURRENT_PROPERTY.address}</strong></p>
              <div><small>Buying range</small><strong>Up to {CURRENT_PROPERTY.buyingRange}</strong></div>
            </div>

            <div className="agent-live-demo__canvas">
              {isBuildPhase && <AgentWorkflowBuildScenes phase={workflowPhase} />}
              {isDiscoverPhase && (
                <AgentWorkflowDiscoverScenes
                  phase={workflowPhase}
                  onSelectMatch={(index) => {
                    setSelectedMatchIndex(index);
                    setManualPhase("property");
                  }}
                />
              )}

              <section className="agent-live-scene agent-live-scene--review" aria-live="polite">
                <div className="agent-live-review__toolbar">
                  <button type="button" className="agent-live-review__back" onClick={() => setManualPhase("results")}><ArrowLeft /> All matches</button>
                  <div className="agent-live-review__tabs" role="tablist" aria-label="Property review">
                    <button type="button" role="tab" aria-selected={livePhase === "property"} onClick={() => setManualPhase("property")}>Property</button>
                    <button type="button" role="tab" aria-selected={livePhase === "financials"} onClick={() => setManualPhase("financials")}>Financials</button>
                    <button type="button" role="tab" aria-selected={livePhase === "match"} onClick={() => setManualPhase("match")}>Why it fits</button>
                    <button type="button" role="tab" aria-selected={["contact", "conversation", "sent"].includes(livePhase)} onClick={() => setManualPhase("contact")}>Contact agent</button>
                  </div>
                </div>

                <div className="agent-live-review__panels">
                  <section className="agent-live-review__panel agent-live-review__panel--property">
                    <div className="agent-live-property-overview__media">
                      <img src={selectedMatch.image} alt={`${selectedMatch.address} property`} />
                      <span>{selectedMatch.type}</span>
                    </div>
                    <div className="agent-live-property-overview__body">
                      <div className="agent-live-property-overview__heading">
                        <div><small>Property details</small><h3>{selectedMatch.address}</h3><p><MapPin /> {selectedMatch.market}</p></div>
                        <span><strong>{selectedMatch.score}</strong><small>match</small></span>
                      </div>
                      <dl>
                        <div><dt>Asking price</dt><dd>{selectedMatch.price}</dd></div>
                        <div><dt>Cap rate</dt><dd>{selectedMatch.capRate}</dd></div>
                        <div><dt>Annual NOI</dt><dd>{selectedMatch.noi}</dd></div>
                        <div><dt>Asset type</dt><dd>{selectedMatch.type}</dd></div>
                      </dl>
                      <div className="agent-live-property-overview__location"><MapPin /><span><small>Location</small><strong>{selectedMatch.market} · Inside the client’s target area</strong></span></div>
                    </div>
                  </section>

                  <section className="agent-live-review__panel agent-live-review__panel--financials">
                    <div className="agent-live-comparison">
                      <div className="agent-live-comparison__heading"><div><small>Modeled at 7.0% · 25-year amortization</small><h4>{CURRENT_PROPERTY.address} vs. {selectedMatch.address}</h4></div><span><TrendingUp /> {selectedMatch.cashFlowChange} cash flow</span></div>
                      <div className="agent-live-comparison__labels"><span>Metric</span><span>Current</span><span>Replacement</span><span>Change</span></div>
                      <ComparisonRow label="Property value" current={CURRENT_PROPERTY.value} replacement={selectedMatch.price} change={selectedMatch.valueIncrease} />
                      <ComparisonRow label="Loan / LTV" current={`${CURRENT_PROPERTY.loan} · ${CURRENT_PROPERTY.ltv}`} replacement={`${selectedMatch.loan} · ${selectedMatch.ltv}`} change="≤ 75%" />
                      <ComparisonRow label="NOI" current={CURRENT_PROPERTY.noi} replacement={selectedMatch.noi} change={selectedMatch.noiChange} />
                      <ComparisonRow label="Debt service" current={CURRENT_PROPERTY.debtService} replacement={selectedMatch.debtService} change="Modeled" />
                      <ComparisonRow label="Cash flow / ROE" current={`${CURRENT_PROPERTY.cashFlow} · ${CURRENT_PROPERTY.roe}`} replacement={`${selectedMatch.cashFlow} · ${selectedMatch.roe}`} change={selectedMatch.roeImprovement} />
                    </div>
                    <div className="agent-live-financials__outcome"><CircleCheck /><span><small>Math check</small><strong>{selectedMatch.noi} NOI − {selectedMatch.debtService} debt service = {selectedMatch.cashFlow} cash flow · {selectedMatch.cashFlow} ÷ {selectedMatch.equity} equity = {selectedMatch.roe} ROE</strong></span></div>
                  </section>

                  <section className="agent-live-review__panel agent-live-review__panel--match">
                    <div className="agent-live-match-explainer__heading"><div><small>Exchange IQ™ rationale</small><h3>Why {selectedMatch.address} qualifies</h3></div><span>{selectedMatch.score} match</span></div>
                    <div className="agent-live-match-explainer__grid">
                      <article>
                        <small>Financial fit</small>
                        <ul>
                          <li><CircleCheck /><span><strong>Affordable trade-up</strong><small>{selectedMatch.price} is within the {CURRENT_PROPERTY.buyingRange} capacity</small></span></li>
                          <li><CircleCheck /><span><strong>Improves return on equity</strong><small>{CURRENT_PROPERTY.roe} → {selectedMatch.roe} ({selectedMatch.roeImprovement})</small></span></li>
                          <li><CircleCheck /><span><strong>Financing stays within policy</strong><small>{selectedMatch.loan} loan · {selectedMatch.ltv} LTV</small></span></li>
                          <li><ShieldCheck /><span><strong>{selectedMatch.estimatedBoot} estimated boot</strong><small>All {CURRENT_PROPERTY.equity} of equity is reinvested; replacement debt exceeds current debt</small></span></li>
                        </ul>
                      </article>
                      <aside>
                        <small>Location fit</small>
                        <h4>{selectedMatch.market}</h4>
                        <div className="agent-live-location-route"><i /><span /><i /></div>
                        <p><strong>{CURRENT_PROPERTY.market}</strong><span>Current property</span></p>
                        <p><strong>{selectedMatch.market}</strong><span>Target market match</span></p>
                      </aside>
                    </div>
                  </section>

                  <section className="agent-live-review__panel agent-live-review__panel--contact">
                    <div className="agent-live-contact__heading"><div><small>Listing representative</small><h3>Reach the agent for this property</h3></div><span><i /> Available</span></div>
                    <div className="agent-live-contact__card">
                      <div className="agent-live-contact__identity"><span>JL</span><div><strong>Jordan Lee</strong><p>Northeast Commercial Realty</p><small>Listing agent for {selectedMatch.address}</small></div></div>
                      <div className="agent-live-contact__property"><img src={selectedMatch.image} alt="" /><span><small>Regarding</small><strong>{selectedMatch.address}</strong><p>{selectedMatch.price} · {selectedMatch.market}</p></span></div>
                      <div className="agent-live-contact__actions"><button type="button" className="agent-live-contact__primary" onClick={() => setManualPhase("conversation")}><Mail /> Contact listing agent <ArrowRight /></button></div>
                    </div>
                    <div className="agent-live-contact__note"><CircleCheck /><span><small>You stay in control</small><strong>Your client’s details remain private until you choose to share them.</strong></span></div>
                  </section>

                  <section className="agent-live-review__panel agent-live-review__panel--conversation">
                    <div className="agent-live-thread">
                      <div className="agent-live-thread__header">
                        <span>JL</span>
                        <div><small>Conversation with listing agent</small><strong>Jordan Lee</strong><p>{selectedMatch.address} · {selectedMatch.market}</p></div>
                        <i><CircleCheck /> Agents connected</i>
                      </div>
                      <div className="agent-live-thread__body">
                        <div className="agent-live-thread__notice"><ShieldCheck /> Agent-to-agent conversation · client information stays private</div>
                        {livePhase === "sent" && (
                          <div className="agent-live-thread__message"><span>You</span><p>Hi Jordan—my client is reviewing {selectedMatch.address} as a replacement. Could you share the OM and latest T-12?</p><small>Just now · Delivered</small></div>
                        )}
                      </div>
                      <div className="agent-live-thread__composer" data-message-state={livePhase === "sent" ? "sent" : "typing"}>
                        <span>{livePhase === "sent" ? "Write a message…" : `Hi Jordan—my client is reviewing ${selectedMatch.address} as a replacement. Could you share the OM and latest T-12?`}</span>
                        <button type="button" aria-label="Send message to Jordan Lee" onClick={() => setManualPhase("sent")}><Send /></button>
                      </div>
                      {livePhase === "sent" && <div className="agent-live-thread__complete"><CircleCheck /> Message sent. The agent conversation is now in your pipeline.</div>}
                    </div>
                  </section>
                </div>
              </section>
            </div>
            </section>
          </div>

        </div>

        <div className="agent-console__disclosure">Illustrative property data · real property photography · no real client information</div>
      </figure>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  replacement,
  change,
}: {
  label: string;
  current: string;
  replacement: string;
  change: string;
}) {
  return (
    <div className="agent-live-comparison__row">
      <strong>{label}</strong><span>{current}</span><span>{replacement}</span><b>{change}</b>
    </div>
  );
}
