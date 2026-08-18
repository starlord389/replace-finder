import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ImageOff,
  MapPin,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";

type HybridPhase = "exchange" | "analysis" | "match" | "comparison" | "ready";

const HYBRID_TIMELINE: ReadonlyArray<{ phase: HybridPhase; at: number }> = [
  { phase: "exchange", at: 0 },
  { phase: "analysis", at: 5_200 },
  { phase: "match", at: 12_800 },
  { phase: "comparison", at: 18_800 },
  { phase: "ready", at: 27_000 },
];

const HYBRID_LENGTH = 34_000;

const PHASE_INDEX: Record<HybridPhase, number> = {
  exchange: 0,
  analysis: 1,
  match: 2,
  comparison: 3,
  ready: 4,
};

const BRIDGE_COPY: Record<HybridPhase, string> = {
  exchange: "Exchange ready",
  analysis: "Evaluating network",
  match: "Match qualified",
  comparison: "Comparing outcomes",
  ready: "Search stays active",
};

export function AgentSearchPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<HybridPhase>("exchange");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (!stage || reduceMotion || !("IntersectionObserver" in window)) {
      setPhase("ready");
      return;
    }

    let active = false;
    let timers: number[] = [];

    const clearTimers = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [];
    };

    const runStory = () => {
      if (!active) return;
      clearTimers();
      setCycle((value) => value + 1);
      setPhase("exchange");

      HYBRID_TIMELINE.slice(1).forEach(({ phase: nextPhase, at }) => {
        timers.push(window.setTimeout(() => active && setPhase(nextPhase), at));
      });
      timers.push(window.setTimeout(runStory, HYBRID_LENGTH));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldRun = entry.intersectionRatio >= 0.22;
        if (shouldRun && !active) {
          active = true;
          runStory();
        } else if (!shouldRun && active) {
          active = false;
          clearTimers();
        }
      },
      { threshold: [0, 0.12, 0.22, 0.5] },
    );

    observer.observe(stage);
    return () => {
      active = false;
      clearTimers();
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={stageRef} className="agent-console-stage">
      <RolloutWindows />

      <figure aria-labelledby="agent-search-preview-caption" className="agent-console agent-hybrid-console">
        <figcaption id="agent-search-preview-caption" className="agent-hybrid-browser">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>app.1031exchangeup.com/agent/matches</span>
          <strong><ShieldCheck /> Secure workspace</strong>
        </figcaption>

        <div
          key={cycle}
          className="agent-hybrid-demo"
          data-hybrid-phase={phase}
          aria-label="Illustrative live ExchangeUp value demonstration"
        >
          <HybridHeader phase={phase} />
          <HybridProgress phase={phase} />

          <div className="agent-hybrid-layout">
            <ExchangeAnchor phase={phase} />
            <IntelligenceBridge phase={phase} />
            <section className="agent-hybrid-scene" aria-live="polite">
              {phase === "exchange" && <ExchangeScene />}
              {phase === "analysis" && <AnalysisScene />}
              {phase === "match" && <MatchScene />}
              {phase === "comparison" && <ComparisonScene />}
              {phase === "ready" && <ReadyScene />}
            </section>
          </div>
        </div>

        <div className="agent-console__disclosure">
          Illustrative product demo · modeled estimates are not a guarantee
        </div>
      </figure>
    </div>
  );
}

function HybridHeader({ phase }: { phase: HybridPhase }) {
  return (
    <header className="agent-hybrid-header">
      <div className="agent-hybrid-header__brand">
        <strong>1031Exchange<span>UP</span></strong><i>↗</i><small>Agent</small>
      </div>
      <div className="agent-hybrid-header__scope">
        <span><UserRound /> Elaine Thomas</span>
        <ChevronRight />
        <strong>Riverside Apartments</strong>
      </div>
      <div className="agent-hybrid-header__status">
        <i />
        <span>{phase === "exchange" ? "Active exchange" : "Exchange IQ™ active"}</span>
      </div>
    </header>
  );
}

