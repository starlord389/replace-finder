import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Radar,
  Search,
  Send,
  Share2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CURRENT_PROPERTY, ILLUSTRATIVE_MATCHES } from "@/features/metaAgentLanding/agentWorkflowData";
import { AgentWorkflowBuildDemo } from "@/features/metaAgentLanding/AgentWorkflowBuildSegment";
import { AgentWorkflowDiscoverDemo } from "@/features/metaAgentLanding/AgentWorkflowDiscoverSegment";

const WORKFLOW_STEPS = [
  {
    number: "01",
    label: "Build the Search",
    title: "Turn your client’s current property and priorities into a search for something better.",
    description: "The current property establishes the client’s estimated equity and purchasing position. Optional criteria, such as location, property type, financing, and projected return, help ExchangeUp focus on opportunities that could make an exchange more compelling.",
  },
  {
    number: "02",
    label: "Discover Opportunities Automatically",
    title: "Find the opportunity that starts the conversation.",
    description: "Rather than waiting to learn whether your client wants to sell, ExchangeUp continuously monitors the network for properties that may improve their investment position, so you can uncover potential exchanges worth reviewing and create a new reason to start the conversation.",
  },
  {
    number: "03",
    label: "Review the Matches",
    title: "Know what’s worth putting in front of your client.",
    description: "See the matched properties, review the financial comparison with your client’s current property, and understand why they fit the search. ExchangeUp only creates matches for properties with a higher projected return on equity, giving you a clear financial case to present to your client.",
  },
  {
    number: "04",
    label: "Advance the Opportunity",
    title: "Turn the right match into action.",
    description: "Present the opportunity to your client and explain why it may be worth considering. If your client wants to move forward, connect directly with the listing agent, coordinate the next steps, and guide the exchange toward closing. If the property is not the right fit, you can keep the search active so ExchangeUp can continue finding new opportunities for your client.",
  },
] as const;

const CONTROL_POINTS = [
  {
    number: "01",
    title: "Private from the start",
    detail: "Build and review the search in your agent workspace.",
  },
  {
    number: "02",
    title: "Share on your terms",
    detail: "Invite the client into their workspace when it supports your process.",
  },
  {
    number: "03",
    title: "Keep the search working",
    detail: "Leave the exchange active when there is no immediate match.",
  },
] as const;

const FAQS = [
  {
    question: "Is ExchangeUp free?",
    answer: "Yes. ExchangeUp is free to use, and no credit card is required.",
  },
  {
    question: "What do I need to start a search?",
    answer:
      "Start with a client name. For the relinquished property, you’ll need the city, state, asset type, estimated value or asking price, monthly gross rent, monthly operating expenses, and current loan balance. Replacement preferences are optional.",
  },
  {
    question: "Do I need to enter my client’s contact information?",
    answer:
      "No. Only the client name is required. Email and phone are optional and can be added later if you choose to invite the client into their own workspace.",
  },
  {
    question: "What happens if there are no current matches?",
    answer:
      "The search can remain active in monitoring. As matching runs against new or updated eligible properties, qualifying opportunities can appear in your Matches workspace. A match is not guaranteed.",
  },
  {
    question: "Where is ExchangeUp available?",
    answer: "ExchangeUp currently supports replacement-property searches in New England.",
  },
] as const;

const ADDITIONAL_BROKERAGE_LOGOS = [
  {
    name: "RE/MAX",
    src: "https://static-images.remax.com/assets/web/branding/REMAX-logo.svg",
    className: "",
  },
  {
    name: "Coldwell Banker",
    src: "https://bcom-coldwellbanker.directus.app/assets/90110d05-c162-4afc-9bc6-20ff283b6860",
    className: "is-reversed",
  },
  {
    name: "Corcoran",
    src: "https://www.corcoran.com/static/logos/corcoran-logo-white.svg",
    className: "is-reversed",
  },
  {
    name: "Redfin",
    src: "https://ssl.cdn-redfin.com/v642.0.1/images/logos/Redfin_Logo.png",
    className: "",
  },
] as const;

