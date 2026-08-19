import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  LockKeyhole,
  MapPin,
  Radar,
  Search,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CURRENT_PROPERTY } from "@/features/metaAgentLanding/agentWorkflowData";
import { AgentLandingCta } from "@/features/metaAgentLanding/AgentLandingCta";
import { AgentWorkflowAdvanceDemo } from "@/features/metaAgentLanding/AgentWorkflowAdvanceSegment";
import { AgentWorkflowBuildDemo } from "@/features/metaAgentLanding/AgentWorkflowBuildSegment";
import { AgentWorkflowDiscoverDemo } from "@/features/metaAgentLanding/AgentWorkflowDiscoverSegment";
import { AgentWorkflowReviewDemo } from "@/features/metaAgentLanding/AgentWorkflowReviewSegment";

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

const FAQS = [
  {
    question: "Does my client need to be ready to sell?",
    answer:
      "No. You can create a search from a client’s current property before they have decided to sell. If ExchangeUp surfaces a stronger investment opportunity, you have a concrete reason to start the exchange conversation.",
  },
  {
    question: "Is ExchangeUp free for agents?",
    answer:
      "Yes. Agents can create an account, add clients, publish properties, and review matches for free. No credit card is required.",
  },
  {
    question: "What do I need to start a search?",
    answer:
      "Start with a client name. For the current property, you’ll need the city, state, property type, estimated value, monthly gross rent, monthly operating expenses, and current loan balance. Replacement criteria and additional property details are optional.",
  },
  {
    question: "Does my client need an ExchangeUp account?",
    answer:
      "No. You can manage the client and their search from your agent workspace. Their email and phone number are optional, and you choose if and when to invite them into their own workspace.",
  },
  {
    question: "Who communicates with the listing agent?",
    answer:
      "Only verified agents communicate across the transaction. When your client wants to move forward, you can start a direct conversation with the verified listing agent. If a matched property does not yet have representation, its owner must connect with an agent before that conversation can begin.",
  },
  {
    question: "How does ExchangeUp decide what qualifies as a match?",
    answer:
      "ExchangeUp checks that the replacement property is equal to or greater in value than the client’s current property, fits their estimated purchasing capacity at the platform’s 75% maximum loan-to-value ratio, and produces a higher projected return on equity. Additional cash and optional replacement criteria can refine the results.",
  },
  {
    question: "What happens if there are no current matches?",
    answer:
      "The search stays active. As new or updated properties enter the network, ExchangeUp can evaluate them against the client’s financial position and criteria. A match is not guaranteed.",
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

type AgentPlatformStorySectionProps = {
  ctaDestination: string;
  onCtaClick: (location: "story") => void;
};

export function AgentPlatformStorySection({
  ctaDestination,
  onCtaClick,
}: AgentPlatformStorySectionProps) {
  return (
    <section className="agent-platform-story" aria-labelledby="agent-platform-story-title">
      <div className="agent-landing-shell agent-platform-story__frame">
        <div className="agent-platform-story__statement" data-agent-reveal>
          <p className="agent-eyebrow">Built around the exchange</p>
          <h2 id="agent-platform-story-title">
            <strong>Create more deal flow from the clients you already know.</strong>{" "}
            <span>Turn better performing properties into exchange conversations and new transactions.</span>
          </h2>
        </div>

        <div className="agent-platform-story__action" data-agent-reveal>
          <p>Start with one client and their current property.</p>
          <AgentLandingCta
            destination={ctaDestination}
            location="story"
            onClick={onCtaClick}
          />
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
  if (stage === 2) return <AgentWorkflowReviewDemo />;
  if (stage === 3) return <AgentWorkflowAdvanceDemo />;

  return (
    <div className="workflow-canvas" data-stage={stage}>
      <div className="workflow-canvas__chrome">
        <span className="workflow-canvas__mark"><Building2 aria-hidden="true" /></span>
        <div>
          <small>Client replacement search</small>
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
      <div className="workflow-canvas__footer"><LockKeyhole aria-hidden="true" /> Managed from your agent workspace <span>Illustrative product view</span></div>
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

export function AgentFaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="agent-faq">
      <div className="agent-landing-shell agent-faq__layout">
        <div className="agent-faq__intro" data-agent-reveal>
          <p className="agent-eyebrow">Common Questions</p>
          <h2 id="faq-title">What agents want to know before starting.</h2>
          <p>The practical details about clients, matching, communication, and cost.</p>
        </div>
        <Accordion
          type="single"
          collapsible
          defaultValue="faq-0"
          aria-label="Frequently asked questions for real estate agents"
          className="agent-faq__accordion"
          data-agent-reveal
        >
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
