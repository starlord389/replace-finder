import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  DollarSign,
  ImageOff,
  Inbox,
  MapPin,
  MousePointer2,
  Radar,
  Receipt,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";

type JourneyPhase =
  | "dashboard"
  | "scoping"
  | "inbox"
  | "overview"
  | "match"
  | "financials"
  | "next"
  | "sent";

const JOURNEY_TIMELINE: ReadonlyArray<{ phase: JourneyPhase; at: number }> = [
  { phase: "dashboard", at: 0 },
  { phase: "scoping", at: 4_000 },
  { phase: "inbox", at: 7_500 },
  { phase: "overview", at: 11_000 },
  { phase: "match", at: 16_000 },
  { phase: "financials", at: 22_000 },
  { phase: "next", at: 27_000 },
  { phase: "sent", at: 31_500 },
];

const JOURNEY_LENGTH = 37_000;

const MATCHES = [
  {
    name: "Blackstone Mill Lofts",
    market: "Providence, RI",
    type: "Multifamily",
    price: "$3.8M",
    cap: "6.9% cap",
    score: 92,
    status: "New",
  },
  {
    name: "Merrimack Commerce Park",
    market: "Manchester, NH",
    type: "Industrial",
    price: "$4.2M",
    cap: "7.2% cap",
    score: 87,
    status: "New",
  },
] as const;

export function AgentSearchPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<JourneyPhase>("dashboard");
  const [cycle, setCycle] = useState(0);

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

    const runJourney = () => {
      if (!active) return;
      clearTimers();
      setCycle((value) => value + 1);
      setPhase("dashboard");

      JOURNEY_TIMELINE.slice(1).forEach(({ phase: nextPhase, at }) => {
        timers.push(window.setTimeout(() => active && setPhase(nextPhase), at));
      });
      timers.push(window.setTimeout(runJourney, JOURNEY_LENGTH));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldRun = entry.intersectionRatio >= 0.24;
        if (shouldRun && !active) {
          active = true;
          runJourney();
        } else if (!shouldRun && active) {
          active = false;
          clearTimers();
        }
      },
      { threshold: [0, 0.12, 0.24, 0.5] },
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

      <figure aria-labelledby="agent-search-preview-caption" className="agent-console agent-product-console">
        <figcaption id="agent-search-preview-caption" className="agent-product-console__browser">
          <span className="agent-console__browser-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>app.1031exchangeup.com/agent/{phase === "dashboard" ? "dashboard" : "matches"}</span>
          <strong>Secure workspace</strong>
        </figcaption>

        <div
          key={cycle}
          className="agent-product-demo"
          data-journey-phase={phase}
          aria-label="Illustrative live journey through the real ExchangeUp agent match workflow"
        >
          <ProductTopNav phase={phase} />
          <div className="agent-product-demo__workspace">
            {phase === "dashboard" ? <DashboardScene /> : <MatchesWorkspace phase={phase} />}
          </div>
        </div>

        <div className="agent-console__disclosure">Illustrative product demo · representative sample data</div>
      </figure>
    </div>
  );
}

function ProductTopNav({ phase }: { phase: JourneyPhase }) {
  const onDashboard = phase === "dashboard";
  const navItems = ["Launchpad", "Dashboard", "My Clients", "Pipeline", "Listings", "Matches", "Client Requests"];

  return (
    <header className="agent-product-nav">
      <div className="agent-product-nav__brand"><strong>1031Exchange<span>UP</span></strong><i>↗</i><small>Agent</small></div>
      <nav aria-label="Illustrative agent workspace navigation">
        {navItems.map((item) => {
          const active = (item === "Dashboard" && onDashboard) || (item === "Matches" && !onDashboard);
          return (
            <span key={item} className={active ? "is-active" : undefined}>
              {item}
              {item === "Matches" && onDashboard && <b>1</b>}
              {item === "Pipeline" && phase === "sent" && <b>1</b>}
            </span>
          );
        })}
      </nav>
      <div className="agent-product-nav__account">
        <span className="agent-product-nav__mode">Live</span>
        <span className="agent-product-nav__bell"><Bell />{onDashboard && <i>1</i>}</span>
        <span className="agent-product-nav__avatar">E</span>
      </div>
    </header>
  );
}