export function AgentPlatformBrokerageSection() {
  return (
    <section className="agent-platform-story" aria-label="Trusted real estate brokerages">
      <div className="agent-landing-shell agent-platform-story__frame">
        <div className="agent-platform-story__rail agent-platform-story__rail--brokerages" data-agent-reveal>
          <p>Trusted by agents from these brokerages</p>
          <ol aria-label="Additional real estate brokerages">
            {ADDITIONAL_BROKERAGE_LOGOS.map((logo) => (
              <li key={logo.name}>
                <img alt={logo.name} className={logo.className} loading="lazy" src={logo.src} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function AgentPlatformStorySection() {
  return (
    <section className="agent-platform-story" aria-labelledby="agent-platform-story-title">
      <div className="agent-landing-shell agent-platform-story__frame">
        <div className="agent-platform-story__statement" data-agent-reveal>
          <p className="agent-eyebrow">Built around the exchange</p>
          <h2 id="agent-platform-story-title">
            <strong>Keep the full replacement story connected.</strong>{" "}
            <span>Client objectives, property financials, eligible opportunities, and every next step stay in one working view.</span>
          </h2>
        </div>

        <div className="agent-platform-story__proof" data-agent-reveal>
          <article><span>01</span><div><strong>Start with facts, not a blank search.</strong><p>The relinquished property and its financial position establish the search context.</p></div></article>
          <article><span>02</span><div><strong>Make every match explainable.</strong><p>See the property, modeled financial change, and reasons an opportunity fits.</p></div></article>
          <article><span>03</span><div><strong>Keep momentum after discovery.</strong><p>Share with the client, coordinate with the other agent, and carry the opportunity forward.</p></div></article>
        </div>
      </div>
    </section>
  );
}

export function AgentWorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);
  const panelRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (
      !("IntersectionObserver" in window)
      || !window.matchMedia("(min-width: 1024px)").matches
    ) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number((visible.target as HTMLElement).dataset.workflowStep);
        if (Number.isInteger(index)) setActiveStep(index);
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: [0, 0.25, 0.6] },
    );

    panelRefs.current.forEach((panel) => panel && observer.observe(panel));
    return () => observer.disconnect();
  }, []);

  const focusPanel = (index: number) => {
    setActiveStep(index);
    panelRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section id="how-it-works" aria-labelledby="workflow-title" className="agent-workflow">
      <svg className="agent-workflow__parcel-field" viewBox="0 0 1600 1900" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 180 H312 V0 M312 180 H602 V450 H920 V214 H1254 V524 H1600" />
        <path d="M0 1120 H256 V870 H532 V1320 H824 V1030 H1152 V1450 H1410 V1190 H1600" />
        <path d="M82 1900 V1590 H396 V1750 H700 V1510 H1010 V1900 M1320 0 V318 H1530" />
      </svg>
      <div className="agent-landing-shell agent-workflow__intro" data-agent-reveal>
        <p className="agent-eyebrow">How ExchangeUp Works</p>
        <h2 id="workflow-title">Stop searching listing by listing.</h2>
        <p>ExchangeUp automatically surfaces the strongest replacement opportunities using your client’s property and investment goals, helping you close the sale, stay involved in the replacement purchase, and generate more business from every client completing a 1031 exchange.</p>
      </div>

      <div className="agent-landing-shell agent-workflow__story">
        <aside className="agent-workflow__rail" aria-label="How the ExchangeUp search works">
          <ol className="agent-workflow__steps" aria-label="How the ExchangeUp search works">
            {WORKFLOW_STEPS.map((step, index) => (
              <li key={step.number}>
                <button
                  type="button"
                  aria-pressed={activeStep === index}
                  onClick={() => focusPanel(index)}
                  onFocus={() => setActiveStep(index)}
                  className={activeStep === index ? "is-active" : ""}
                >
                  <span className="agent-workflow__step-number">{step.number}</span>
                  <div><small>{step.label}</small><h3>{step.title}</h3></div>
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="agent-workflow__panels">
          {WORKFLOW_STEPS.map((step, index) => (
            <article
              key={step.number}
              ref={(node) => { panelRefs.current[index] = node; }}
              data-workflow-step={index}
              className="agent-workflow__panel"
            >
              <div className="agent-workflow__panel-copy" data-agent-reveal>
                <p>{step.label}</p>
                <h3>{step.title}</h3>
                <span>{step.description}</span>
              </div>
              <div className="agent-workflow__panel-visual" data-agent-reveal>
                <WorkflowCanvas stage={index} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowCanvas({ stage }: { stage: number }) {
  if (stage === 0) return <AgentWorkflowBuildDemo />;
  if (stage === 1) return <AgentWorkflowDiscoverDemo />;
  if (stage === 2) return <ReviewMatchesState />;
  if (stage === 3) return <AdvanceOpportunityState />;

  return (
    <div className="workflow-canvas" data-stage={stage}>
      <div className="workflow-canvas__chrome">
        <span className="workflow-canvas__mark"><Building2 aria-hidden="true" /></span>
        <div>
          <small>Private client search</small>
          <strong>Riverside exchange</strong>
        </div>
        <span className="workflow-canvas__live"><i /> Active</span>
      </div>
      <div className="workflow-canvas__progress" aria-label={`Current step: ${WORKFLOW_STEPS[stage].label}`}>
        {WORKFLOW_STEPS.map((step, index) => (
          <div key={step.number} className={index <= stage ? "is-complete" : ""}>
            <span>{index < stage ? <Check aria-hidden="true" /> : index + 1}</span>
            <small>{step.label}</small>
          </div>
        ))}
      </div>
      <div className="workflow-canvas__state" key={stage} aria-live="polite">
        {/* Temporary: Step 4 reuses the Step 3 results visual until the dedicated visual pass. */}
        {stage >= 2 ? <ResultsState /> : null}
      </div>
      <div className="workflow-canvas__footer"><LockKeyhole aria-hidden="true" /> Private to your workspace <span>Illustrative product view</span></div>
    </div>
  );
}

type ReviewPhase = "results" | "property" | "financials" | "match";

const REVIEW_PHASE_LABELS: Record<ReviewPhase, string> = {
  results: "Reviewing matched properties",
  property: "Opening the strongest match",
  financials: "Comparing the financial position",
  match: "Explaining why the property fits",
};

function ReviewMatchesState() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<ReviewPhase>("results");
  const [cycle, setCycle] = useState(0);
  const selectedMatch = ILLUSTRATIVE_MATCHES[0];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) {
      setPhase("property");
      return;
    }

    let active = false;
    let timers: number[] = [];
    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };
    const runCycle = () => {
      if (!active) return;
      clearTimers();
      setCycle((value) => value + 1);
      setPhase("results");
      timers.push(window.setTimeout(() => active && setPhase("property"), 4_200));
      timers.push(window.setTimeout(() => active && setPhase("financials"), 8_500));
      timers.push(window.setTimeout(() => active && setPhase("match"), 13_200));
      timers.push(window.setTimeout(() => active && runCycle(), 19_000));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldRun = entry.intersectionRatio >= 0.2;
        if (shouldRun && !active) {
          active = true;
          runCycle();
          return;
        }
        if (!shouldRun && active) {
          active = false;
          clearTimers();
        }
      },
      { threshold: [0, 0.14, 0.2, 0.28, 0.55] },
    );

    observer.observe(stage);
    return () => {
      active = false;
      clearTimers();
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={stageRef} className="agent-console-stage workflow-review-stage">
      <figure className="agent-console" data-review-phase={phase} aria-label="Animated matched-property review and financial comparison preview">
        <figcaption className="agent-console__topbar">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="agent-console__workspace">Elaine Thomas · Matches</span>
          <span className="agent-console__privacy">Private agent workspace</span>
        </figcaption>

        <div key={cycle} className="agent-live-demo workflow-review-live" data-live-phase={phase}>
          <div className="agent-live-demo__camera">
            <section className="agent-live-demo__workspace">
              <div className="agent-live-demo__workspace-heading"><div><small>Agent decision view</small><strong>Build the financial case before presenting a property</strong></div><span><i /> {REVIEW_PHASE_LABELS[phase]}</span></div>
              <div className="agent-live-demo__request-line"><span><Search /></span><p><small>What makes a match worth presenting</small><strong>A better projected return, affordable financing, and alignment with the client’s property criteria</strong></p><div><small>Current ROE</small><strong>{CURRENT_PROPERTY.roe}</strong></div></div>

              <div className="agent-live-demo__canvas">
                <section className="agent-live-scene agent-live-scene--results workflow-review-live__scene workflow-review-live__scene--matches" aria-hidden={phase !== "results"}>
                  <div className="agent-live-results__heading"><div><small>Matched for Elaine’s private search</small><h3>2 stronger properties to review</h3></div><span><CheckCircle2 /> Higher projected ROE</span></div>
                  <div className="agent-live-results__filters"><span>Current property <b>{CURRENT_PROPERTY.value}</b></span><span>Buying range <b>{CURRENT_PROPERTY.buyingRange}</b></span><span><Radar /> Search remains active</span></div>
                  <div className="workflow-review-live__match-grid">
                    {ILLUSTRATIVE_MATCHES.map((candidate, index) => (
                      <article key={candidate.address} className={index === 0 ? "is-selected" : ""}>
                        <div><img src={candidate.image} alt={`Step 3 match at ${candidate.address}`} /><span>{candidate.score} match</span></div>
                        <section><small>{candidate.type} · {candidate.market}</small><h4>{candidate.address}</h4><dl><div><dt>Asking</dt><dd>{candidate.price}</dd></div><div><dt>Projected ROE</dt><dd>{candidate.roe}</dd></div></dl><p><CheckCircle2 /> {candidate.roeImprovement} above current ROE</p></section>
                      </article>
                    ))}
                  </div>
                  <div className="workflow-review-live__opening"><span><i /><strong>Opening the strongest match</strong></span><ArrowRight /></div>
                </section>

                <section className="agent-live-scene agent-live-scene--review workflow-review-live__scene workflow-review-live__scene--detail" aria-hidden={phase === "results"}>
                  <div className="agent-live-review__toolbar">
                    <span className="workflow-review-live__back"><ArrowRight /> Matched properties</span>
                    <div className="agent-live-review__tabs" role="tablist" aria-label="Step 3 property review">
                      <button type="button" role="tab" tabIndex={-1} aria-selected={phase === "property"}>Property</button>
                      <button type="button" role="tab" tabIndex={-1} aria-selected={phase === "financials"}>Financial comparison</button>
                      <button type="button" role="tab" tabIndex={-1} aria-selected={phase === "match"}>Why it fits</button>
                    </div>
                  </div>

                  <div className="agent-live-review__panels">
                    <section className="agent-live-review__panel agent-live-review__panel--property" aria-hidden={phase !== "property"}>
                      <div className="agent-live-property-overview__media"><img src={selectedMatch.image} alt={`Reviewing ${selectedMatch.address}`} /><span>{selectedMatch.type}</span></div>
                      <div className="agent-live-property-overview__body">
                        <div className="agent-live-property-overview__heading"><div><small>Matched property</small><h3>{selectedMatch.address}</h3><p><MapPin /> {selectedMatch.market}</p></div><span><strong>{selectedMatch.score}</strong><small>match</small></span></div>
                        <dl><div><dt>Asking price</dt><dd>{selectedMatch.price}</dd></div><div><dt>Cap rate</dt><dd>{selectedMatch.capRate}</dd></div><div><dt>Annual NOI</dt><dd>{selectedMatch.noi}</dd></div><div><dt>Asset type</dt><dd>{selectedMatch.type}</dd></div></dl>
                        <div className="agent-live-property-overview__location"><MapPin /><span><small>Location</small><strong>{selectedMatch.market} · Inside the client’s preferred area</strong></span></div>
                      </div>
                    </section>

                    <section className="agent-live-review__panel agent-live-review__panel--financials" aria-hidden={phase !== "financials"}>
                      <div className="agent-live-comparison">
                        <div className="agent-live-comparison__heading"><div><small>Current property compared with matched property</small><h4>{CURRENT_PROPERTY.address} vs. {selectedMatch.address}</h4></div><span><CheckCircle2 /> {selectedMatch.roeImprovement} projected ROE</span></div>
                        <div className="agent-live-comparison__labels"><span>Metric</span><span>Current</span><span>Matched</span><span>Change</span></div>
                        <ReviewComparisonRow label="Property value" current={CURRENT_PROPERTY.value} replacement={selectedMatch.price} change={selectedMatch.valueIncrease} />
                        <ReviewComparisonRow label="Annual NOI" current={CURRENT_PROPERTY.noi} replacement={selectedMatch.noi} change={selectedMatch.noiChange} />
                        <ReviewComparisonRow label="Loan / LTV" current={`${CURRENT_PROPERTY.loan} · ${CURRENT_PROPERTY.ltv}`} replacement={`${selectedMatch.loan} · ${selectedMatch.ltv}`} change="Within 75%" />
                        <ReviewComparisonRow label="Cash flow / ROE" current={`${CURRENT_PROPERTY.cashFlow} · ${CURRENT_PROPERTY.roe}`} replacement={`${selectedMatch.cashFlow} · ${selectedMatch.roe}`} change={selectedMatch.roeImprovement} />
                      </div>
                      <div className="agent-live-financials__outcome"><CheckCircle2 /><span><small>Financial result</small><strong>Projected ROE improves from {CURRENT_PROPERTY.roe} to {selectedMatch.roe} while remaining inside the client’s purchasing capacity.</strong></span></div>
                    </section>

                    <section className="agent-live-review__panel agent-live-review__panel--match" aria-hidden={phase !== "match"}>
                      <div className="agent-live-match-explainer__heading"><div><small>Why this match fits</small><h3>{selectedMatch.address} passed every required check</h3></div><span>{selectedMatch.score} match</span></div>
                      <div className="agent-live-match-explainer__grid">
                        <article><small>Financial and search fit</small><ul>
                          <li><CheckCircle2 /><span><strong>Affordable trade-up</strong><small>{selectedMatch.price} is within the {CURRENT_PROPERTY.buyingRange} capacity</small></span></li>
                          <li><CheckCircle2 /><span><strong>Better projected return</strong><small>{CURRENT_PROPERTY.roe} → {selectedMatch.roe} projected ROE</small></span></li>
                          <li><CheckCircle2 /><span><strong>Financing remains inside the limit</strong><small>{selectedMatch.loan} loan · {selectedMatch.ltv} LTV</small></span></li>
                          <li><CheckCircle2 /><span><strong>Matches the client’s priorities</strong><small>{selectedMatch.type} · {selectedMatch.market}</small></span></li>
                        </ul></article>
                        <aside><small>Agent review result</small><h4>Worth presenting</h4><div className="workflow-review-live__score"><strong>{selectedMatch.score}</strong><span>match score</span></div><p><strong>{selectedMatch.roeImprovement}</strong><span>projected ROE improvement</span></p><p><strong>{selectedMatch.cashFlowChange}</strong><span>projected annual cash-flow change</span></p></aside>
                      </div>
                    </section>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{REVIEW_PHASE_LABELS[phase]}</p>
        <div className="agent-console__disclosure">Illustrative property and financing data · agent review workflow</div>
      </figure>
    </div>
  );
}

function ReviewComparisonRow({ label, current, replacement, change }: { label: string; current: string; replacement: string; change: string }) {
  return <div className="agent-live-comparison__row"><strong>{label}</strong><span>{current}</span><span>{replacement}</span><b>{change}</b></div>;
}

type AdvancePhase = "match" | "opening" | "conversation" | "typing" | "sent";

const ADVANCE_PHASE_LABELS: Record<AdvancePhase, string> = {
  match: "Match review complete",
  opening: "Contacting the listing agent",
  conversation: "Agent conversation opened",
  typing: "Writing the first message",
  sent: "Message delivered",
};

const ADVANCE_MESSAGE = "Hi Jordan, my client is interested in 184 River Avenue. Could you send the OM and latest T-12?";

function AdvanceOpportunityState() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<AdvancePhase>("match");
  const [cycle, setCycle] = useState(0);
  const selectedMatch = ILLUSTRATIVE_MATCHES[0];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) {
      setPhase("sent");
      return;
    }

    let active = false;
    let timers: number[] = [];
    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };
    const runCycle = () => {
      if (!active) return;
      clearTimers();
      setCycle((value) => value + 1);
      setPhase("match");
      timers.push(window.setTimeout(() => active && setPhase("opening"), 3_600));
      timers.push(window.setTimeout(() => active && setPhase("conversation"), 5_100));
      timers.push(window.setTimeout(() => active && setPhase("typing"), 6_700));
      timers.push(window.setTimeout(() => active && setPhase("sent"), 10_900));
      timers.push(window.setTimeout(() => active && runCycle(), 16_500));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldRun = entry.intersectionRatio >= 0.2;
        if (shouldRun && !active) {
          active = true;
          runCycle();
          return;
        }
        if (!shouldRun && active) {
          active = false;
          clearTimers();
        }
      },
      { threshold: [0, 0.14, 0.2, 0.28, 0.55] },
    );

    observer.observe(stage);
    return () => {
      active = false;
      clearTimers();
      observer.disconnect();
    };
  }, []);

  const showingConversation = phase === "conversation" || phase === "typing" || phase === "sent";

  return (
    <div ref={stageRef} className="agent-console-stage workflow-advance-stage">
      <figure className="agent-console" data-advance-phase={phase} aria-label="Animated listing-agent conversation workflow">
        <figcaption className="agent-console__topbar">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="agent-console__workspace">Elaine Thomas · 184 River Avenue</span>
          <span className="agent-console__privacy">Verified agents only</span>
        </figcaption>

        <div key={cycle} className="agent-live-demo workflow-advance-live" data-live-phase={phase}>
          <div className="agent-live-demo__camera">
            <section className="agent-live-demo__workspace">
              <div className="agent-live-demo__workspace-heading"><div><small>Advance the opportunity</small><strong>Move from a reviewed match into an agent conversation</strong></div><span><i /> {ADVANCE_PHASE_LABELS[phase]}</span></div>

              <div className="agent-live-demo__canvas">
                <section className="agent-live-scene workflow-advance-live__scene workflow-advance-live__scene--match" aria-hidden={showingConversation}>
                  <div className="workflow-advance-live__nav" aria-hidden="true"><span>Dashboard</span><span>Pipeline</span><span className="is-active">Matches</span><span>Client Requests</span></div>
                  <div className="workflow-advance-live__breadcrumb"><ArrowRight /> Elaine Thomas <i /> Matched properties <i /> {selectedMatch.address}</div>
                  <article className="workflow-advance-live__decision">
                    <img src={selectedMatch.image} alt={`${selectedMatch.address} selected match`} />
                    <div className="workflow-advance-live__decision-property"><small>Reviewed match</small><h3>{selectedMatch.address}</h3><p><MapPin /> {selectedMatch.market}</p><span><CheckCircle2 /> Worth presenting</span></div>
                    <div className="workflow-advance-live__decision-agent"><span>JL</span><div><small>Listing agent</small><strong>Jordan Lee</strong><p>Northeast Commercial Realty</p></div></div>
                    <button type="button" tabIndex={-1}><Mail /> Contact listing agent <ArrowRight /></button>
                  </article>
                  <div className="workflow-advance-live__immediate"><ShieldCheck /><span><small>No approval step</small><strong>Verified agents can begin the conversation immediately.</strong></span></div>
                </section>

                <section className="agent-live-scene workflow-advance-live__scene workflow-advance-live__scene--conversation" aria-hidden={!showingConversation}>
                  <div className="workflow-advance-live__nav" aria-hidden="true"><span>Dashboard</span><span className="is-active">Pipeline</span><span>Matches</span><span>Client Requests</span></div>
                  <div className="workflow-advance-live__thread">
                    <header><span>JL</span><div><small>Conversation with listing agent</small><strong>Jordan Lee</strong><p>{selectedMatch.address} · {selectedMatch.market}</p></div><em><i /> Agents connected</em></header>
                    <div className="workflow-advance-live__thread-body">
                      <div className="workflow-advance-live__privacy"><ShieldCheck /> Verified agent-to-agent conversation · client details stay private</div>
                      {phase === "sent" && <div className="workflow-advance-live__message"><span>You</span><p>{ADVANCE_MESSAGE}</p><small>Just now · Delivered</small></div>}
                    </div>
                    <div className={`workflow-advance-live__composer${phase === "typing" ? " is-typing" : ""}${phase === "sent" ? " is-sent" : ""}`}>
                      <span>{phase === "typing" ? ADVANCE_MESSAGE : "Write a message…"}</span>
                      <button type="button" tabIndex={-1} aria-label="Send illustrative message"><Send /></button>
                    </div>
                    {phase === "sent" && <div className="workflow-advance-live__complete"><CheckCircle2 /><span><small>Conversation started</small><strong>The opportunity moved to In Conversation in the pipeline.</strong></span></div>}
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{ADVANCE_PHASE_LABELS[phase]}</p>
        <div className="agent-console__disclosure">Illustrative property and conversation data · verified agent workflow</div>
      </figure>
    </div>
  );
}

