import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Mail,
  MapPin,
  Radar,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";

type LivePhase =
  | "request"
  | "analyzing"
  | "results"
  | "property"
  | "financials"
  | "match"
  | "contact"
  | "conversation"
  | "sent";

export const ILLUSTRATIVE_DEAL_ASSUMPTIONS = {
  maximumLtv: 0.75,
  mortgageRate: 0.07,
  amortizationYears: 25,
  roeImprovementForFullScore: 5,
} as const;

export function amortizedAnnualPayment(principal: number, annualRate: number, years: number) {
  if (principal <= 0 || years <= 0) return 0;
  const monthlyRate = annualRate / 12;
  const payments = years * 12;
  if (monthlyRate === 0) return principal / years;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -payments)) * 12;
}

const moneyMillions = (value: number) => `$${(value / 1_000_000).toFixed(2)}M`;
const moneyThousands = (value: number) => `$${Math.round(value / 1_000)}K`;
const signedMoneyThousands = (value: number) => `${value >= 0 ? "+" : "-"}$${Math.round(Math.abs(value) / 1_000)}K / yr`;
const percentage = (value: number) => `${(value * 100).toFixed(1)}%`;
const signedPercentagePoints = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)} pp`;

const CURRENT_PROPERTY_VALUES = {
  value: 2_400_000,
  loan: 1_200_000,
  noi: 180_000,
  annualDebtService: 102_000,
} as const;

const currentEquity = CURRENT_PROPERTY_VALUES.value - CURRENT_PROPERTY_VALUES.loan;
const currentCashFlow = CURRENT_PROPERTY_VALUES.noi - CURRENT_PROPERTY_VALUES.annualDebtService;
const currentRoe = currentCashFlow / currentEquity;
const purchasingCapacity = currentEquity / (1 - ILLUSTRATIVE_DEAL_ASSUMPTIONS.maximumLtv);

export const CURRENT_PROPERTY = {
  address: "214 Shrewsbury Street",
  market: "Worcester, MA",
  raw: { ...CURRENT_PROPERTY_VALUES, equity: currentEquity, cashFlow: currentCashFlow, roe: currentRoe, purchasingCapacity },
  value: moneyMillions(CURRENT_PROPERTY_VALUES.value),
  loan: moneyMillions(CURRENT_PROPERTY_VALUES.loan),
  equity: moneyMillions(currentEquity),
  ltv: percentage(CURRENT_PROPERTY_VALUES.loan / CURRENT_PROPERTY_VALUES.value),
  noi: moneyThousands(CURRENT_PROPERTY_VALUES.noi),
  debtService: moneyThousands(CURRENT_PROPERTY_VALUES.annualDebtService),
  cashFlow: moneyThousands(currentCashFlow),
  roe: percentage(currentRoe),
  buyingRange: moneyMillions(purchasingCapacity),
} as const;

type MatchSeed = {
  address: string;
  type: string;
  market: string;
  image: string;
  price: number;
  noi: number;
  qualityAdjustment: number;
};

export function buildIllustrativeMatch(seed: MatchSeed) {
  const replacementLoan = seed.price - currentEquity;
  const ltv = replacementLoan / seed.price;
  const debtService = amortizedAnnualPayment(
    replacementLoan,
    ILLUSTRATIVE_DEAL_ASSUMPTIONS.mortgageRate,
    ILLUSTRATIVE_DEAL_ASSUMPTIONS.amortizationYears,
  );
  const cashFlow = seed.noi - debtService;
  const roe = cashFlow / currentEquity;
  const roeImprovement = (roe - currentRoe) * 100;
  const roeComponent = Math.min(100, Math.max(0, roeImprovement / ILLUSTRATIVE_DEAL_ASSUMPTIONS.roeImprovementForFullScore * 100));
  const score = Math.round(Math.min(100, roeComponent * 0.7 + 100 * 0.3 + seed.qualityAdjustment));
  const cashBoot = Math.max(0, currentEquity - seed.price);
  const mortgageBoot = Math.max(0, CURRENT_PROPERTY_VALUES.loan - replacementLoan);

  return {
    ...seed,
    raw: { replacementLoan, ltv, debtService, cashFlow, roe, roeImprovement, cashBoot, mortgageBoot, score },
    price: moneyMillions(seed.price),
    capRate: percentage(seed.noi / seed.price),
    noi: moneyThousands(seed.noi),
    equity: moneyMillions(currentEquity),
    loan: moneyMillions(replacementLoan),
    debtService: moneyThousands(debtService),
    cashFlow: moneyThousands(cashFlow),
    roe: percentage(roe),
    roeImprovement: signedPercentagePoints(roeImprovement),
    ltv: percentage(ltv),
    valueIncrease: `+$${((seed.price - CURRENT_PROPERTY_VALUES.value) / 1_000_000).toFixed(2)}M`,
    noiChange: signedMoneyThousands(seed.noi - CURRENT_PROPERTY_VALUES.noi),
    cashFlowChange: signedMoneyThousands(cashFlow - currentCashFlow),
    estimatedBoot: moneyThousands(cashBoot + mortgageBoot),
    score,
  };
}

export const ILLUSTRATIVE_MATCHES = [
  buildIllustrativeMatch({
    address: "184 River Avenue",
    type: "Multifamily",
    market: "Providence, RI",
    image: "/mf-1.jpg",
    price: 4_000_000,
    noi: 364_000,
    qualityAdjustment: 3,
  }),
  buildIllustrativeMatch({
    address: "675 Harvey Road",
    type: "Industrial",
    market: "Manchester, NH",
    image: "/landing-prop-industrial.jpg",
    price: 4_400_000,
    noi: 390_000,
    qualityAdjustment: 3,
  }),
] as const;

export function AgentSearchPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const manualOverrideRef = useRef(false);
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
      manualOverrideRef.current = false;
      setCycle((value) => value + 1);
      setSelectedMatchIndex(0);
      setLivePhase("request");
      const advance = (phase: LivePhase) => active && !manualOverrideRef.current && setLivePhase(phase);
      timers.push(window.setTimeout(() => advance("analyzing"), 350));
      timers.push(window.setTimeout(() => advance("results"), 3900));
      timers.push(window.setTimeout(() => advance("property"), 8200));
      timers.push(window.setTimeout(() => advance("financials"), 12100));
      timers.push(window.setTimeout(() => advance("match"), 16900));
      timers.push(window.setTimeout(() => advance("contact"), 21700));
      timers.push(window.setTimeout(() => advance("conversation"), 25000));
      timers.push(window.setTimeout(() => advance("sent"), 29800));
      timers.push(window.setTimeout(() => {
        if (active && !manualOverrideRef.current) runCycle();
      }, 35600));
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
          manualOverrideRef.current = false;
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

  const isReviewing = ["property", "financials", "match", "contact", "conversation", "sent"].includes(livePhase);
  const hasResults = !["request", "analyzing"].includes(livePhase);
  const setManualPhase = (phase: LivePhase) => {
    manualOverrideRef.current = true;
    setLivePhase(phase);
  };

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
                {livePhase === "request" && <><i /> Search brief ready</>}
                {livePhase === "analyzing" && <><Radar /> Ranking replacements</>}
                {hasResults && <><CircleCheck /> 2 options ready</>}
              </div>
            </article>
            </aside>

            <section className="agent-live-demo__workspace">
            <div className="agent-live-demo__workspace-heading">
              <div><small>Replacement search</small><strong>Riverside exchange</strong></div>
              <span><i /> {isReviewing ? (livePhase === "sent" ? "Agent contacted" : "Reviewing match") : "Search always on"}</span>
            </div>

            <div className="agent-live-demo__request-line">
              <span><UserRound /></span>
              <p><small>Client objective</small><strong>Improve the return from {CURRENT_PROPERTY.address}</strong></p>
              <div><small>Buying range</small><strong>Up to {CURRENT_PROPERTY.buyingRange}</strong></div>
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
                  <AnalysisStep index="01" label="Sale value − current loan" value={`${CURRENT_PROPERTY.value} − ${CURRENT_PROPERTY.loan} = ${CURRENT_PROPERTY.equity} equity`} />
                  <AnalysisStep index="02" label="Buying power at 75% max LTV" value={`${CURRENT_PROPERTY.equity} ÷ 25% = ${CURRENT_PROPERTY.buyingRange}`} />
                  <AnalysisStep index="03" label="Current return baseline" value={`${CURRENT_PROPERTY.cashFlow} cash flow ÷ ${CURRENT_PROPERTY.equity} equity = ${CURRENT_PROPERTY.roe} ROE`} />
                  <AnalysisStep index="04" label="Replacement requirements" value="Trade up · improve ROE · New England income" />
                </div>
              </section>

              <section className="agent-live-scene agent-live-scene--results">
                <div className="agent-live-results__heading">
                  <div><small>Ranked for Elaine's 1031 exchange</small><h3>2 replacements worth presenting</h3></div>
                  <span><CircleCheck /> Financially qualified</span>
                </div>
                <div className="agent-live-results__filters"><span>Buying range <b>{CURRENT_PROPERTY.buyingRange}</b></span><span>Best cash-flow lift <b>+$49K/yr</b></span><span><Radar /> Search stays live</span></div>
                <div className="agent-live-results__list">
                  {ILLUSTRATIVE_MATCHES.map((match, index) => (
                    <LiveMatchCard
                      key={match.address}
                      match={match}
                      index={index}
                      onSelect={() => {
                        setSelectedMatchIndex(index);
                        setManualPhase("property");
                      }}
                    />
                  ))}
                </div>
              </section>

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
      <button type="button" className="agent-live-match-card__action" onClick={onSelect} aria-label={`Review ${match.address} comparison`} />
      <div className="agent-live-match-card__media">
        <img src={match.image} alt={`${match.address} exterior`} />
        <span className="agent-live-match-card__rank">#{index + 1} {index === 0 ? "Best match" : "Strong match"}</span>
        <div className="agent-live-match-card__score"><strong>{match.score}</strong><small>match</small></div>
      </div>
      <div className="agent-live-match-card__body">
        <div className="agent-live-match-card__property">
          <small>{match.type}</small>
          <strong>{match.address}</strong>
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
