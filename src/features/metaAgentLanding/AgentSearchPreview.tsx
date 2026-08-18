import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CircleCheck,
  Gauge,
  MapPin,
  Radar,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";

type LivePhase = "request" | "analyzing" | "results";

const ILLUSTRATIVE_MATCHES = [
  {
    name: "Blackstone Mill Lofts",
    type: "Multifamily",
    market: "Providence, RI",
    price: "$3.8M",
    capRate: "6.9%",
    roe: "+4.8 pts ROE",
    ltv: "65.4% LTV",
    score: 92,
  },
  {
    name: "Merrimack Commerce Park",
    type: "Industrial",
    market: "Manchester, NH",
    price: "$4.2M",
    capRate: "7.2%",
    roe: "+3.9 pts ROE",
    ltv: "69.0% LTV",
    score: 87,
  },
] as const;

export function AgentSearchPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [livePhase, setLivePhase] = useState<LivePhase>("request");
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) {
      setLivePhase("results");
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
      setLivePhase("request");
      timers.push(window.setTimeout(() => active && setLivePhase("analyzing"), 2600));
      timers.push(window.setTimeout(() => active && setLivePhase("results"), 6600));
      timers.push(window.setTimeout(runCycle, 13600));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldRun = entry.intersectionRatio >= 0.28;
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
      { threshold: [0, 0.12, 0.28, 0.55] },
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

      <figure aria-labelledby="agent-search-preview-caption" className="agent-console">
        <figcaption id="agent-search-preview-caption" className="agent-console__topbar">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="agent-console__workspace">Riverside exchange</span>
          <span className="agent-console__privacy">Private agent workspace</span>
        </figcaption>

        <div
          key={cycle}
          className="agent-live-demo"
          data-live-phase={livePhase}
          aria-label="Illustrative live replacement-property matching workflow"
        >
          <aside className="agent-live-demo__inbox">
            <div className="agent-live-demo__inbox-heading">
              <div><small>My clients</small><strong>Elaine Thomas · Matches</strong></div>
              <span>2</span>
            </div>

            <div className="agent-live-demo__scope"><Building2 /><span><small>Active exchange</small><strong>Riverside Apartments</strong></span></div>

            <article className="agent-live-request-card">
              <div className="agent-live-request-card__identity"><span>ET</span><div><strong>Elaine Thomas</strong><small>Client request · just now</small></div></div>
              <p>Find a replacement property that improves cash flow without exceeding our purchasing range.</p>
              <div className="agent-live-request-card__status">
                {livePhase === "request" && <><i /> Request received</>}
                {livePhase === "analyzing" && <><Radar /> Matching in progress</>}
                {livePhase === "results" && <><CircleCheck /> 2 matches ready</>}
              </div>
            </article>

            <article className="agent-live-property-card">
              <div><span><Building2 /></span><div><small>Trading out</small><strong>Riverside Apartments</strong><p><MapPin /> Worcester, MA</p></div></div>
              <dl><div><dt>Value</dt><dd>$2.4M</dd></div><div><dt>Loan</dt><dd>$1.1M</dd></div><div><dt>Equity</dt><dd>$1.3M</dd></div></dl>
            </article>
          </aside>

          <section className="agent-live-demo__workspace">
            <div className="agent-live-demo__workspace-heading">
              <div><small>Replacement search</small><strong>Riverside exchange</strong></div>
              <span><i /> Live monitoring</span>
            </div>

            <div className="agent-live-demo__request-line">
              <span><UserRound /></span>
              <p>Find a replacement property that improves cash flow without exceeding our purchasing range.</p>
            </div>

            <div className="agent-live-demo__canvas">
              <section className="agent-live-scene agent-live-scene--request">
                <span className="agent-live-scene__icon"><Search /></span>
                <small>Client request received</small>
                <h3>Ready to search the network</h3>
                <p>ExchangeUp will compare the current property, financing capacity, return, and optional criteria.</p>
                <div className="agent-live-scene__start"><Sparkles /> Preparing the exchange search <ArrowRight /></div>
              </section>

              <section className="agent-live-scene agent-live-scene--analysis">
                <div className="agent-live-analysis__heading"><span><Sparkles /></span><div><small>ExchangeUp Matching Engine</small><h3>Evaluating eligible replacements</h3></div><i /></div>
                <div className="agent-live-analysis__progress"><span /></div>
                <div className="agent-live-analysis__steps">
                  <AnalysisStep index="01" label="Equity and purchasing capacity" value="$4.8M ceiling" />
                  <AnalysisStep index="02" label="Trade-up requirement" value="Qualified" />
                  <AnalysisStep index="03" label="Projected return on equity" value="Improvement required" />
                  <AnalysisStep index="04" label="Location and property criteria" value="New England · Income" />
                </div>
              </section>

              <section className="agent-live-scene agent-live-scene--results">
                <div className="agent-live-results__heading">
                  <div><small>Elaine Thomas · Riverside Apartments</small><h3>2 qualified matches</h3></div>
                  <span><CircleCheck /> Search complete</span>
                </div>
                <div className="agent-live-results__filters"><span>All <b>2</b></span><span>New <b>2</b></span><span><TrendingUp /> Best match</span></div>
                <div className="agent-live-results__list">
                  {ILLUSTRATIVE_MATCHES.map((match, index) => <LiveMatchCard key={match.name} match={match} index={index} />)}
                </div>
                <div className="agent-live-results__monitor"><Radar /><span><small>Search remains active</small><strong>Monitoring for new qualifying opportunities</strong></span><i /></div>
              </section>
            </div>
          </section>
        </div>

        <div className="agent-console__disclosure">Illustrative live product demo · no real client information</div>
      </figure>
    </div>
  );
}

