import { useEffect, useRef, useState } from "react";
import {
  BellRing,
  Building2,
  Check,
  CircleCheck,
  FileCheck2,
  Landmark,
  MapPin,
  MessageSquareText,
  Radar,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const ILLUSTRATIVE_MATCHES = [
  {
    name: "Blackstone Mill Lofts",
    type: "Multifamily",
    market: "Providence, RI",
    price: "$3.8M",
    capRate: "6.9%",
    score: 92,
    tone: "primary",
  },
  {
    name: "Merrimack Commerce Park",
    type: "Industrial",
    market: "Manchester, NH",
    price: "$4.2M",
    capRate: "7.2%",
    score: 87,
    tone: "secondary",
  },
] as const;

export function AgentSearchPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [storyActive, setStoryActive] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !("IntersectionObserver" in window)) {
      setStoryActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.42) setStoryActive(true);
        if (entry.intersectionRatio < 0.12) setStoryActive(false);
      },
      { threshold: [0, 0.12, 0.42] },
    );

    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={stageRef}
      className={`agent-console-stage${storyActive ? " is-story-active" : ""}`}
    >
      <aside className="agent-story-satellite agent-story-satellite--client" aria-hidden="true">
        <span className="agent-story-satellite__icon"><MessageSquareText /></span>
        <div><small>Client brief updated</small><strong>$1.3M equity confirmed</strong><span>Riverside exchange · just now</span></div>
      </aside>

      <aside className="agent-story-satellite agent-story-satellite--listing" aria-hidden="true">
        <span className="agent-story-satellite__icon"><BellRing /></span>
        <div><small>New listing signal</small><strong>Industrial · 7.2% cap</strong><span>Manchester, NH · $4.2M</span></div>
      </aside>

      <aside className="agent-story-satellite agent-story-satellite--verified" aria-hidden="true">
        <span className="agent-story-satellite__icon"><FileCheck2 /></span>
        <div><small>Exchange readiness</small><strong>Financials verified</strong><span>Search can begin</span></div>
      </aside>

      <figure aria-labelledby="agent-search-preview-caption" className="agent-console">
        <figcaption id="agent-search-preview-caption" className="agent-console__topbar">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="agent-console__workspace">Riverside exchange</span>
          <span className="agent-console__privacy">Private agent workspace</span>
        </figcaption>

        <div className="agent-console__body">
          <section className="agent-console__origin" aria-label="Relinquished property and search criteria">
            <div className="agent-console__origin-heading">
              <div className="agent-console__step">01</div>
              <div><p>Starting point</p><h3>Client property</h3></div>
            </div>

            <article className="agent-origin-card">
              <span className="agent-origin-card__icon"><Building2 aria-hidden="true" /></span>
              <div className="agent-origin-card__title"><small>Relinquished property</small><strong>Riverside Apartments</strong><span><MapPin aria-hidden="true" /> Worcester, MA</span></div>
              <dl>
                <div><dt>Estimated value</dt><dd>$2.4M</dd></div>
                <div><dt>Current loan</dt><dd>$1.1M</dd></div>
                <div className="agent-origin-card__equity"><dt>Estimated equity</dt><dd>$1.3M</dd></div>
              </dl>
            </article>

            <div className="agent-console__criteria">
              <div className="agent-console__criteria-title"><SlidersHorizontal aria-hidden="true" /><span><small>Search criteria</small><strong>What fits next</strong></span></div>
              <div className="agent-console__criteria-tags"><span>New England</span><span>$3.2M–$4.8M</span><span>Income property</span></div>
            </div>
          </section>

          <div className="agent-console__exchange-path" aria-hidden="true">
            <span className="agent-console__path-label">Matching</span>
            <svg viewBox="0 0 170 440" preserveAspectRatio="none">
              <path d="M16 88 C80 88 66 212 130 212 S90 344 156 344" />
              <circle cx="16" cy="88" r="5" />
              <circle cx="130" cy="212" r="5" />
              <circle cx="156" cy="344" r="8" />
            </svg>
          </div>

          <section className="agent-console__opportunities" aria-label="Potential replacement-property matches">
            <div className="agent-console__opportunity-heading">
              <div><p>Matched opportunities</p><h3>Properties worth reviewing</h3></div>
              <span><Sparkles aria-hidden="true" /> 2 potential matches</span>
            </div>

            <div className="agent-console__match-list">
              {ILLUSTRATIVE_MATCHES.map((match, index) => (
                <MatchRow key={match.name} match={match} index={index} />
              ))}
            </div>

            <div className="agent-console__monitoring">
              <span className="agent-console__radar"><Radar aria-hidden="true" /></span>
              <div><small>Search remains active</small><strong>Monitoring for new opportunities</strong></div>
              <i aria-hidden="true" />
            </div>
          </section>
        </div>

        <div className="agent-console-story" aria-hidden="true">
          <aside className="agent-console-story__sidebar">
            <div className="agent-console-story__sidebar-title"><span><Building2 /></span><strong>Riverside exchange</strong></div>
            <div className="agent-console-story__sidebar-item is-active"><Search /><span>Replacement search</span></div>
            <div className="agent-console-story__sidebar-item"><FileCheck2 /><span>Property & financials</span></div>
            <div className="agent-console-story__sidebar-item"><SlidersHorizontal /><span>Exchange criteria</span></div>
            <div className="agent-console-story__sidebar-status"><CircleCheck /><span><small>Search ready</small><strong>3 checks complete</strong></span></div>
          </aside>

          <section className="agent-console-story__main">
            <div className="agent-console-story__heading"><span>Ask ExchangeUp</span><small>Private workspace</small></div>
            <div className="agent-console-story__question"><span>Find replacement properties that improve my client’s return.</span><i /></div>
            <div className="agent-console-story__thinking"><Sparkles /><span>Analyzing equity, debt capacity, return, and exchange criteria</span><i /><i /><i /></div>
            <div className="agent-console-story__answer">
              <div className="agent-console-story__answer-heading"><span><Sparkles /></span><div><small>Exchange search ready</small><strong>2 opportunities fit the exchange</strong></div></div>
              <div className="agent-console-story__metrics">
                <div><small>Available equity</small><strong>$1.3M</strong></div>
                <div><small>Purchase range</small><strong>$3.2M–$4.8M</strong></div>
                <div><small>Priority</small><strong>Better return</strong></div>
              </div>
              <div className="agent-console-story__checks">
                <span><Check /> Capacity verified</span><span><Check /> ROE improves</span><span><Check /> Criteria aligned</span>
              </div>
              <article className="agent-console-story__result">
                <span className="agent-console-story__result-rank">01</span>
                <div><small>Top potential match</small><strong>Blackstone Mill Lofts</strong><span><MapPin /> Providence, RI</span></div>
                <dl><div><dt>Asking</dt><dd>$3.8M</dd></div><div><dt>Cap rate</dt><dd>6.9%</dd></div></dl>
                <span className="agent-console-story__result-score"><strong>92</strong><small>match</small></span>
              </article>
            </div>
          </section>
        </div>

        <div className="agent-console__disclosure">Illustrative product view · no real client information</div>
      </figure>
    </div>
  );
}

function MatchRow({
  match,
  index,
}: {
  match: (typeof ILLUSTRATIVE_MATCHES)[number];
  index: number;
}) {
  return (
    <article className={`agent-match-row agent-match-row--${match.tone}`}>
      <div className="agent-match-row__index">0{index + 1}</div>
      <div className="agent-match-row__property">
        <small>{match.type}</small>
        <h4>{match.name}</h4>
        <span><MapPin aria-hidden="true" /> {match.market}</span>
      </div>
      <dl>
        <div><dt><Landmark aria-hidden="true" /> Asking</dt><dd>{match.price}</dd></div>
        <div><dt><TrendingUp aria-hidden="true" /> Cap rate</dt><dd>{match.capRate}</dd></div>
      </dl>
      <div className="agent-match-row__score" aria-label={`${match.score} match score`}><strong>{match.score}</strong><span>match</span></div>
      <div className="agent-match-row__fit"><Check aria-hidden="true" /> Within range</div>
    </article>
  );
}
