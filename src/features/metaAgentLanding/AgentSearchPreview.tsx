import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleCheck,
  Gauge,
  MapPin,
  MousePointer2,
  Radar,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";

type LivePhase = "request" | "analyzing" | "results" | "detail";

const ILLUSTRATIVE_MATCHES = [
  {
    name: "Blackstone Mill Lofts",
    type: "Multifamily",
    market: "Providence, RI",
    image: "/mf-1.jpg",
    price: "$3.8M",
    capRate: "6.9%",
    noi: "$262K",
    roe: "+4.8 pts ROE",
    ltv: "65.4% LTV",
    score: 92,
    currentRoe: "12.4%",
    projectedRoe: "17.2%",
    currentNoi: "$180K",
    projectedNoi: "$262K",
    noiChange: "+$82K / yr",
    currentCashFlow: "$68K",
    projectedCashFlow: "$101K",
    cashFlowChange: "+$33K / yr",
  },
  {
    name: "Merrimack Commerce Park",
    type: "Industrial",
    market: "Manchester, NH",
    image: "/landing-prop-industrial.jpg",
    price: "$4.2M",
    capRate: "7.2%",
    noi: "$302K",
    roe: "+3.9 pts ROE",
    ltv: "69.0% LTV",
    score: 87,
    currentRoe: "12.4%",
    projectedRoe: "16.3%",
    currentNoi: "$180K",
    projectedNoi: "$302K",
    noiChange: "+$122K / yr",
    currentCashFlow: "$68K",
    projectedCashFlow: "$96K",
    cashFlowChange: "+$28K / yr",
  },
] as const;

