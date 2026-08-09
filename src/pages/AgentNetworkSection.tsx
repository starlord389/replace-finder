import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import type { LucideIcon } from "lucide-react";
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
  ChevronDown,
  Rocket,
} from "lucide-react";

const AGENT_CSS = `
[data-nb] .agn { background: #ffffff; }
[data-nb] .agn-inner { margin: 0 auto; max-width: 1180px; padding: 84px 20px; }
@media (min-width: 900px) { [data-nb] .agn-inner { padding: 104px 32px; } }
[data-nb] .agn-head { max-width: 780px; }
[data-nb] .agn-eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #43a047; margin: 0 0 14px; }
[data-nb] .agn-h2 { font-size: clamp(28px, 3.4vw, 42px); font-weight: 800; line-height: 1.1; letter-spacing: -.02em; color: #16284a; margin: 0; }
[data-nb] .agn-sub { margin: 16px 0 0; font-size: 17px; line-height: 1.65; color: #56657a; max-width: 720px; }

[data-nb] .agn-prob { margin-top: 48px; display: flex; flex-direction: column; gap: 12px; }
[data-nb] .agn-accordion { border: 1px solid #e8edf3; border-radius: 16px; background: #fbfcfe; overflow: hidden; }
[data-nb] .agn-accordion-btn { width: 100%; display: flex; align-items: center; gap: 14px; padding: 20px 24px; text-align: left; background: none; border: none; cursor: pointer; }
[data-nb] .agn-accordion-btn:hover { background: #f5f8fc; }
[data-nb] .agn-accordion-ico { flex: none; width: 42px; height: 42px; border-radius: 11px; background: #fff; border: 1px solid #e8edf3; display: flex; align-items: center; justify-content: center; color: #16284a; }
[data-nb] .agn-accordion-ico svg { width: 20px; height: 20px; }
[data-nb] .agn-accordion-t { flex: 1; font-size: 17.5px; font-weight: 800; letter-spacing: -.01em; color: #16284a; }
[data-nb] .agn-accordion-chev { flex: none; color: #56657a; transition: transform .2s ease; }
[data-nb] .agn-accordion-chev.open { transform: rotate(180deg); }
[data-nb] .agn-accordion-body { padding: 0 24px 22px 80px; font-size: 15px; line-height: 1.6; color: #56657a; }
@media (max-width: 600px) { [data-nb] .agn-accordion-body { padding: 0 20px 20px 24px; } }

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

const PROBLEMS: { key: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    key: "limited-inventory",
    icon: Boxes,
    title: "Limited Inventory",
    body: "Your clients can only buy what you know about. The right replacement property may be sitting in another agent's database.",
  },
  {
    key: "mls-not-for-investors",
    icon: SearchX,
    title: "The MLS Wasn’t Built for Investors",
    body: "MLS search is great for bedrooms, bathrooms, and geography, but it wasn’t designed around equity, investment strategy, 1031 timing, or identifying an opportunity to exchange up.",
  },
  {
    key: "agent-databases-siloed",
    icon: Network,
    title: "Agent Databases Don’t Talk to Each Other",
    body: "Agents build valuable networks independently. ExchangeUp™ connects those networks so potential transactions can surface across agents, brokerages, and markets.",
  },
  {
    key: "unlock-deal-flow",
    icon: Rocket,
    title: "Unlock More Deal Flow",
    body: "Most agents rely on active listings and repeat clients to generate transactions. ExchangeUp™ turns your existing relationships into a continuous opportunity network so you can uncover more deals without more prospecting.",
  },
];

function ProblemAccordion() {
  const [open, setOpen] = useState<string | null>("unlock-deal-flow");

  return (
    <div className="agn-prob">
      {PROBLEMS.map((p) => {
        const Icon = p.icon;
        const isOpen = open === p.key;
        return (
          <div className="agn-accordion" key={p.key}>
            <button
              type="button"
              className="agn-accordion-btn"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : p.key)}
            >
              <span className="agn-accordion-ico" aria-hidden="true"><Icon /></span>
              <span className="agn-accordion-t">{p.title}</span>
              <span className={`agn-accordion-chev ${isOpen ? "open" : ""}`} aria-hidden="true">
                <ChevronDown />
              </span>
            </button>
            {isOpen && (
              <div className="agn-accordion-body">
                {p.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
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
              ExchangeUp™ turns your existing relationships into an opportunity network. Add your
              clients and properties, and let the platform notify you of potential opportunities
              across the network.
            </p>
          </div>

          <ProblemAccordion />

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
            Ready to Unlock More Deal Flow?
          </h2>
          <p className="agn-cta-p">
            Join a growing network of investor-friendly real estate agents using ExchangeUp™ to
            uncover more transactions, more introductions, and more opportunities for their clients.
          </p>
          <Link to={ROUTES.signup} className="agn-cta-btn">Join the Agent Network - Free</Link>
          <p className="agn-cta-note">Free to join. Add your clients and properties in minutes.</p>
        </div>
      </section>
    </>
  );
}