function DashboardScene() {
  return (
    <section className="agent-demo-dashboard" aria-label="Agent dashboard with a new-match notification">
      <div className="agent-demo-dashboard__heading">
        <div><small>Tuesday, August 18</small><h2>Good morning, Eamon</h2><p>Here is what needs your attention today.</p></div>
        <span><Sparkles /> Agent workspace</span>
      </div>

      <div className="agent-demo-dashboard__kpis">
        <DashboardKpi label="Active clients" value="7" note="2 exchanges active" />
        <DashboardKpi label="Active listings" value="6" note="Across 4 markets" />
        <DashboardKpi label="Matches to review" value="2" note="1 new today" attention />
        <DashboardKpi label="Client requests" value="1" note="Ready for review" />
      </div>

      <div className="agent-demo-dashboard__columns">
        <article className="agent-demo-attention">
          <div className="agent-demo-card-heading"><div><small>Attention center</small><h3>What needs you next</h3></div><span>3 items</span></div>
          <div className="agent-demo-attention__item is-new">
            <span><Inbox /></span><div><strong>New match for Riverside Apartments</strong><p>Blackstone Mill Lofts · Providence, RI</p></div><b>Review match <ArrowRight /></b>
          </div>
          <div className="agent-demo-attention__item">
            <span><UserRound /></span><div><strong>Client response received</strong><p>Elaine is interested in one opportunity.</p></div><b>View request <ArrowRight /></b>
          </div>
          <div className="agent-demo-attention__item">
            <span><Radar /></span><div><strong>3 active searches monitoring</strong><p>ExchangeUp is watching for qualifying properties.</p></div><b>Open matches <ArrowRight /></b>
          </div>
        </article>

        <article className="agent-demo-recent">
          <div className="agent-demo-card-heading"><div><small>Recent opportunities</small><h3>Match activity</h3></div></div>
          <MiniOpportunity name="Blackstone Mill Lofts" meta="Elaine Thomas · 92 match" />
          <MiniOpportunity name="Merrimack Commerce Park" meta="Elaine Thomas · 87 match" />
          <MiniOpportunity name="Westshore Corporate Center" meta="Marcus Reed · In conversation" />
        </article>
      </div>

      <div className="agent-demo-notification">
        <span><Sparkles /></span><div><small>New match found</small><strong>Blackstone Mill Lofts matches Riverside Apartments</strong><p>92 match score · within modeled purchasing capacity</p></div><ArrowRight />
      </div>
      <MousePointer2 className="agent-demo-cursor agent-demo-cursor--dashboard" />
    </section>
  );
}

function DashboardKpi({ label, value, note, attention = false }: { label: string; value: string; note: string; attention?: boolean }) {
  return <article className={attention ? "is-attention" : undefined}><small>{label}</small><strong>{value}</strong><p>{note}</p></article>;
}

function MiniOpportunity({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="agent-demo-recent__row"><span><Building2 /></span><div><strong>{name}</strong><small>{meta}</small></div><ArrowRight /></div>
  );
}

function MatchesWorkspace({ phase }: { phase: Exclude<JourneyPhase, "dashboard"> }) {
  const hasMatches = phase !== "scoping";
  const hasSelection = !["scoping", "inbox"].includes(phase);

  return (
    <section className="agent-demo-matches" aria-label="Agent Matches workspace">
      <div className="agent-demo-matches__heading">
        <div>
          <h2>{phase === "scoping" ? "All matches" : "Elaine Thomas · Matches"}</h2>
          <p>{phase === "scoping" ? "6 matches across 4 listings" : "2 matches across 1 listing"}</p>
        </div>
        {phase === "sent" && <span className="agent-demo-sent-toast"><CheckCircle2 /> Match sent to Elaine</span>}
      </div>

      <div className="agent-demo-scope-banner">
        {phase === "scoping" ? (
          <p>Choose a client and property to focus the Match Inbox.</p>
        ) : (
          <p>Showing matches for <strong>Riverside Apartments</strong></p>
        )}
        <span>{phase === "scoping" ? "Exchange scope" : "Clear"}</span>
      </div>

      <div className="agent-demo-matches__grid">
        <MatchInbox phase={phase} hasMatches={hasMatches} hasSelection={hasSelection} />
        {hasSelection ? <ReviewPanel phase={phase} /> : <MatchEmptyState phase={phase} />}
      </div>
    </section>
  );
}

