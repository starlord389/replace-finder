import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import {
  Boxes,
  SearchX,
  Network,
  Users,
  Building2,
  Handshake,
  CalendarClock,
  TrendingUp,
  UserSearch,
  BellRing,
} from "lucide-react";

const AGENT_CSS = `
[data-nb] .agn { background: #ffffff; }
[data-nb] .agn-inner { margin: 0 auto; max-width: 1180px; padding: 84px 20px; }
@media (min-width: 900px) { [data-nb] .agn-inner { padding: 104px 32px; } }
[data-nb] .agn-head { max-width: 780px; }
[data-nb] .agn-eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #43a047; margin: 0 0 14px; }
[data-nb] .agn-h2 { font-size: clamp(28px, 3.4vw, 42px); font-weight: 800; line-height: 1.1; letter-spacing: -.02em; color: #16284a; margin: 0; }
[data-nb] .agn-sub { margin: 16px 0 0; font-size: 17px; line-height: 1.65; color: #56657a; max-width: 720px; }

[data-nb] .agn-prob { margin-top: 48px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 20px; }
@media (max-width: 900px) { [data-nb] .agn-prob { grid-template-columns: 1fr; } }
[data-nb] .agn-card { border: 1px solid #e8edf3; border-radius: 16px; background: #fbfcfe; padding: 26px; }
[data-nb] .agn-card-ico { width: 46px; height: 46px; border-radius: 12px; background: #fff; border: 1px solid #e8edf3; display: flex; align-items: center; justify-content: center; color: #16284a; margin-bottom: 16px; }
[data-nb] .agn-card-ico svg { width: 22px; height: 22px; }
[data-nb] .agn-card-t { font-size: 17.5px; font-weight: 800; letter-spacing: -.01em; color: #16284a; margin: 0 0 8px; }
[data-nb] .agn-card-p { font-size: 15px; line-height: 1.6; color: #56657a; margin: 0; }

[data-nb] .agn-turn { margin-top: 72px; border-top: 1px solid #eaeff6; padding-top: 56px; }
[data-nb] .agn-h3 { font-size: clamp(24px, 2.6vw, 32px); font-weight: 800; letter-spacing: -.02em; color: #16284a; margin: 0; }
[data-nb] .agn-turn-p { margin: 14px 0 0; font-size: 16.5px; line-height: 1.65; color: #56657a; max-width: 760px; }

[data-nb] .agn-list { margin-top: 40px; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 20px; }
@media (max-width: 860px) { [data-nb] .agn-list { grid-template-columns: 1fr; } }
[data-nb] .agn-item { border: 1px solid #e8edf3; border-radius: 18px; padding: 28px; background: #fff; display: flex; flex-direction: column; }
[data-nb] .agn-item-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
[data-nb] .agn-num { flex: none; width: 30px; height: 30px; border-radius: 9px; background: #eef6ef; color: #43a047; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
[data-nb] .agn-item-ico { flex: none; color: #43a047; display: flex; }
[data-nb] .agn-item-ico svg { width: 20px; height: 20px; }
[data-nb] .agn-item-t { font-size: 18px; font-weight: 800; letter-spacing: -.015em; color: #16284a; margin: 0; }
[data-nb] .agn-item-p { font-size: 15px; line-height: 1.62; color: #56657a; margin: 0 0 10px; }
[data-nb] .agn-item-p:last-child { margin-bottom: 0; }

[data-nb] .agn-alert { display: inline-flex; align-items: center; gap: 10px; margin: 6px 0 12px; padding: 10px 14px; border-radius: 12px; background: #f2faf3; border: 1px solid #cdeccf; }
[data-nb] .agn-alert-dot { width: 26px; height: 26px; border-radius: 8px; background: #43a047; color: #fff; display: flex; align-items: center; justify-content: center; flex: none; }
[data-nb] .agn-alert-dot svg { width: 14px; height: 14px; }
[data-nb] .agn-alert-txt { font-size: 13.5px; font-weight: 800; letter-spacing: -.01em; color: #23703a; }

[data-nb] .agn-quote { margin: 4px 0 12px; padding: 14px 16px; border-left: 3px solid #43a047; background: #f7faf7; border-radius: 0 10px 10px 0; font-size: 16px; font-weight: 800; letter-spacing: -.01em; color: #16284a; line-height: 1.4; }

[data-nb] .agn-band { background: #0f2748; }
[data-nb] .agn-band-inner { margin: 0 auto; max-width: 1180px; padding: 56px 20px; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 28px; }
@media (min-width: 900px) { [data-nb] .agn-band-inner { padding: 64px 32px; } }
@media (max-width: 900px) { [data-nb] .agn-band-inner { grid-template-columns: 1fr; gap: 24px; } }
[data-nb] .agn-band-t { font-size: 19px; font-weight: 800; letter-spacing: -.02em; color: #5cc15f; margin: 0 0 8px; }
[data-nb] .agn-band-p { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,.82); margin: 0; }

[data-nb] .agn-cta { background: #f5f8fc; border-top: 1px solid #e8edf3; }
[data-nb] .agn-cta-inner { margin: 0 auto; max-width: 860px; padding: 72px 20px; text-align: center; }
[data-nb] .agn-cta-h { font-size: clamp(24px, 2.8vw, 34px); font-weight: 800; letter-spacing: -.02em; color: #16284a; line-height: 1.18; margin: 0; }
[data-nb] .agn-cta-p { margin: 16px auto 0; max-width: 640px; font-size: 16.5px; line-height: 1.65; color: #56657a; }
[data-nb] .agn-cta-btn { display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 30px; margin-top: 28px; border-radius: 11px; background: #43a047; color: #fff; border: 1.5px solid #43a047; font-size: 16px; font-weight: 800; letter-spacing: -.01em; text-decoration: none; }
[data-nb] .agn-cta-note { margin: 14px 0 0; font-size: 14px; color: #7a8798; }
`;

