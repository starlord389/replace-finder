import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Mail,
  MapPin,
  Phone,
  Radar,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";

type LivePhase = "request" | "analyzing" | "results" | "property" | "financials" | "match" | "contact";

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
      setLivePhase("analyzing");
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
      timers.push(window.setTimeout(() => active && setLivePhase("analyzing"), 350));
      timers.push(window.setTimeout(() => active && setLivePhase("results"), 3500));
      timers.push(window.setTimeout(() => active && setLivePhase("property"), 7800));
      timers.push(window.setTimeout(() => active && setLivePhase("financials"), 12300));
      timers.push(window.setTimeout(() => active && setLivePhase("match"), 16800));
      timers.push(window.setTimeout(() => active && setLivePhase("contact"), 21300));
      timers.push(window.setTimeout(runCycle, 29300));
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
    <div ref={stageRef} className="agent-console-stage">
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
              <div><small>Active client workspace</small><strong>Elaine Thomas</strong></div>
              <span className="agent-live-demo__active"><i /> Active</span>
            </div>

            <article className="agent-live-client-summary">
              <div className="agent-live-client-summary__heading">
                <span>ET</span>
                <div><small>Riverside exchange</small><strong>42 days remaining</strong></div>
              </div>
              <div className="agent-live-client-summary__property">
                <img src="/mf-4.jpg" alt="Riverside Apartments property" />
                <div><small>Property being sold</small><strong>Riverside Apartments</strong><p><MapPin /> Worcester, MA</p></div>
              </div>
              <dl>
                <div><dt>Estimated equity</dt><dd>$1.3M</dd></div>
                <div><dt>Buying range</dt><dd>Up to $4.8M</dd></div>
              </dl>
            </article>

            <article className="agent-live-search-brief">
              <div className="agent-live-search-brief__label"><span>Search brief</span><time>Ready</time></div>
              <strong>Find a stronger replacement for this client</strong>
              <ul>
                <li><Check /> Within the $4.8M buying range</li>
                <li><Check /> Must improve the current 12.4% ROE</li>
                <li><Check /> New England income property</li>
              </ul>
              <div className="agent-live-search-brief__status">
                {livePhase === "request" && <><i /> Search brief ready</>}
                {livePhase === "analyzing" && <><Radar /> Ranking replacements</>}
                {(livePhase === "results" || livePhase === "property" || livePhase === "financials" || livePhase === "match" || livePhase === "contact") && <><CircleCheck /> 2 options ready</>}
              </div>
            </article>
            </aside>

            <section className="agent-live-demo__workspace">
            <div className="agent-live-demo__workspace-heading">
              <div><small>Replacement search</small><strong>Riverside exchange</strong></div>
              <span><i /> {(livePhase === "property" || livePhase === "financials" || livePhase === "match" || livePhase === "contact") ? "Reviewing match" : "Search always on"}</span>
            </div>

            <div className="agent-live-demo__request-line">
              <span><UserRound /></span>
              <p><small>Client objective</small><strong>Find a better-performing replacement for Riverside Apartments</strong></p>
              <div><small>Buying range</small><strong>Up to $4.8M</strong></div>
            </div>

            <div className="agent-live-demo__canvas">
              <section className="agent-live-scene agent-live-scene--request">
                <span className="agent-live-scene__icon"><Search /></span>
                <small>Property + goals connected</small>
                <h3>Turn one listing into a focused 1031 search</h3>
                <p>ExchangeUp uses the property, equity, buying range, and return goal to find qualified replacements.</p>
                <button type="button" className="agent-live-scene__start" onClick={() => setLivePhase("analyzing")}><Sparkles /> Find qualified replacements <ArrowRight /></button>
              </section>

              <section className="agent-live-scene agent-live-scene--analysis">
                <div className="agent-live-analysis__heading"><span><Sparkles /></span><div><small>ExchangeUp matching engine</small><h3>Calculating buying power and financial fit</h3></div><i /></div>
                <div className="agent-live-analysis__progress"><span /></div>
                <div className="agent-live-analysis__steps">
                  <AnalysisStep index="01" label="Available client equity" value="$1.3M" />
                  <AnalysisStep index="02" label="Modeled buying range" value="Up to $4.8M" />
                  <AnalysisStep index="03" label="Minimum return target" value="Above 12.4% ROE" />
                  <AnalysisStep index="04" label="Market and asset fit" value="New England · Income" />
                </div>
              </section>

              <section className="agent-live-scene agent-live-scene--results">
                <div className="agent-live-results__heading">
                  <div><small>Ranked for Elaine's 1031 exchange</small><h3>2 replacements worth presenting</h3></div>
                  <span><CircleCheck /> Financially qualified</span>
                </div>
                <div className="agent-live-results__filters"><span>Buying range <b>$4.8M</b></span><span>Best upside <b>+$33K/yr</b></span><span><Radar /> Search stays live</span></div>
                <div className="agent-live-results__list">
                  {ILLUSTRATIVE_MATCHES.map((match, index) => (
                    <LiveMatchCard
                      key={match.name}
                      match={match}
                      index={index}
                      onSelect={() => {
                        setSelectedMatchIndex(index);
                        setLivePhase("property");
                      }}
                    />
                  ))}
                </div>
              </section>

              <section className="agent-live-scene agent-live-scene--review" aria-live="polite">
                <div className="agent-live-review__toolbar">
                  <button type="button" className="agent-live-review__back" onClick={() => setLivePhase("results")}><ArrowLeft /> All matches</button>
                  <div className="agent-live-review__tabs" role="tablist" aria-label="Property review">
                    <button type="button" role="tab" aria-selected={livePhase === "property"} onClick={() => setLivePhase("property")}>Property</button>
                    <button type="button" role="tab" aria-selected={livePhase === "financials"} onClick={() => setLivePhase("financials")}>Financials</button>
                    <button type="button" role="tab" aria-selected={livePhase === "match"} onClick={() => setLivePhase("match")}>Why it fits</button>
                    <button type="button" role="tab" aria-selected={livePhase === "contact"} onClick={() => setLivePhase("contact")}>Contact agent</button>
                  </div>
                </div>

                <div className="agent-live-review__panels">
                  <section className="agent-live-review__panel agent-live-review__panel--property">
                    <div className="agent-live-property-overview__media">
                      <img src={selectedMatch.image} alt={`${selectedMatch.name} property`} />
                      <span>{selectedMatch.type}</span>
                    </div>
                    <div className="agent-live-property-overview__body">
                      <div className="agent-live-property-overview__heading">
                        <div><small>Property details</small><h3>{selectedMatch.name}</h3><p><MapPin /> {selectedMatch.market}</p></div>
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
                      <div className="agent-live-comparison__heading"><div><small>Financial comparison</small><h4>Current property vs. replacement</h4></div><span><TrendingUp /> {selectedMatch.cashFlowChange} cash flow</span></div>
                      <div className="agent-live-comparison__labels"><span>Metric</span><span>Current</span><span>Replacement</span><span>Change</span></div>
                      <ComparisonRow label="Return on equity" current={selectedMatch.currentRoe} replacement={selectedMatch.projectedRoe} change={selectedMatch.roe.replace(" ROE", "")} />
                      <ComparisonRow label="Net operating income" current={selectedMatch.currentNoi} replacement={selectedMatch.projectedNoi} change={selectedMatch.noiChange} />
                      <ComparisonRow label="Annual cash flow" current={selectedMatch.currentCashFlow} replacement={selectedMatch.projectedCashFlow} change={selectedMatch.cashFlowChange} />
                    </div>
                    <div className="agent-live-financials__outcome"><CircleCheck /><span><small>Modeled client outcome</small><strong>Higher return and {selectedMatch.cashFlowChange} in annual cash flow</strong></span></div>
                  </section>

                  <section className="agent-live-review__panel agent-live-review__panel--match">
                    <div className="agent-live-match-explainer__heading"><div><small>Match rationale</small><h3>Why {selectedMatch.name} fits</h3></div><span>{selectedMatch.score}% fit</span></div>
                    <div className="agent-live-match-explainer__grid">
                      <article>
                        <small>Financial fit</small>
                        <ul>
                          <li><CircleCheck /><span><strong>Within buying range</strong><small>{selectedMatch.price} asking price</small></span></li>
                          <li><CircleCheck /><span><strong>Improves return</strong><small>{selectedMatch.roe.replace(" ROE", "")} projected lift</small></span></li>
                          <li><CircleCheck /><span><strong>Financing fits</strong><small>{selectedMatch.ltv}</small></span></li>
                        </ul>
                      </article>
                      <aside>
                        <small>Location fit</small>
                        <h4>{selectedMatch.market}</h4>
                        <div className="agent-live-location-route"><i /><span /><i /></div>
                        <p><strong>Worcester, MA</strong><span>Current property</span></p>
                        <p><strong>{selectedMatch.market}</strong><span>Target market match</span></p>
                      </aside>
                    </div>
                  </section>

                  <section className="agent-live-review__panel agent-live-review__panel--contact">
                    <div className="agent-live-contact__heading"><div><small>Listing representative</small><h3>Reach the agent for this property</h3></div><span><i /> Available</span></div>
                    <div className="agent-live-contact__card">
                      <div className="agent-live-contact__identity"><span>JL</span><div><strong>Jordan Lee</strong><p>Northeast Commercial Realty</p><small>Listing agent for {selectedMatch.name}</small></div></div>
                      <div className="agent-live-contact__property"><img src={selectedMatch.image} alt="" /><span><small>Regarding</small><strong>{selectedMatch.name}</strong><p>{selectedMatch.price} · {selectedMatch.market}</p></span></div>
                      <div className="agent-live-contact__actions"><button type="button"><Mail /> Message listing agent</button><button type="button"><Phone /> View contact</button></div>
                    </div>
                    <div className="agent-live-contact__note"><CircleCheck /><span><small>You stay in control</small><strong>Your client’s details remain private until you choose to share them.</strong></span></div>
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
          <span><small>Cash-flow lift</small><strong>{match.cashFlowChange}</strong></span>
        </div>
      </div>
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