function MatchInbox({
  phase,
  hasMatches,
  hasSelection,
}: {
  phase: Exclude<JourneyPhase, "dashboard">;
  hasMatches: boolean;
  hasSelection: boolean;
}) {
  return (
    <aside className="agent-demo-inbox">
      <div className="agent-demo-inbox__switchers">
        <ScopePicker kind="client" scoped={phase !== "scoping"} />
        <span>/</span>
        <ScopePicker kind="property" scoped={phase !== "scoping"} />
      </div>

      <div className="agent-demo-inbox__toolbar">
        <span><Search /> Search property or city…</span>
        <b>All <i>{hasMatches ? 2 : 0}</i></b>
        <b><SlidersHorizontal /> Best match</b>
      </div>

      <div className="agent-demo-inbox__meta"><span>Elaine Thomas · Riverside Apartments</span><small>Showing {hasMatches ? 2 : 0} of {hasMatches ? 2 : 0}</small></div>

      <div className="agent-demo-inbox__list">
        {hasMatches ? MATCHES.map((match, index) => (
          <MatchInboxCard key={match.name} match={match} index={index} selected={hasSelection && index === 0} sent={phase === "sent" && index === 0} />
        )) : (
          <div className="agent-demo-inbox__scanning"><Radar /><strong>Applying exchange scope</strong><small>Selecting Elaine Thomas and Riverside Apartments</small></div>
        )}
      </div>

      {phase === "scoping" && <MousePointer2 className="agent-demo-cursor agent-demo-cursor--scope" />}
      {phase === "inbox" && <MousePointer2 className="agent-demo-cursor agent-demo-cursor--match" />}
    </aside>
  );
}

function ScopePicker({ kind, scoped }: { kind: "client" | "property"; scoped: boolean }) {
  const before = kind === "client" ? "All clients" : "All properties";
  const after = kind === "client" ? "Elaine Thomas" : "Riverside Apartments";
  return (
    <div className={`agent-demo-scope-picker agent-demo-scope-picker--${kind}`}>
      <UserRound />
      <span>{scoped ? after : before}</span>
      <ChevronDown />
      {!scoped && (
        <div className="agent-demo-scope-menu">
          <small>{kind === "client" ? "Select a client" : "Select a property"}</small>
          <span>{before}</span>
          <strong><Check /> {after}</strong>
        </div>
      )}
    </div>
  );
}

function MatchInboxCard({
  match,
  index,
  selected,
  sent,
}: {
  match: (typeof MATCHES)[number];
  index: number;
  selected: boolean;
  sent: boolean;
}) {
  return (
    <article className={`agent-demo-match-card${selected ? " is-selected" : ""}`} style={{ "--match-index": index } as CSSProperties}>
      <div className="agent-demo-match-card__main">
        <span className="agent-demo-match-card__image"><ImageOff /><small>No photo</small></span>
        <div><strong>{match.name}</strong><p>{match.market} · {match.type}</p><b>{match.price} <i>·</i> {match.cap}</b></div>
        <span className="agent-demo-match-card__score">{match.score}</span>
      </div>
      <div className="agent-demo-match-card__footer"><span>{sent ? "Sent to Client" : match.status}</span><strong>{sent ? "Awaiting response" : "Send to client"} <ArrowRight /></strong></div>
    </article>
  );
}

function MatchEmptyState({ phase }: { phase: "scoping" | "inbox" }) {
  return (
    <div className="agent-demo-empty">
      <Inbox />
      <strong>{phase === "scoping" ? "Narrowing the Match Inbox" : "Select a match"}</strong>
      <p>{phase === "scoping" ? "Choosing the client and active exchange." : "Pick a property from the inbox to review the deal."}</p>
      {phase === "inbox" && <span><i /> New match ready to review</span>}
    </div>
  );
}