const PROBLEMS = [
  {
    icon: <Boxes />,
    title: "Limited Inventory",
    body: "Your clients can only buy what you know about. The right replacement property may be sitting in another agent's database.",
  },
  {
    icon: <SearchX />,
    title: "The MLS Wasn’t Built for Investors",
    body: "MLS search is great for bedrooms, bathrooms, and geography, but it wasn’t designed around equity, investment strategy, 1031 timing, or identifying an opportunity to exchange up.",
  },
  {
    icon: <Network />,
    title: "Agent Databases Don’t Talk to Each Other",
    body: "Agents build valuable networks independently. ExchangeUp™ connects those networks so potential transactions can surface across agents, brokerages, and markets.",
  },
];

const BAND = [
  { t: "More Inventory.", p: "Access opportunities beyond your own database." },
  { t: "More Collaboration.", p: "Connect with investor-friendly agents across the network." },
  { t: "More Transactions.", p: "Uncover business that may otherwise never happen." },
  { t: "Same Client Relationship.", p: "You remain your client's real estate agent." },
];

export default function AgentNetworkSection() {
  return (
    <>
      <style>{AGENT_CSS}</style>

      <section id="agents" className="agn" aria-label="For real estate agents">
        <div className="agn-inner">
          <div className="agn-head">
            <p className="agn-eyebrow">For Real Estate Agents</p>
            <h2 className="agn-h2">Unlock More Deal Flow.</h2>
            <p className="agn-sub">
              ExchangeUp™ turns your existing client and property relationships into a continuous
              opportunity network. Add your clients and properties once, and let the platform surface
              potential transactions hiding inside your database and across the larger agent network.
            </p>
          </div>

          <div className="agn-prob">
            {PROBLEMS.map((p) => (
              <article className="agn-card" key={p.title}>
                <span className="agn-card-ico" aria-hidden="true">{p.icon}</span>
                <h3 className="agn-card-t">{p.title}</h3>
                <p className="agn-card-p">{p.body}</p>
              </article>
            ))}
          </div>

          <div className="agn-turn">
            <h3 className="agn-h3">One Network. More Opportunities.</h3>
            <p className="agn-turn-p">
              Add your investor clients and investment properties once. ExchangeUp™ continuously
              looks for potential opportunities inside your own database and throughout the larger
              network.
            </p>

            <div className="agn-list">
              <article className="agn-item">
                <div className="agn-item-top">
                  <span className="agn-num">1</span>
                  <span className="agn-item-ico" aria-hidden="true"><Users /></span>
                  <h4 className="agn-item-t">Find Opportunities Inside Your Own Database</h4>
                </div>
                <p className="agn-item-p">Sometimes the buyer and seller are already your clients.</p>
                <p className="agn-item-p">
                  ExchangeUp™ can identify potential transactions between two people already in your
                  database and surface an:
                </p>
                <div className="agn-alert">
                  <span className="agn-alert-dot" aria-hidden="true"><BellRing /></span>
                  <span className="agn-alert-txt">Internal Opportunity Detected</span>
                </div>
                <p className="agn-item-p">
                  No referral. No introduction. No connecting with yourself. Just a transaction
                  hiding inside relationships you already own.
                </p>
              </article>

              <article className="agn-item">
                <div className="agn-item-top">
                  <span className="agn-num">2</span>
                  <span className="agn-item-ico" aria-hidden="true"><Building2 /></span>
                  <h4 className="agn-item-t">Expand Beyond Your Own Inventory</h4>
                </div>
                <p className="agn-item-p">
                  Your clients are no longer limited to the properties you personally know about.
                </p>
                <p className="agn-item-p">
                  ExchangeUp™ can surface relevant investment and replacement-property opportunities
                  from participating agents and properties throughout the network.
                </p>
              </article>

              <article className="agn-item">
                <div className="agn-item-top">
                  <span className="agn-num">3</span>
                  <span className="agn-item-ico" aria-hidden="true"><Handshake /></span>
                  <h4 className="agn-item-t">Collaborate Without Giving Up Your Client</h4>
                </div>
                <p className="agn-item-p">
                  When an opportunity involves another participating agent, ExchangeUp™ facilitates
                  the connection between the parties.
                </p>
                <p className="agn-quote">Your client relationship stays yours. Always.</p>
                <p className="agn-item-p">
                  ExchangeUp™ is designed to make agents more valuable, not replace them.
                </p>
              </article>

              <article className="agn-item">
                <div className="agn-item-top">
                  <span className="agn-num">4</span>
                  <span className="agn-item-ico" aria-hidden="true"><CalendarClock /></span>
                  <h4 className="agn-item-t">Give Investor Clients a Reason to Stay Connected</h4>
                </div>
                <p className="agn-item-p">Most property owners don't need their agent every month.</p>
                <p className="agn-item-p">
                  ExchangeUp™ gives agents an ongoing reason to stay relevant by continuously looking
                  for potential exchange and investment opportunities for their clients.
                </p>
                <p className="agn-item-p">
                  Instead of waiting until a client decides to sell, the agent can become the person
                  who brings the opportunity to them.
                </p>
              </article>

              <article className="agn-item">
                <div className="agn-item-top">
                  <span className="agn-num">5</span>
                  <span className="agn-item-ico" aria-hidden="true"><TrendingUp /></span>
                  <h4 className="agn-item-t">Identify Potential “Exchange Up” Opportunities</h4>
                </div>
                <p className="agn-item-p">ExchangeUp™ isn't simply another property alert.</p>
                <p className="agn-item-p">
                  The platform evaluates whether potential opportunities could represent a logical
                  upgrade based on the investor's property, equity position, investment criteria, and
                  available opportunities.
                </p>
              </article>

              <article className="agn-item">
                <div className="agn-item-top">
                  <span className="agn-num">6</span>
                  <span className="agn-item-ico" aria-hidden="true"><UserSearch /></span>
                  <h4 className="agn-item-t">Potential Buyers for Your Investment Listings</h4>
                </div>
                <p className="agn-item-p">The network works in both directions.</p>
                <p className="agn-item-p">
                  When an agent adds an investment property, ExchangeUp™ can evaluate participating
                  investor profiles and other agent databases for potential buyers whose investment
                  criteria may align with the property.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="agn-band" aria-label="Agent benefits">
        <div className="agn-band-inner">
          {BAND.map((b) => (
            <div key={b.t}>
              <p className="agn-band-t">{b.t}</p>
              <p className="agn-band-p">{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="agn-cta" aria-label="Join the agent network">
        <div className="agn-cta-inner">
          <h2 className="agn-cta-h">
            You Already Built the Database. Let ExchangeUp™ Find the Opportunities Inside It.
          </h2>
          <p className="agn-cta-p">
            Join a growing network of investor-friendly real estate agents using ExchangeUp™ to
            connect clients, properties, and potential 1031 opportunities.
          </p>
          <Link to={ROUTES.signup} className="agn-cta-btn">Join the Agent Network - Free</Link>
          <p className="agn-cta-note">Free to join. Add your clients and properties in minutes.</p>
        </div>
      </section>
    </>
  );
}