function HybridProgress({ phase }: { phase: HybridPhase }) {
  const activeIndex = PHASE_INDEX[phase];
  const steps = ["Current exchange", "Exchange IQ™", "Qualified match", "Financial upside", "Ready to review"];

  return (
    <ol className="agent-hybrid-progress" aria-label="Illustrative matching journey">
      {steps.map((step, index) => (
        <li
          key={step}
          className={(index < activeIndex ? "is-complete" : "") + (index === activeIndex ? " is-current" : "")}
        >
          <span>{index < activeIndex ? <Check /> : index + 1}</span>
          <small>{step}</small>
        </li>
      ))}
    </ol>
  );
}

function ExchangeAnchor({ phase }: { phase: HybridPhase }) {
  return (
    <aside className="agent-hybrid-origin" aria-label="Current exchange">
      <div className="agent-hybrid-origin__heading">
        <span>Current exchange</span>
        <strong><i /> Active</strong>
      </div>

      <div className="agent-hybrid-origin__client">
        <span>ET</span>
        <div><strong>Elaine Thomas</strong><small>Client · trading out</small></div>
      </div>

      <div className="agent-hybrid-origin__property">
        <span><Building2 /></span>
        <div>
          <strong>Riverside Apartments</strong>
          <small><MapPin /> Hartford, CT · Multifamily</small>
        </div>
      </div>

      <div className="agent-hybrid-equity">
        <div><small>Property value</small><strong>$2.4M</strong></div>
        <span>−</span>
        <div><small>Loan balance</small><strong>$1.1M</strong></div>
        <span>=</span>
        <div className="is-equity"><small>Exchange equity</small><strong>$1.3M</strong></div>
      </div>

      <div className={"agent-hybrid-capacity" + (phase !== "exchange" ? " is-confirmed" : "")}>
        <CircleDollarSign />
        <div><small>Modeled purchasing capacity</small><strong>$5.2M</strong><span>at the 75% platform LTV ceiling</span></div>
        {phase !== "exchange" && <CheckCircle2 />}
      </div>

      <div className="agent-hybrid-preferences">
        <small>Optional preferences</small>
        <div><span>New England</span><span>Multifamily</span></div>
      </div>
    </aside>
  );
}

function IntelligenceBridge({ phase }: { phase: HybridPhase }) {
  return (
    <div className={"agent-hybrid-bridge" + (phase === "analysis" ? " is-evaluating" : "")} aria-hidden="true">
      <span className="agent-hybrid-bridge__line"><i /></span>
      <div><Radar /><i /></div>
      <strong>Exchange IQ™</strong>
      <small>{BRIDGE_COPY[phase]}</small>
      <ArrowRight />
    </div>
  );
}

function SceneHeading({ step, title, copy }: { step: string; title: string; copy: string }) {
  return (
    <header className="agent-hybrid-scene__heading">
      <span>{step}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </header>
  );
}

function ExchangeScene() {
  return (
    <div className="agent-hybrid-scene__inner agent-hybrid-exchange-scene">
      <SceneHeading
        step="1 · The exchange"
        title="Start with the property your client owns."
        copy="ExchangeUp turns the property's equity, financials, and preferences into a private replacement search."
      />

      <div className="agent-hybrid-goal">
        <div className="agent-hybrid-goal__client">
          <span>ET</span>
          <div><small>Elaine's exchange</small><strong>Find a financially stronger replacement.</strong></div>
        </div>
        <dl>
          <div><dt>Available equity</dt><dd>$1.3M</dd></div>
          <div><dt>Search ceiling</dt><dd>$5.2M</dd></div>
          <div><dt>Primary objective</dt><dd>Improve return on equity</dd></div>
        </dl>
      </div>

      <div className="agent-hybrid-ready-line">
        <span><Sparkles /></span>
        <div><strong>Exchange ready for evaluation</strong><small>The listing network is monitored privately as it grows.</small></div>
        <ArrowRight />
      </div>
    </div>
  );
}