function ReviewPanel({ phase }: { phase: Exclude<JourneyPhase, "dashboard" | "scoping" | "inbox"> }) {
  const tab = phase === "sent" ? "next" : phase;
  const sent = phase === "sent";

  return (
    <article className="agent-demo-review">
      <div className="agent-demo-review__client"><span>ET</span><strong>Elaine Thomas</strong><small>Riverside Apartments</small><i>Trading out · finding replacement property</i></div>
      <div className="agent-demo-review__hero">
        <ImageOff /><small>No property photos provided</small>
        <div><span>Matched</span><b>Investment Property</b></div>
        <section><h3>Blackstone Mill Lofts</h3><p><MapPin /> Providence, RI</p></section>
      </div>
      <div className="agent-demo-review__header">
        <div><strong>$3.8M</strong><span>{sent ? "Sent to Client" : "New Opportunity"}</span><dl><div><dt>Type</dt><dd>Multifamily</dd></div><div><dt>Cap</dt><dd>6.9%</dd></div><div><dt>NOI</dt><dd>$262K</dd></div></dl></div>
        <aside><button><b>92</b><small>Match<br />score</small></button><strong>{sent ? "Awaiting Client" : "Send to Client"} <ArrowRight /></strong></aside>
      </div>
      <div className="agent-demo-review__tabs">
        {["overview", "financials", "location", "match", "docs", "next"].map((item) => (
          <span key={item} className={tab === item ? "is-active" : undefined}>{item === "next" ? "Next steps" : item[0].toUpperCase() + item.slice(1)}</span>
        ))}
      </div>
      <div className="agent-demo-review__content" key={phase}>
        {phase === "overview" && <OverviewView />}
        {phase === "match" && <MatchView />}
        {phase === "financials" && <FinancialsView />}
        {(phase === "next" || phase === "sent") && <NextStepsView sent={sent} />}
      </div>
    </article>
  );
}

function OverviewView() {
  return (
    <section className="agent-demo-overview">
      <div className="agent-demo-section-title"><div><small>Overview</small><h4>Investment snapshot</h4></div><span>Listing information</span></div>
      <div className="agent-demo-overview__grid">
        <article><small>Asking price</small><strong>$3,800,000</strong><p>Within the exchange’s modeled purchasing capacity.</p></article>
        <article><small>Property type</small><strong>Multifamily</strong><p>Income-producing replacement opportunity.</p></article>
        <article><small>Annual NOI</small><strong>$262,000</strong><p>As provided by the listing agent.</p></article>
        <article><small>Occupancy</small><strong>94%</strong><p>Current reported physical occupancy.</p></article>
      </div>
      <div className="agent-demo-overview__note"><CircleCheck /><span><strong>Operating performance is available</strong><small>Review the financials before sending the property to your client.</small></span><ArrowRight /></div>
    </section>
  );
}

function MatchView() {
  return (
    <section className="agent-demo-match-view">
      <div className="agent-demo-score-hero"><span>92</span><div><small>Match Score</small><strong>Ranked #1 of 2 for Elaine Thomas</strong><p>Strong financial improvement within the modeled exchange range.</p></div></div>
      <div className="agent-demo-comparison-heading"><TrendingUp /><span><strong>Financial opportunity comparison</strong><small>Current property compared with this replacement using modeled financing.</small></span><b>Modeled comparison</b></div>
      <div className="agent-demo-comparison-grid">
        <ComparisonCard label="Return on equity" current="12.4%" replacement="17.2%" delta="+4.8 pp" />
        <ComparisonCard label="Net operating income" current="$180K" replacement="$262K" delta="+$82K/yr" />
        <ComparisonCard label="Cash flow after debt" current="$68K" replacement="$101K" delta="+$33K/yr" />
        <ComparisonCard label="Cap rate" current="6.4%" replacement="6.9%" delta="+0.5 pp" />
      </div>
      <div className="agent-demo-why"><strong>Why this matched</strong><span><Check /> $3.8M asking price is within the $4.8M purchasing ceiling</span><span><Check /> Projected return on equity improves by 4.8 percentage points</span><span><Check /> Modeled replacement financing remains below 75% LTV</span></div>
    </section>
  );
}

function ComparisonCard({ label, current, replacement, delta }: { label: string; current: string; replacement: string; delta: string }) {
  return (
    <article><div><strong>{label}</strong><span><TrendingUp /> {delta}</span></div><small>Current property <b>{current}</b></small><i><b /></i><small>Replacement <b>{replacement}</b></small><i className="is-replacement"><b /></i></article>
  );
}

