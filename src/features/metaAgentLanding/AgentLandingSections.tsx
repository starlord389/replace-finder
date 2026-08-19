import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  EyeOff,
  LockKeyhole,
  MapPin,
  Radar,
  Search,
  Share2,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WORKFLOW_STEPS = [
  {
    number: "01",
    label: "Exchange setup",
    title: "Start with the property. Buying power follows.",
    description: "Add the property being sold and its financials. ExchangeUp turns the client’s value, debt, and equity into a clear replacement-property buying range.",
  },
  {
    number: "02",
    label: "Optional criteria",
    title: "Use standard matching—or refine what matters.",
    description: "No replacement criteria are required. Use ExchangeUp’s standard affordability and return rules, or add preferences for location, property type, additional cash, leverage, and projected return.",
  },
  {
    number: "03",
    label: "Matches + monitoring",
    title: "Know why it fits before you present it.",
    description: "Review the property, modeled financing, return improvement, and criteria fit in one place. If nothing qualifies today, the search stays active as new listings enter the network.",
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

export function AgentPlatformStorySection() {
  return (
    <section className="agent-platform-story" aria-labelledby="agent-platform-story-title">
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
        <p className="agent-eyebrow">How ExchangeUp works</p>
        <h2 id="workflow-title">Build the search once. Keep it working.</h2>
        <p>Start with the property being exchanged. ExchangeUp calculates the client’s buying power, identifies financially stronger replacements, and keeps watching as new opportunities enter the network.</p>
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
  return (
    <div className="workflow-canvas" data-stage={stage}>
      <div className="workflow-canvas__chrome">
        <span className="workflow-canvas__mark"><Building2 aria-hidden="true" /></span>
        <div><small>Private client search</small><strong>Riverside exchange</strong></div>
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
        {stage === 0 ? <ExchangeState /> : null}
        {stage === 1 ? <CriteriaState /> : null}
        {stage === 2 ? <ResultsState /> : null}
      </div>
      <div className="workflow-canvas__footer"><LockKeyhole aria-hidden="true" /> Private to your workspace <span>Illustrative product view</span></div>
    </div>
  );
}

function ExchangeState() {
  return (
    <div className="workflow-property">
      <div className="workflow-property__heading"><span><Building2 aria-hidden="true" /></span><div><small>Relinquished property</small><h4>214 Shrewsbury Street</h4><p><MapPin aria-hidden="true" /> Worcester, Massachusetts</p></div></div>
      <dl>
        <div><dt>Estimated value</dt><dd>$2,400,000</dd></div>
        <div><dt>Current loan</dt><dd>$1,200,000</dd></div>
        <div className="is-highlighted"><dt>Estimated equity</dt><dd>$1,200,000</dd></div>
        <div><dt>Asset type</dt><dd>Multifamily</dd></div>
      </dl>
      <div className="workflow-property__equity"><span><i /></span><div><small>Equity position</small><strong>50% of estimated value</strong></div></div>
    </div>
  );
}

function CriteriaState() {
  return (
    <div className="workflow-criteria">
      <div className="workflow-state-heading"><span><SlidersHorizontal aria-hidden="true" /></span><div><small>Replacement criteria</small><h4>Focused on what fits the client</h4></div></div>
      <div className="workflow-criteria__grid">
        <div><small>Target markets</small><strong>MA · RI · NH</strong><span>New England focus</span></div>
        <div><small>Purchase range</small><strong>$3.2M–$4.8M</strong><span>Based on this search</span></div>
        <div><small>Property types</small><strong>Multifamily</strong><span>Income-producing</span></div>
        <div><small>Optional preference</small><strong>6.5%+ cap rate</strong><span>Can be left open</span></div>
      </div>
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