function AnalysisScene() {
  const checks = [
    { label: "Purchasing capacity", value: "$3.8M ≤ $5.2M", note: "Candidate fits the modeled exchange range." },
    { label: "Trade-up rule", value: "$3.8M > $2.4M", note: "Replacement value clears the current property." },
    { label: "Modeled leverage", value: "65.8% ≤ 75%", note: "Financing remains under the platform ceiling." },
    { label: "Return on equity", value: "17.2% > 12.4%", note: "The modeled replacement improves the outcome." },
  ];

  return (
    <div className="agent-hybrid-scene__inner agent-hybrid-analysis-scene">
      <SceneHeading
        step="2 · Exchange IQ™"
        title="Every listing has to clear the exchange."
        copy="Not just a property search. Each candidate is tested against the client's equity and modeled financial outcome."
      />

      <div className="agent-hybrid-analysis">
        {checks.map((check, index) => (
          <article key={check.label} style={{ "--analysis-order": index } as CSSProperties}>
            <span><Check /></span>
            <div><small>{check.label}</small><strong>{check.value}</strong><p>{check.note}</p></div>
          </article>
        ))}
      </div>

      <div className="agent-hybrid-analysis__footer">
        <span><i /> Evaluating private inventory</span>
        <strong>Ranking stronger replacements…</strong>
      </div>
    </div>
  );
}

function PropertyPlaceholder({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"agent-hybrid-placeholder" + (compact ? " is-compact" : "")}>
      <ImageOff />
      <small>No property photos provided</small>
    </div>
  );
}

function MatchScene() {
  return (
    <div className="agent-hybrid-scene__inner agent-hybrid-match-scene">
      <SceneHeading
        step="3 · Qualified match"
        title="A stronger replacement rises to the top."
        copy="The best result is presented like it appears in the real Match Inbox—with the evidence attached."
      />

      <article className="agent-hybrid-property-card">
        <div className="agent-hybrid-property-card__lead">
          <span>#1 for Riverside Apartments</span>
          <strong><i /> New opportunity</strong>
        </div>
        <div className="agent-hybrid-property-card__body">
          <PropertyPlaceholder />
          <div className="agent-hybrid-property-card__details">
            <small>Matched replacement property</small>
            <h3>Blackstone Mill Lofts</h3>
            <p><MapPin /> Providence, RI · Multifamily</p>
            <dl>
              <div><dt>Asking price</dt><dd>$3.8M</dd></div>
              <div><dt>Cap rate</dt><dd>6.9%</dd></div>
              <div><dt>Annual NOI</dt><dd>$262K</dd></div>
            </dl>
          </div>
          <div className="agent-hybrid-property-card__score"><strong>92</strong><span>Match<br />score</span></div>
        </div>
        <div className="agent-hybrid-property-card__footer">
          <span><Check /> Within purchasing capacity</span>
          <span><Check /> Modeled ROE improves</span>
          <button type="button">Review match <ArrowRight /></button>
        </div>
      </article>
    </div>
  );
}

