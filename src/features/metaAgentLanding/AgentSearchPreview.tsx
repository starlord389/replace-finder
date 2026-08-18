import {
  Building2,
  Check,
  Landmark,
  MapPin,
  Radar,
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
  return (
    <div className="agent-console-stage">
      <aside className="agent-rollout-window agent-rollout-window--conversation" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong># private-search</strong></div>
        <div className="agent-rollout-chat">
          <span className="agent-rollout-chat__avatar">ET</span>
          <div><strong>Elaine Thomas</strong><small>10:24 AM</small><p>Keep the search focused on Northeast income properties with stronger cash flow.</p></div>
        </div>
        <div className="agent-rollout-chat agent-rollout-chat--system">
          <span className="agent-rollout-chat__mark">UP</span>
          <div><strong>ExchangeUp</strong><small>10:24 AM</small><p>Exchange criteria updated for the agent workspace.</p></div>
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