export function AgentSearchPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [livePhase, setLivePhase] = useState<LivePhase>("request");
  const [cycle, setCycle] = useState(0);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const selectedMatch = ILLUSTRATIVE_MATCHES[selectedMatchIndex];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) {
      setLivePhase("detail");
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
      setSelectedMatchIndex(0);
      setLivePhase("request");
      timers.push(window.setTimeout(() => active && setLivePhase("analyzing"), 2600));
      timers.push(window.setTimeout(() => active && setLivePhase("results"), 6600));
      timers.push(window.setTimeout(() => active && setLivePhase("detail"), 11000));
      timers.push(window.setTimeout(runCycle, 18200));
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
          <div className="agent-live-demo__camera">
            <aside className="agent-live-demo__inbox">
            <div className="agent-live-demo__inbox-heading">
              <div><small>My clients</small><strong>Active client workspace</strong></div>
              <span>7</span>
            </div>

            <article className="agent-live-client-profile">
              <div className="agent-live-client-profile__identity">
                <span>ET<i /></span>
                <div><small>Selected client</small><strong>Elaine Thomas</strong><p>Property owner · Worcester, MA</p></div>
              </div>
              <dl>
                <div><dt>Exchange</dt><dd><i /> Active</dd></div>
                <div><dt>Deadline</dt><dd>42 days</dd></div>
              </dl>
            </article>

            <article className="agent-live-request-card">
              <div className="agent-live-request-card__label"><span>Latest client request</span><time>Just now</time></div>
              <strong>Replacement priorities</strong>
              <p>Find a replacement property that improves cash flow without exceeding our purchasing range.</p>
              <div className="agent-live-request-card__status">
                {livePhase === "request" && <><i /> Request received</>}
                {livePhase === "analyzing" && <><Radar /> Matching in progress</>}
                {(livePhase === "results" || livePhase === "detail") && <><CircleCheck /> 2 matches ready</>}
              </div>
            </article>

            <article className="agent-live-property-card">
              <div className="agent-live-property-card__summary"><img src="/mf-4.jpg" alt="Riverside Apartments property" /><div><small>Trading out</small><strong>Riverside Apartments</strong><p><MapPin /> Worcester, MA</p></div></div>
              <dl><div><dt>Value</dt><dd>$2.4M</dd></div><div><dt>Loan</dt><dd>$1.1M</dd></div><div><dt>Equity</dt><dd>$1.3M</dd></div></dl>
              <div className="agent-live-property-card__footer"><span><i /> Search active</span><strong>2 matches</strong></div>
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
                  {ILLUSTRATIVE_MATCHES.map((match, index) => (
                    <LiveMatchCard
                      key={match.name}
                      match={match}
                      index={index}
                      onSelect={() => {
                        setSelectedMatchIndex(index);
                        setLivePhase("detail");
                      }}
                    />
                  ))}
                </div>
                <div className="agent-live-results__monitor"><Radar /><span><small>Search remains active</small><strong>Monitoring for new qualifying opportunities</strong></span><i /></div>
              </section>

              <section className="agent-live-scene agent-live-scene--detail" aria-live="polite">
                <div className="agent-live-detail__toolbar">
                  <button type="button" onClick={() => setLivePhase("results")}><ArrowLeft /> All matches</button>
                  <span>Match #{selectedMatchIndex + 1} of 2</span>
                </div>

                <div className="agent-live-detail__property">
                  <img src={selectedMatch.image} alt={`${selectedMatch.name} property`} />
                  <div>
                    <small>{selectedMatch.type} · {selectedMatch.market}</small>
                    <h3>{selectedMatch.name}</h3>
                    <p><strong>{selectedMatch.price}</strong><span>{selectedMatch.capRate} cap</span><span>{selectedMatch.noi} NOI</span></p>
                  </div>
                  <div className="agent-live-detail__score"><strong>{selectedMatch.score}</strong><small>match</small></div>
                </div>

                <div className="agent-live-detail__content">
                  <div className="agent-live-comparison">
                    <div className="agent-live-comparison__heading"><div><small>Financial opportunity</small><h4>Current vs. replacement</h4></div><span><TrendingUp /> Stronger return</span></div>
                    <div className="agent-live-comparison__labels"><span>Metric</span><span>Current</span><span>Replacement</span><span>Change</span></div>
                    <ComparisonRow label="Return on equity" current={selectedMatch.currentRoe} replacement={selectedMatch.projectedRoe} change={selectedMatch.roe.replace(" ROE", "")} />
                    <ComparisonRow label="Net operating income" current={selectedMatch.currentNoi} replacement={selectedMatch.projectedNoi} change={selectedMatch.noiChange} />
                    <ComparisonRow label="Annual cash flow" current={selectedMatch.currentCashFlow} replacement={selectedMatch.projectedCashFlow} change={selectedMatch.cashFlowChange} />
                  </div>

                  <aside className="agent-live-detail__reasons">
                    <small>Why this matched</small>
                    <h4>A qualified trade-up</h4>
                    <ul>
                      <li><CircleCheck /><span><strong>Within purchasing range</strong><small>{selectedMatch.price} asking price</small></span></li>
                      <li><CircleCheck /><span><strong>Improves return on equity</strong><small>{selectedMatch.roe.replace(" ROE", "")} projected lift</small></span></li>
                      <li><CircleCheck /><span><strong>Financing fits the model</strong><small>{selectedMatch.ltv}</small></span></li>
                    </ul>
                  </aside>
                </div>

                <div className="agent-live-detail__footer"><span><CircleCheck /> This opportunity improves the client’s modeled position.</span><button type="button">Review full match <ArrowRight /></button></div>
              </section>
            </div>
            </section>
          </div>

          <span className="agent-live-cursor" aria-hidden="true"><MousePointer2 /><i /></span>
        </div>

        <div className="agent-console__disclosure">Illustrative property data · real property photography · no real client information</div>
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
        <div className="agent-rollout-listing__visual"><img src="/landing-prop-industrial.jpg" alt="" /><span>Potential match</span></div>
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
  onSelect,
}: {
  match: (typeof ILLUSTRATIVE_MATCHES)[number];
  index: number;
  onSelect: () => void;
}) {
  return (
    <article className="agent-live-match-card">
      <button type="button" className="agent-live-match-card__action" onClick={onSelect} aria-label={`Review ${match.name} comparison`} />
      <div className="agent-live-match-card__media">
        <img src={match.image} alt={`${match.name} exterior`} />
        <span className="agent-live-match-card__rank">#{index + 1} {index === 0 ? "Best match" : "Strong match"}</span>
        <div className="agent-live-match-card__score"><strong>{match.score}</strong><small>match</small></div>
      </div>
      <div className="agent-live-match-card__body">
        <div className="agent-live-match-card__property">
          <small>{match.type}</small>
          <strong>{match.name}</strong>
          <p><MapPin /> {match.market}</p>
        </div>
        <div className="agent-live-match-card__financials">
          <span><small>Asking</small><strong>{match.price}</strong></span>
          <span><small>Cap rate</small><strong>{match.capRate}</strong></span>
          <span><small>NOI</small><strong>{match.noi}</strong></span>
        </div>
        <div className="agent-live-match-card__fit">
          <span><TrendingUp /> {match.roe}</span>
          <span><Gauge /> {match.ltv}</span>
        </div>
      </div>
      <div className="agent-live-match-card__footer"><b>New opportunity</b><strong>Review match <ArrowRight /></strong></div>
    </article>
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