function ResultsState() {
  return (
    <div className="workflow-results">
      <div className="workflow-state-heading"><span><Search aria-hidden="true" /></span><div><small>Potential matches</small><h4>Two opportunities to review</h4></div></div>
      <div className="workflow-results__list">
        <article><div><small>90 match</small><strong>184 River Avenue</strong><span><MapPin aria-hidden="true" /> Providence, RI</span></div><dl><div><dt>Asking</dt><dd>$4.0M</dd></div><div><dt>Cap</dt><dd>9.1%</dd></div></dl></article>
        <article><div><small>80 match</small><strong>675 Harvey Road</strong><span><MapPin aria-hidden="true" /> Manchester, NH</span></div><dl><div><dt>Asking</dt><dd>$4.4M</dd></div><div><dt>Cap</dt><dd>8.9%</dd></div></dl></article>
      </div>
      <div className="workflow-results__monitor"><Radar aria-hidden="true" /><div><small>Monitoring remains on</small><strong>New eligible opportunities can enter this search</strong></div><i /></div>
    </div>
  );
}

export function AgentControlSection() {
  return (
    <section id="agent-control" aria-labelledby="agent-control-title" className="agent-control">
      <svg className="agent-control__field" viewBox="0 0 1600 980" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 180 H324 V0 M324 180 H602 V422 H870 V132 H1180 V338 H1600" />
        <path d="M0 760 H248 V540 H548 V910 H864 V632 H1180 V980 M1400 0 V186 H1600" />
        <path className="active" d="M-80 820 C220 820 260 668 520 668 S788 790 1010 492 1296 300 1680 300" />
      </svg>
      <div className="agent-landing-shell agent-control__layout">
        <div className="agent-control__copy" data-agent-reveal>
          <p className="agent-eyebrow agent-eyebrow--light">Your client. Your process.</p>
          <h2 id="agent-control-title">A private search you stay in control of.</h2>
          <p>Build the search first, bring the client in when it makes sense, and keep the exchange moving without giving up control of the relationship.</p>
          <ol className="agent-control__principles">
            {CONTROL_POINTS.map((point) => (
              <li key={point.number}><span>{point.number}</span><div><strong>{point.title}</strong><p>{point.detail}</p></div></li>
            ))}
          </ol>
        </div>

        <div className="agent-access-map" aria-label="Private agent workspace access model" data-agent-reveal>
          <div className="agent-access-map__topbar"><span><LockKeyhole aria-hidden="true" /> Search access</span><strong>Agent controlled</strong></div>
          <div className="agent-access-map__boundary">
            <div className="agent-access-map__boundary-label"><EyeOff aria-hidden="true" /> Private workspace boundary</div>
            <div className="agent-access-map__primary"><span><UserRound aria-hidden="true" /></span><div><small>Search owner</small><strong>You · Representing agent</strong></div><i>Full control</i></div>
            <div className="agent-access-map__route" aria-hidden="true"><span /><i /><span /></div>
            <div className="agent-access-map__nodes">
              <div><span><Share2 aria-hidden="true" /></span><small>Client workspace</small><strong>You choose when to invite</strong></div>
              <div className="is-active"><span><Radar aria-hidden="true" /></span><small>Market monitoring</small><strong>Active in the background</strong></div>
            </div>
          </div>
          <div className="agent-access-map__footer"><Check aria-hidden="true" /> No client contact information is required to begin.</div>
        </div>
      </div>

      <div className="agent-landing-shell agent-control__connected" data-agent-reveal>
        <div className="agent-control__connected-heading">
          <small>What stays connected</small>
          <strong>Context carries forward as the exchange moves.</strong>
        </div>
        <ol>
          <li><span>01</span><div><small>Property</small><strong>Financials + equity</strong></div></li>
          <li><span>02</span><div><small>Search</small><strong>Client criteria</strong></div></li>
          <li><span>03</span><div><small>Opportunity</small><strong>Match rationale</strong></div></li>
          <li><span>04</span><div><small>Coordination</small><strong>Agent conversation</strong></div></li>
          <li><span>05</span><div><small>Progress</small><strong>Pipeline stage</strong></div></li>
        </ol>
      </div>
    </section>
  );
}

export function AgentFaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="agent-faq">
      <div className="agent-landing-shell agent-faq__layout">
        <div className="agent-faq__intro" data-agent-reveal>
          <p className="agent-eyebrow">Before you begin</p>
          <h2 id="faq-title">Straight answers, before you start.</h2>
          <p>Everything needed to understand how a private client search starts and what happens next.</p>
        </div>
        <Accordion type="single" collapsible className="agent-faq__accordion" data-agent-reveal>
          {FAQS.map((faq, index) => (
            <AccordionItem key={faq.question} value={`faq-${index}`}>
              <AccordionTrigger className="agent-faq__trigger"><span><small>0{index + 1}</small>{faq.question}</span></AccordionTrigger>
              <AccordionContent className="agent-faq__content motion-reduce:animate-none">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