function FinancialsView() {
  return (
    <section className="agent-demo-financials">
      <div className="agent-demo-financials__notice"><CircleCheck /><span><strong>Operating performance is available before connection</strong><small>Review verified listing financials while evaluating the opportunity.</small></span></div>
      <div className="agent-demo-financials__kpis">
        <FinancialKpi icon={DollarSign} label="Gross Income" value="$322K" />
        <FinancialKpi icon={Receipt} label="Expenses" value="$60K" />
        <FinancialKpi icon={Wallet} label="NOI" value="$262K" />
        <FinancialKpi icon={TrendingUp} label="Cap Rate" value="6.9%" />
      </div>
      <div className="agent-demo-financials__statement"><div><strong>Income &amp; Expenses</strong><small>Annual figures supplied by listing agent</small></div><dl><div><dt>Gross Operating Income</dt><dd>$322,000/yr</dd></div><div><dt>Operating Expenses</dt><dd>($60,000)/yr</dd></div><div><dt>Net Operating Income</dt><dd>$262,000/yr</dd></div></dl></div>
    </section>
  );
}

function FinancialKpi({ icon: Icon, label, value }: { icon: typeof DollarSign; label: string; value: string }) {
  return <article><Icon /><small>{label}</small><strong>{value}</strong><span>/year</span></article>;
}

function NextStepsView({ sent }: { sent: boolean }) {
  const stages = ["New Opportunity", "Sent to Client", "Client Interested", "In Conversation", "Offer Sent", "Under Contract", "Closed"];
  return (
    <section className="agent-demo-next">
      <div className="agent-demo-next__card">
        <div><strong>Where this deal stands</strong><span>{sent ? "Sent to Client" : "New Opportunity"}</span></div>
        <ol>
          {stages.map((stage, index) => {
            const complete = sent && index === 0;
            const current = sent ? index === 1 : index === 0;
            return <li key={stage} className={`${complete ? "is-complete" : ""}${current ? " is-current" : ""}`}><span>{complete ? <Check /> : index + 1}</span><small>{stage}</small></li>;
          })}
        </ol>
        <p>{sent ? "Elaine can now review this property in her workspace. You will be notified when she responds." : "Review the opportunity, then send it to Elaine when it is ready for her consideration."}</p>
      </div>
      <button className={`agent-demo-send-button${sent ? " is-sent" : ""}`}>{sent ? <CheckCircle2 /> : <Sparkles />}{sent ? "Sent to Elaine" : "Send to Client"}<ArrowRight /></button>
      <div className="agent-demo-listed-by"><small>Listed by</small><span>VP</span><div><strong>Vasquez Realty Partners</strong><p>Verified listing agent</p></div><b>Contact stays private until your client is interested.</b></div>
      {!sent && <MousePointer2 className="agent-demo-cursor agent-demo-cursor--send" />}
      {sent && <div className="agent-demo-send-confirmation"><CheckCircle2 /><span><strong>Match sent successfully</strong><small>Pipeline updated to Sent to Client</small></span></div>}
    </section>
  );
}

function RolloutWindows() {
  return (
    <>
      <aside className="agent-rollout-window agent-rollout-window--conversation" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>Notification</strong></div>
        <div className="agent-rollout-chat">
          <span className="agent-rollout-chat__avatar">ET</span>
          <div><strong>Elaine Thomas</strong><small>10:24 AM</small><p>Looking forward to reviewing the next opportunity.</p></div>
        </div>
        <div className="agent-rollout-chat agent-rollout-chat--system">
          <span className="agent-rollout-chat__mark">UP</span>
          <div><strong>ExchangeUp</strong><small>10:25 AM</small><p>A new match is ready in the Match Inbox.</p></div>
        </div>
      </aside>

      <aside className="agent-rollout-window agent-rollout-window--activity" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>Match activity</strong></div>
        <div className="agent-rollout-activity__body">
          <div className="agent-rollout-activity__command">› Reviewing Riverside Apartments</div>
          <p><Check /> Purchasing capacity verified</p>
          <p><Check /> Trade-up requirement passed</p>
          <p><Check /> ROE improvement confirmed</p>
          <div className="agent-rollout-activity__live"><i /> Match ready for review</div>
        </div>
      </aside>

      <aside className="agent-rollout-window agent-rollout-window--listing" aria-hidden="true">
        <div className="agent-rollout-window__chrome"><span><i /><i /><i /></span><strong>New match</strong></div>
        <div className="agent-rollout-listing__visual"><ImageOff /><span>No property photos provided</span></div>
        <div className="agent-rollout-listing__details"><small>Multifamily · Providence, RI</small><strong>Blackstone Mill Lofts</strong><dl><div><dt>Asking</dt><dd>$3.8M</dd></div><div><dt>Match</dt><dd>92</dd></div></dl></div>
      </aside>
    </>
  );
}