function ComparisonScene() {
  const metrics = [
    { label: "Return on equity", current: "12.4%", replacement: "17.2%", delta: "+4.8 pp" },
    { label: "Net operating income", current: "$180K", replacement: "$262K", delta: "+$82K/yr" },
    { label: "Cash flow after debt", current: "$68K", replacement: "$101K", delta: "+$33K/yr" },
  ];

  return (
    <div className="agent-hybrid-scene__inner agent-hybrid-comparison-scene">
      <SceneHeading
        step="4 · Financial upside"
        title="The score is supported by the outcome."
        copy="The current property and replacement are compared using Exchange IQ™ modeled financing."
      />

      <div className="agent-hybrid-comparison">
        <div className="agent-hybrid-comparison__head">
          <span><TrendingUp /></span>
          <div><strong>Financial opportunity comparison</strong><small>Current property → replacement property</small></div>
          <b>92 match</b>
        </div>
        <div className="agent-hybrid-comparison__properties">
          <span>Riverside Apartments</span><ArrowRight /><strong>Blackstone Mill Lofts</strong>
        </div>
        <div className="agent-hybrid-comparison__metrics">
          {metrics.map((metric, index) => (
            <article key={metric.label} style={{ "--metric-order": index } as CSSProperties}>
              <small>{metric.label}</small>
              <div><span>{metric.current}</span><ArrowRight /><strong>{metric.replacement}</strong><b>{metric.delta}</b></div>
            </article>
          ))}
        </div>
        <div className="agent-hybrid-comparison__foot">
          <span><CheckCircle2 /> 65.8% modeled LTV</span>
          <small>Estimates are modeled and should be independently verified.</small>
        </div>
      </div>
    </div>
  );
}

function ReadyScene() {
  return (
    <div className="agent-hybrid-scene__inner agent-hybrid-ready-scene">
      <SceneHeading
        step="5 · Ready to review"
        title="A stronger replacement—with the case already made."
        copy="The agent sees what qualified, what improves, and what deserves the client's attention."
      />

      <article className="agent-hybrid-result">
        <div className="agent-hybrid-result__status">
          <span><CheckCircle2 /></span>
          <div><small>Strong match found for</small><strong>Riverside Apartments</strong></div>
          <b>New opportunity</b>
        </div>
        <div className="agent-hybrid-result__property">
          <PropertyPlaceholder compact />
          <div><small>Providence, RI · Multifamily</small><strong>Blackstone Mill Lofts</strong><p>$3.8M asking · 6.9% cap · $262K NOI</p></div>
          <span><strong>92</strong><small>match</small></span>
        </div>
        <div className="agent-hybrid-result__proof">
          <div><small>Modeled ROE</small><strong>12.4% <ArrowRight /> 17.2%</strong></div>
          <div><small>Annual NOI improvement</small><strong>+$82K</strong></div>
          <button type="button">Review match <ArrowRight /></button>
        </div>
      </article>

      <div className="agent-hybrid-monitoring">
        <span><Radar /><i /></span>
        <div><strong>The search does not stop here.</strong><small>Exchange IQ™ keeps monitoring for stronger qualifying opportunities.</small></div>
        <i>Active</i>
      </div>
    </div>
  );
}

function RolloutWindows() {
  return (
    <>
      <aside className="agent-rollout-window agent-rollout-window--conversation" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>Exchange inputs</strong></div>
        <div className="agent-rollout-scope">
          <span><WalletCards /></span>
          <div><small>Available equity</small><strong>$1.3M</strong></div>
        </div>
        <div className="agent-rollout-scope">
          <span><CircleDollarSign /></span>
          <div><small>Purchasing capacity</small><strong>$5.2M</strong></div>
        </div>
      </aside>

      <aside className="agent-rollout-window agent-rollout-window--activity" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>Exchange IQ™</strong></div>
        <div className="agent-rollout-activity">
          <p>› Evaluating Blackstone Mill Lofts</p>
          <ul>
            <li><Check /> Capacity verified <strong>Pass</strong></li>
            <li><Check /> Trade-up rule <strong>Pass</strong></li>
            <li><Check /> ROE improvement <strong>+4.8 pp</strong></li>
          </ul>
          <div><i /> Financially stronger match found</div>
        </div>
      </aside>

      <aside className="agent-rollout-window agent-rollout-window--listing" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>Qualified match</strong></div>
        <div className="agent-rollout-listing__visual"><ImageOff /><span>No photos provided</span></div>
        <div className="agent-rollout-listing__details"><small>Multifamily · Providence, RI</small><strong>Blackstone Mill Lofts</strong><dl><div><dt>Asking</dt><dd>$3.8M</dd></div><div><dt>Match</dt><dd>92</dd></div></dl></div>
      </aside>
    </>
  );
}