function RolloutWindows() {
  return (
    <>
      <aside className="agent-rollout-window agent-rollout-window--conversation" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong># client-request</strong></div>
        <div className="agent-rollout-chat">
          <span className="agent-rollout-chat__avatar">ET</span>
          <div><strong>Elaine Thomas</strong><small>10:24 AM</small><p>Focus on Northeast properties with stronger cash flow.</p></div>
        </div>
        <div className="agent-rollout-chat agent-rollout-chat--system">
          <span className="agent-rollout-chat__mark">UP</span>
          <div><strong>ExchangeUp</strong><small>10:24 AM</small><p>The matching engine is reviewing the exchange.</p></div>
        </div>
      </aside>

      <aside className="agent-rollout-window agent-rollout-window--activity" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>Exchange analysis</strong></div>
        <div className="agent-rollout-activity">
          <p><span>›</span> Preparing Riverside replacement search</p>
          <ul><li><Check /> Equity calculated <strong>$1.3M</strong></li><li><Check /> Purchase range verified</li><li><Check /> Return improvement required</li></ul>
          <div><i /> Monitoring eligible inventory</div>
        </div>
      </aside>

      <aside className="agent-rollout-window agent-rollout-window--listing" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>New opportunity</strong></div>
        <div className="agent-rollout-listing__visual"><Building2 /><span>Potential match</span></div>
        <div className="agent-rollout-listing__details"><small>Industrial · Manchester, NH</small><strong>Merrimack Commerce Park</strong><dl><div><dt>Asking</dt><dd>$4.2M</dd></div><div><dt>Cap rate</dt><dd>7.2%</dd></div></dl></div>
      </aside>
    </>
  );
}

function AnalysisStep({ index, label, value }: { index: string; label: string; value: string }) {
  return (
    <div className="agent-live-analysis__step">
      <span>{index}</span><div><strong>{label}</strong><small>{value}</small></div><i><Check /></i>
    </div>
  );
}

function LiveMatchCard({
  match,
  index,
}: {
  match: (typeof ILLUSTRATIVE_MATCHES)[number];
  index: number;
}) {
  return (
    <article className="agent-live-match-card">
      <div className="agent-live-match-card__property">
        <span className="agent-live-match-card__placeholder"><Building2 /></span>
        <div><small>#{index + 1} · {match.type}</small><strong>{match.name}</strong><p><MapPin /> {match.market}</p></div>
      </div>
      <div className="agent-live-match-card__financials"><span><small>Asking</small><strong>{match.price}</strong></span><span><small>Cap rate</small><strong>{match.capRate}</strong></span></div>
      <div className="agent-live-match-card__score"><strong>{match.score}</strong><small>match</small></div>
      <div className="agent-live-match-card__footer"><span><Gauge /> {match.roe} · {match.ltv}</span><b>New</b><strong>Review match <ArrowRight /></strong></div>
    </article>
  );
}
