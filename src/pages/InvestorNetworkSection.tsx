import { useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Boxes,
  Scale,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

const INVESTOR_CSS = `
[data-nb] .inv { background: #ffffff; }
[data-nb] .inv-inner { margin: 0 auto; max-width: 1180px; padding: 84px 20px; }
@media (min-width: 900px) { [data-nb] .inv-inner { padding: 104px 32px; } }
[data-nb] .inv-head { max-width: 780px; }
[data-nb] .inv-eyebrow { font-size: 12.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #43a047; margin: 0 0 14px; }
[data-nb] .inv-h2 { font-size: clamp(28px, 3.4vw, 42px); font-weight: 800; line-height: 1.1; letter-spacing: -.02em; color: #16284a; margin: 0; }
[data-nb] .inv-sub { margin: 16px 0 0; font-size: 17px; line-height: 1.65; color: #56657a; max-width: 720px; }

[data-nb] .inv-prob { margin-top: 48px; display: flex; flex-direction: column; gap: 12px; }
[data-nb] .inv-accordion { border: 1px solid #e8edf3; border-radius: 16px; background: #fbfcfe; overflow: hidden; }
[data-nb] .inv-accordion-btn { width: 100%; display: flex; align-items: center; gap: 14px; padding: 20px 24px; text-align: left; background: none; border: none; cursor: pointer; }
[data-nb] .inv-accordion-ico { flex: none; width: 42px; height: 42px; border-radius: 11px; background: #fff; border: 1px solid #e8edf3; display: flex; align-items: center; justify-content: center; color: #16284a; }
[data-nb] .inv-accordion-ico svg { width: 20px; height: 20px; }
[data-nb] .inv-accordion-t { flex: 1; font-size: 17.5px; font-weight: 800; letter-spacing: -.01em; color: #16284a; }
[data-nb] .inv-accordion-chev { flex: none; color: #56657a; }
[data-nb] .inv-accordion-chev.open { transform: rotate(180deg); }
[data-nb] .inv-accordion-body { padding: 0 24px 22px 80px; font-size: 15px; line-height: 1.6; color: #56657a; }
@media (max-width: 600px) { [data-nb] .inv-accordion-body { padding: 0 20px 20px 24px; } }

[data-nb] .inv-band { background: #0f2748; }
[data-nb] .inv-band-inner { margin: 0 auto; max-width: 1180px; padding: 56px 20px; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 28px; }
@media (min-width: 900px) { [data-nb] .inv-band-inner { padding: 64px 32px; } }
@media (max-width: 900px) { [data-nb] .inv-band-inner { grid-template-columns: 1fr; gap: 24px; } }
[data-nb] .inv-band-t { font-size: 19px; font-weight: 800; letter-spacing: -.02em; color: #5cc15f; margin: 0 0 8px; }
[data-nb] .inv-band-p { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,.82); margin: 0; }

[data-nb] .inv-cta { background: #f5f8fc; border-top: 1px solid #e8edf3; }
[data-nb] .inv-cta-inner { margin: 0 auto; max-width: 860px; padding: 72px 20px; text-align: center; }
[data-nb] .inv-cta-h { font-size: clamp(24px, 2.8vw, 34px); font-weight: 800; letter-spacing: -.02em; color: #16284a; line-height: 1.18; margin: 0; }
[data-nb] .inv-cta-p { margin: 16px auto 0; max-width: 640px; font-size: 16.5px; line-height: 1.65; color: #56657a; }
[data-nb] .inv-cta-btn { display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 30px; margin-top: 28px; border-radius: 11px; background: #43a047; color: #fff; border: 1.5px solid #43a047; font-size: 16px; font-weight: 800; letter-spacing: -.01em; text-decoration: none; }
[data-nb] .inv-cta-note { margin: 14px 0 0; font-size: 14px; color: #7a8798; }
`;

const PROBLEMS: { key: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    key: "45-day-clock",
    icon: Clock,
    title: "The 45-Day Clock Is Real",
    body: "Once you sell a property, the identification deadline creates real pressure. ExchangeUp™ can monitor opportunities before you sell, so you are not starting from zero when the clock starts.",
  },
  {
    key: "limited-inventory",
    icon: Boxes,
    title: "The Right Replacement Is Hard to Find",
    body: "The best 1031 replacement may not be on the MLS. It may be sitting in another agent's database or another investor's network, waiting to surface.",
  },
  {
    key: "hard-to-compare",
    icon: Scale,
    title: "Comparing Opportunities Is Difficult",
    body: "Value, equity, cash flow, and return on equity all matter. ExchangeUp™ evaluates opportunities against your criteria so you can focus on the ones worth exploring.",
  },
  {
    key: "exchange-up",
    icon: TrendingUp,
    title: "Find a Smarter Property to Exchange Into",
    body: "ExchangeUp™ continuously monitors the network and alerts you when a property appears that may be a better fit for your exchange strategy.",
  },
];

function ProblemAccordion() {
  const [open, setOpen] = useState<string | null>("exchange-up");

  return (
    <div className="inv-prob">
      {PROBLEMS.map((p) => {
        const Icon = p.icon;
        const isOpen = open === p.key;
        return (
          <div className="inv-accordion" key={p.key}>
            <button
              type="button"
              className="inv-accordion-btn"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : p.key)}
            >
              <span className="inv-accordion-ico" aria-hidden="true"><Icon /></span>
              <span className="inv-accordion-t">{p.title}</span>
              <span className={`inv-accordion-chev ${isOpen ? "open" : ""}`} aria-hidden="true">
                <ChevronDown />
              </span>
            </button>
            {isOpen && (
              <div className="inv-accordion-body">
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
  { t: "More Opportunities", p: "See potential matches beyond your own search radius." },
  { t: "Better Timing", p: "Monitor continuously so you are prepared before you sell." },
  { t: "Smarter Evaluation", p: "Compare opportunities against your equity and criteria." },
  { t: "No Obligation", p: "Register and monitor for free. Pursue only what makes sense." },
];

export default function InvestorNetworkSection() {
  return (
    <>
      <style>{INVESTOR_CSS}</style>

      <section id="investors" className="inv" aria-label="For property owners">
        <div className="inv-inner">
          <div className="inv-head">
            <p className="inv-eyebrow">For Property Owners</p>
            <h2 className="inv-h2">Problems 1031ExchangeUp™ Solves for Property Owners</h2>
          </div>

          <ProblemAccordion />
        </div>
      </section>

      <section className="inv-band" aria-label="Property owner benefits">
        <div className="inv-band-inner">
          {BAND.map((b) => (
            <div key={b.t}>
              <p className="inv-band-t">{b.t}</p>
              <p className="inv-band-p">{b.p}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="inv-cta" aria-label="Register your property">
        <div className="inv-cta-inner">
          <h2 className="inv-cta-h">
            Ready to Find a Smarter Replacement Property?
          </h2>
          <p className="inv-cta-p">
            Register your property and investment criteria. ExchangeUp™ will continuously monitor the network and alert you when a relevant opportunity appears.
          </p>
          <Link to={ROUTES.signup} className="inv-cta-btn">Register My Property - Free</Link>
          <p className="inv-cta-note">Free to register. No obligation to exchange.</p>
        </div>
      </section>
    </>
  );
}
