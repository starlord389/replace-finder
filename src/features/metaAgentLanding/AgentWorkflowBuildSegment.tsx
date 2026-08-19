import type { CSSProperties } from "react";
import {
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  EyeOff,
  LockKeyhole,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { AgentWorkflowFrame } from "@/features/metaAgentLanding/AgentWorkflowFoundation";
import {
  CURRENT_PROPERTY,
  ILLUSTRATIVE_CLIENT,
} from "@/features/metaAgentLanding/agentWorkflowData";
import {
  getAgentWorkflowBuildVisualPhase,
  type AgentWorkflowPhaseId,
} from "@/features/metaAgentLanding/agentWorkflowStory";
import { useAgentWorkflowPlayback } from "@/features/metaAgentLanding/useAgentWorkflowPlayback";

const BUILD_PROPERTY_FIELDS = [
  ["Street address", CURRENT_PROPERTY.address],
  ["City and state", CURRENT_PROPERTY.market],
  ["Property type", "Multifamily"],
  ["Number of units", "18 units"],
  ["Year built", "1987"],
  ["Asking price", "$2,400,000"],
] as const;

const BUILD_FINANCIAL_FIELDS = [
  ["Gross annual income", "$216,000"],
  ["Operating expenses", "$48,000"],
  ["Annual NOI", "$168,000"],
  ["Current loan balance", "$1,200,000"],
  ["Cap rate", "7.00%"],
  ["Estimated equity", "$1,200,000"],
] as const;

type IntakeFieldProps = {
  label: string;
  value: string;
  index: number;
  typing?: boolean;
  select?: boolean;
  calculated?: boolean;
  optional?: boolean;
};

function IntakeField({ label, value, index, typing = false, select = false, calculated = false, optional = false }: IntakeFieldProps) {
  const style = {
    "--field-delay": `${180 + index * 150}ms`,
    "--typing-steps": Math.max(value.length, 1),
    "--typing-width": `${Math.max(value.length + 1, 5)}ch`,
  } as CSSProperties;

  return (
    <div className={`workflow-intake-field${typing ? " is-typing" : ""}${select ? " is-select" : ""}${calculated ? " is-calculated" : ""}`} style={style}>
      <span>{label}{optional && <em>Optional</em>}</span>
      <div><strong>{value}</strong>{typing && <i aria-hidden="true" />}{select && <b aria-hidden="true">⌄</b>}</div>
      {calculated && <small>Calculated automatically</small>}
    </div>
  );
}

export function AgentWorkflowBuildScenes({ phase }: { phase: AgentWorkflowPhaseId }) {
  return (
    <>
      <section className="agent-live-scene agent-live-scene--request workflow-build-live__scene workflow-build-live__scene--property" aria-hidden={phase !== "property-details"}>
        <div className="workflow-build-live__heading">
          <span><Building2 /></span>
          <div><small>Property information</small><h3>Create the listing for your client’s current property</h3><p>Enter the core property details that buyers and ExchangeUp need.</p></div>
        </div>
        <div className="workflow-build-live__form-card">
          <div className="workflow-build-live__form-toolbar"><span>Property details</span><small>Step 1 of 3</small></div>
          <div className="workflow-build-live__fields">
            {BUILD_PROPERTY_FIELDS.map(([label, value], index) => (
              <IntakeField key={label} label={label} value={value} index={index} typing={[0, 1, 3, 5].includes(index)} select={index === 2} />
            ))}
          </div>
        </div>
        <div className="workflow-build-live__action"><LockKeyhole /> Saved privately while in draft <button type="button" tabIndex={-1}>Continue to financials <ArrowRight /></button></div>
      </section>

      <section className="agent-live-scene agent-live-scene--analysis workflow-build-live__scene workflow-build-live__scene--position" aria-hidden={phase !== "financial-details"}>
        <div className="agent-live-analysis__heading"><span><Calculator /></span><div><small>Listing financials</small><h3>Add the property’s financial information</h3><p>These figures help buyers evaluate the listing and establish the exchange position.</p></div><i /></div>
        <div className="workflow-build-live__form-card">
          <div className="workflow-build-live__form-toolbar"><span>Financial information</span><small>Step 2 of 3</small></div>
          <div className="workflow-build-live__financial-grid">
            {BUILD_FINANCIAL_FIELDS.map(([label, value], index) => (
              <IntakeField key={label} label={label} value={value} index={index} typing={[0, 1, 3].includes(index)} calculated={[2, 4, 5].includes(index)} />
            ))}
          </div>
        </div>
        <div className="workflow-build-live__position-note"><CheckCircle2 /><span><small>Financials complete</small><strong>$216K gross income − $48K operating expenses = $168K NOI and a 7.00% cap rate at the $2.4M asking price.</strong></span></div>
      </section>

      <section className="agent-live-scene agent-live-scene--results workflow-build-live__scene workflow-build-live__scene--goals" aria-hidden={phase !== "replacement-criteria"}>
        <div className="agent-live-results__heading">
          <div><small>Optional exchange criteria</small><h3>Add what your client wants in a replacement property</h3></div>
          <span><SlidersHorizontal /> Every field is optional</span>
        </div>
        <div className="workflow-build-live__form-card workflow-build-live__form-card--criteria">
          <div className="workflow-build-live__form-toolbar"><span>Replacement criteria</span><small>Step 3 of 3 · Optional</small></div>
          <div className="workflow-build-live__goal-grid">
            <IntakeField label="Preferred locations" value="MA · RI · NH" index={0} typing optional />
            <IntakeField label="Replacement property types" value="Multifamily" index={1} select optional />
            <IntakeField label="Maximum replacement LTV" value="75%" index={2} typing optional />
            <IntakeField label="Minimum projected ROE" value="8.00%" index={3} typing optional />
          </div>
        </div>
        <div className="workflow-build-live__optional"><Target /><span><small>Completely optional</small><strong>If no criteria are added, ExchangeUp uses the default matching algorithm.</strong></span></div>
      </section>

      <section className="agent-live-scene agent-live-scene--review workflow-build-live__scene workflow-build-live__scene--ready" aria-hidden={phase !== "listing-review"}>
        <div className="workflow-build-live__ready-heading"><span><EyeOff /></span><div><small>Review before publishing</small><h3>Confirm the listing and exchange criteria</h3><p>Everything stays in draft until the agent publishes the listing.</p></div></div>
        <div className="workflow-build-live__listing-review">
          <article><img src={CURRENT_PROPERTY.image} alt={`${CURRENT_PROPERTY.address} listing preview`} /><div><small>Multifamily · {CURRENT_PROPERTY.market}</small><strong>{CURRENT_PROPERTY.address}</strong><span>$2.4M asking · $168K NOI · 7.00% cap</span></div></article>
          <aside><small>Exchange criteria</small><strong>MA · RI · NH</strong><span>Multifamily · Maximum 75% LTV · Minimum 8.00% projected ROE</span></aside>
        </div>
        <div className="workflow-build-live__ready-action"><span><i /><span><small>Draft complete</small><strong>The listing is ready to enter the ExchangeUp network.</strong></span></span><button type="button" tabIndex={-1}>Publish listing <ArrowRight /></button></div>
      </section>

      <section className="agent-live-scene workflow-build-live__scene workflow-build-live__scene--published" aria-hidden={phase !== "listing-published"}>
        <div className="workflow-build-live__published-check"><CheckCircle2 /></div>
        <small>Listing published</small>
        <h3>{CURRENT_PROPERTY.address} is now active</h3>
        <p>The listing is visible to eligible matches, and ExchangeUp can begin finding replacement opportunities for {ILLUSTRATIVE_CLIENT.name.split(" ")[0]}.</p>
        <div className="workflow-build-live__published-card"><img src={CURRENT_PROPERTY.image} alt={`Published listing at ${CURRENT_PROPERTY.address}`} /><span><small>Active listing</small><strong>{CURRENT_PROPERTY.address}</strong><em>Matching is now active</em></span><i /></div>
      </section>
    </>
  );
}

export function AgentWorkflowBuildDemo() {
  const playback = useAgentWorkflowPlayback("build");
  return (
    <AgentWorkflowFrame
      stageRef={playback.stageRef}
      phaseId={playback.phase.id}
      visualPhase={getAgentWorkflowBuildVisualPhase(playback.phase.id)}
      cycle={playback.cycle}
      liveClassName="workflow-build-live"
      ariaLabel="Animated client listing creation and publishing workflow"
      workspace={`${ILLUSTRATIVE_CLIENT.name} · New listing`}
      privacy="Private agent workspace"
      eyebrow="Create a listing"
      heading="Add the property, exchange criteria, and publish"
      status={playback.phase.label}
      disclosure="Illustrative client and property data · private agent workflow"
    >
      <AgentWorkflowBuildScenes phase={playback.phase.id} />
    </AgentWorkflowFrame>
  );
}
