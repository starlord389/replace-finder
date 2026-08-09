import { FormEvent, useState } from "react";
import {
  Pencil, Link2, Plus,
  SlidersHorizontal, Calendar, ChevronDown, Share2, LayoutGrid, Paperclip, Lightbulb,
  Building2, Target, Activity, Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { UPCOMING_EVENT } from "@/content/events";

/* AUTO-ASSEMBLED landing sections (navy+green brand). Person/expert photos are placeholders. */

export const SECTIONS_CSS = `
[data-nb] .nb-prob-line{color:#43a047;font-weight:800;font-size:18px;letter-spacing:-.01em;margin-top:22px}\n[data-nb] .nb-prob-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}\n[data-nb] .nb-prob-item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}\n[data-nb] .nb-prob-ico{width:62px;height:62px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid #e8edf3;box-shadow:0 2px 12px rgba(14,42,77,.06)}\n[data-nb] .nb-prob-ico svg{width:34px;height:34px;stroke:#16284a;stroke-width:1.6;fill:none;stroke-linecap:round;stroke-linejoin:round}\n[data-nb] .nb-prob-label{font-size:13px;line-height:1.45;color:#56657a;font-weight:600;max-width:140px}\n@media (max-width:900px){\n  [data-nb] .nb-prob-grid{grid-template-columns:repeat(2,1fr);gap:28px 16px}\n}\n@media (max-width:480px){\n  [data-nb] .nb-prob-grid{grid-template-columns:repeat(2,1fr)}\n}\n\n[data-nb] #meet{background:linear-gradient(135deg,#eef3fb,#e3edf8);}\n[data-nb] .nb-meet-btn{display:inline-flex;align-items:center;gap:12px;height:54px;padding:0 26px;border-radius:12px;background:#43a047;color:#fff;font-weight:700;font-size:15px;letter-spacing:-.01em;border:none;cursor:pointer;box-shadow:0 8px 22px rgba(67,160,71,.22);transition:background .15s ease,transform .15s ease,box-shadow .15s ease;}\n[data-nb] .nb-meet-btn:hover{background:#3a8c3e;transform:translateY(-1px);box-shadow:0 12px 28px rgba(67,160,71,.28);}\n[data-nb] .nb-meet-play{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.18);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}\n[data-nb] .nb-meet-flow{display:flex;align-items:flex-start;justify-content:center;flex-wrap:wrap;gap:6px;}\n[data-nb] .nb-meet-step{display:flex;flex-direction:column;align-items:center;text-align:center;width:124px;}\n[data-nb] .nb-meet-circle{width:96px;height:96px;border-radius:50%;background:#fff;border:1px solid #e8edf3;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(14,42,77,.08);}\n[data-nb] .nb-meet-circle svg{width:38px;height:38px;}\n[data-nb] .nb-meet-circle-done{border-color:#cdeccf;background:#f3faf3;}\n[data-nb] .nb-meet-label{margin-top:14px;font-size:13.5px;font-weight:700;color:#16284a;letter-spacing:-.01em;line-height:1.3;}\n[data-nb] .nb-meet-arrow{align-self:center;margin-top:34px;color:#9fb0c8;font-size:24px;font-weight:400;line-height:1;flex-shrink:0;}\n@media (max-width:1100px){\n[data-nb] .nb-meet-arrow{display:none;}\n[data-nb] .nb-meet-flow{gap:24px 18px;}\n}\n\n[data-nb] .nb-how-flow{margin-top:28px;display:grid;grid-template-columns:repeat(4,1fr);gap:28px 32px;max-width:1040px;margin-left:auto;margin-right:auto;position:relative}
[data-nb] .nb-how-step{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;z-index:1}
[data-nb] .nb-how-step-icon{width:108px;height:108px;border-radius:24px;background:#f9fafb;border:1px solid #e8edf3;display:flex;align-items:center;justify-content:center;color:#43a047;margin-bottom:18px;box-shadow:0 2px 10px rgba(0,0,0,.05);position:relative}
[data-nb] .nb-how-step-icon svg{width:42px;height:42px;stroke-width:1.5}
[data-nb] .nb-how-step-num{position:absolute;top:-8px;right:-8px;width:30px;height:30px;border-radius:50%;background:#16284a;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.08)}
[data-nb] .nb-how-step-title{font-size:18px;font-weight:700;color:#16284a;letter-spacing:-.02em;margin-bottom:5px}
[data-nb] .nb-how-step-desc{font-size:13.5px;line-height:1.5;color:#56657a;max-width:180px}
[data-nb] .nb-how-connector{display:none;position:absolute;top:54px;left:12.5%;right:12.5%;height:2px;background:#e8edf3;z-index:0}
@media (min-width:1024px){[data-nb] .nb-how-connector{display:block}}
@media (max-width:900px){
[data-nb] .nb-how-flow{gap:24px 20px}
[data-nb] .nb-how-step-icon{width:96px;height:96px}
[data-nb] .nb-how-step-icon svg{width:38px;height:38px}
[data-nb] .nb-how-step-title{font-size:17px}
}
@media (max-width:640px){
[data-nb] .nb-how-flow{grid-template-columns:repeat(2,1fr);gap:28px 16px}
[data-nb] .nb-how-step-icon{width:80px;height:80px}
[data-nb] .nb-how-step-icon svg{width:32px;height:32px}
[data-nb] .nb-how-step-num{width:26px;height:26px;font-size:11px}
[data-nb] .nb-how-step-desc{max-width:160px;font-size:13px}
}
`;

export const EXTRA_CSS = `
[data-nb] .nb-flow{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:44px}
[data-nb] .nb-flow-box{width:100%;max-width:560px;text-align:center;border-radius:14px;border:1px solid #e8edf3;background:#fff;box-shadow:0 2px 12px rgba(14,42,77,.06);padding:18px 22px;font-size:14px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#16284a}
[data-nb] .nb-flow-box.engine{background:#16284a;border-color:#16284a;color:#fff}
[data-nb] .nb-flow-box.engine span{color:#5cc15f}

[data-nb] .nb-flow-out{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;width:100%;max-width:900px}
@media (max-width:760px){[data-nb] .nb-flow-out{grid-template-columns:repeat(2,minmax(0,1fr))}}
[data-nb] .nb-flow-out div{border-radius:12px;border:1px solid #dbeadd;background:#f3faf3;padding:16px 14px;text-align:center;font-size:13.5px;font-weight:700;color:#16284a;line-height:1.4}
[data-nb] .nb-flow-note{margin-top:30px;text-align:center;font-size:17px;font-weight:700;color:#43a047}

[data-nb] .nb-ex-grid{display:grid;grid-template-columns:1fr;gap:22px;align-items:center;margin-top:44px}
@media (min-width:980px){[data-nb] .nb-ex-grid{grid-template-columns:1fr auto 1fr}}
[data-nb] .nb-ex-card{border-radius:16px;border:1px solid #e8edf3;background:#fff;box-shadow:0 6px 22px rgba(14,42,77,.08);padding:24px}
[data-nb] .nb-ex-card.hl{border-color:#cdeccf;background:#f7fcf7}
[data-nb] .nb-ex-tag{font-size:11.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#43a047}
[data-nb] .nb-ex-place{margin-top:8px;font-size:20px;font-weight:800;letter-spacing:-.02em;color:#16284a}
[data-nb] .nb-ex-rows{margin-top:16px;display:flex;flex-direction:column;gap:9px}
[data-nb] .nb-ex-row{display:flex;justify-content:space-between;gap:14px;font-size:14.5px;color:#56657a}
[data-nb] .nb-ex-row b{color:#16284a;font-weight:700}
[data-nb] .nb-ex-mid{display:flex;flex-direction:column;align-items:center;gap:8px;color:#9fb0c8}
[data-nb] .nb-ex-mid-label{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#43a047;text-align:center;max-width:150px;line-height:1.5}
[data-nb] .nb-ex-right{display:flex;flex-direction:column;gap:22px}
[data-nb] .nb-ex-fine{margin-top:26px;text-align:center;font-size:13px;color:#8794a6}

[data-nb] .nb-ag-grid{display:grid;grid-template-columns:1fr;gap:44px;align-items:start}
@media (min-width:980px){[data-nb] .nb-ag-grid{grid-template-columns:1.05fr .95fr;gap:60px}}
[data-nb] .nb-ag-list{margin:26px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:13px}
[data-nb] .nb-ag-li{display:flex;gap:11px;align-items:flex-start;font-size:15.5px;line-height:1.45;color:#56657a}
[data-nb] .nb-ag-check{flex:none;width:20px;height:20px;border-radius:50%;background:#43a047;display:flex;align-items:center;justify-content:center;margin-top:2px}
[data-nb] .nb-ag-check svg{width:12px;height:12px;color:#fff}
[data-nb] .nb-ag-note{margin-top:28px;border-left:3px solid #43a047;background:#f3faf3;border-radius:0 12px 12px 0;padding:18px 20px;font-size:16px;font-weight:700;color:#16284a;line-height:1.5}

[data-nb] .nb-inv-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin-top:44px}
@media (max-width:1000px){[data-nb] .nb-inv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:600px){[data-nb] .nb-inv-grid{grid-template-columns:1fr}}
[data-nb] .nb-inv-card{border-radius:16px;border:1px solid #e8edf3;background:#fff;box-shadow:0 2px 12px rgba(14,42,77,.06);padding:24px 22px}
[data-nb] .nb-inv-title{font-size:13px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#43a047}
[data-nb] .nb-inv-txt{margin-top:10px;font-size:15px;line-height:1.55;color:#56657a}

[data-nb] .nb-net-grid{display:grid;grid-template-columns:1fr;gap:18px;margin-top:40px}
@media (min-width:900px){[data-nb] .nb-net-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
[data-nb] .nb-net-card{border-radius:16px;padding:24px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);font-size:15.5px;line-height:1.55;color:#eaf1fb}
[data-nb] .nb-net-close{margin-top:34px;text-align:center;font-size:18px;font-weight:700;color:#5cc15f}


[data-nb] .nb-sec-cta{display:inline-flex;align-items:center;justify-content:center;gap:9px;height:50px;padding:0 26px;margin-top:30px;border-radius:10px;background:#43a047;color:#fff;font-weight:800;font-size:15px;text-decoration:none;box-shadow:0 8px 20px rgba(67,160,71,.28)}
`;






export function HowItWorksFlow() {
  const steps = [
    {
      num: "1",
      title: "Add",
      desc: "Your property and investment criteria.",
      icon: Building2,
    },
    {
      num: "2",
      title: "Set",
      desc: "What a smarter position looks like.",
      icon: SlidersHorizontal,
    },
    {
      num: "3",
      title: "Monitor",
      desc: <>Exchange IQ™ scans the network.</>,
      icon: Activity,
    },
    {
      num: "4",
      title: "Alert",
      desc: "Get notified when a match appears.",
      icon: Bell,
    },
  ];

  return (
    <div className="nb-how-flow">
      <div className="nb-how-connector" aria-hidden="true" />
      {steps.map((s) => (
        <div className="nb-how-step" key={s.title}>
          <div className="nb-how-step-icon">
            <s.icon size={42} strokeWidth={1.5} />
            <span className="nb-how-step-num">{s.num}</span>
          </div>
          <h3 className="nb-how-step-title">{s.title}</h3>
          <p className="nb-how-step-desc">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

export function Sec_how({ showTitle = true }: { showTitle?: boolean }) {
  return (
    <section id="how" data-nb className="bg-white">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8 py-20 sm:py-24">
        {showTitle && (
          <div className="max-w-[760px] mb-12 sm:mb-16">
            <p className="nb-eyebrow">How It Works</p>
            <h2 className="nb-h2 mt-3">A simple process designed to find your next property.</h2>
          </div>
        )}
        <HowItWorksFlow />
      </div>
    </section>
  );
}



export function Sec_agents() {
  return (
<section id="agents" data-nb className="w-full py-20 sm:py-24" style={{ background: "#eef3fb" }}>
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
    <div className="nb-ag-grid">
      <div>
        <div className="nb-eyebrow">For Agents</div>
        <h2 className="nb-h2 mt-3">Exchanges Made Easier Across Your Whole Database.</h2>
        <p className="nb-lead mt-4">
          Add investor clients and investment properties to ExchangeUp™. The system continuously evaluates your database

          and the broader ExchangeUp™ network for potential transactions.
        </p>


        <ul className="nb-ag-list">
          {[
            "Opportunities between two of your own clients surface as an Internal Opportunity Detected - no need to connect with yourself.",
            "Opportunities across your brokerage and other participating agents.",
            "Potential buyers and replacement properties across the network.",
            "Keep your client relationship, always.",

          ].map((b) => (
            <li className="nb-ag-li" key={b}>
              <span className="nb-ag-check" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              {b}
            </li>
          ))}
        </ul>

        <p className="nb-ag-note">
          You already built the database. Let ExchangeUp™ find the opportunities inside it. ExchangeUp™ does not replace the agent - it makes the agent&rsquo;s network more powerful.
        </p>

        <a href="/signup" className="nb-sec-cta">Add My First Opportunity</a>
      </div>

    </div>
  </div>
</section>
  );
}

export function Sec_investors() {
  return (
<section id="investors" data-nb className="w-full py-20 sm:py-24 bg-white">
  <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
    <div className="text-center max-w-[760px] mx-auto">
      <div className="nb-eyebrow">For Investors &amp; Property Owners</div>
      <h2 className="nb-h2 mt-3">Your 1031 Exchange, Made Easier.</h2>
      <p className="nb-lead mt-4">
        Add your investment property and goals once. ExchangeUp™ keeps watching for opportunities that may better align
        with your equity position - so the exchange is simple when the timing is right.
      </p>




    </div>

    <div className="nb-inv-grid">
      {[
        ["Add Your Property", "A few details about what you own - that’s the whole setup."],
        ["Understand Your Position", "See how efficiently the equity in your current property is performing."],
        ["Set What You’re Looking For", "Tell us what a smarter position looks like, and change it any time."],
        ["Activate Monitoring", "We keep watching and alert you when something relevant appears."],
      ].map(([t, d]) => (
        <div className="nb-inv-card" key={t}>
          <div className="nb-inv-title">{t}</div>
          <p className="nb-inv-txt">{d}</p>
        </div>
      ))}
    </div>

    <div className="text-center">
      <a href="/signup" className="nb-sec-cta">Monitor My Property</a>
    </div>

  </div>
</section>
  );
}




function RoeMiniCalc() {
  const [value, setValue] = useState(1000000);
  const [loan, setLoan] = useState(0);
  const [rent, setRent] = useState(6000);
  const [pi, setPi] = useState(0);
  const [ti, setTi] = useState(0);
  const [opex, setOpex] = useState(0);
  const [shown, setShown] = useState(false);

  const equity = Math.max(0, value - loan);
  const monthlyExpenses = pi + ti + opex;
  const monthlyCashFlow = rent - monthlyExpenses;
  const income = monthlyCashFlow * 12;
  const roe = equity > 0 ? (income / equity) * 100 : 0;

  const usd = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
  const parse = (s: string) => Number(s.replace(/[^0-9]/g, "")) || 0;

  const numColor = roe >= 0 ? "#43a047" : "#b8543a";

  const signupHref =
    `/signup?role=investor&value=${Math.round(value)}&loan=${Math.round(loan)}&rent=${Math.round(rent)}` +
    `&pi=${Math.round(pi)}&ti=${Math.round(ti)}&opex=${Math.round(opex)}`;

  const FIELDS: { id: string; label: string; hint?: string; val: number; set: (n: number) => void }[] = [
    { id: "cv", label: "Estimated Property Value", val: value, set: setValue },
    { id: "lb", label: "Current Loan Balance", val: loan, set: setLoan },
    { id: "gr", label: "Gross Monthly Rent", val: rent, set: setRent },
    { id: "pi", label: "Monthly P&I (Principal & Interest)", val: pi, set: setPi },
    { id: "ti", label: "Monthly T&I (Taxes & Insurance)", val: ti, set: setTi },
    { id: "oe", label: "Other Monthly Operating Expenses", val: opex, set: setOpex },
  ];

  return (
    <div className="nb-why-card">
      <h3 className="nb-why-card-title">Return on Equity Calculator</h3>
      <p className="nb-why-card-sub">
        Enter your property value, loan balance, rent and monthly costs - P&amp;I, T&amp;I and other expenses - to see
        how hard your equity is working today.
      </p>

      <div className="nb-why-inputs">
        {FIELDS.map((f) => (
          <div className="nb-why-field" key={f.id}>
            <label className="nb-why-label" htmlFor={`nb-why-${f.id}`}>{f.label}</label>
            <div className="nb-why-input">
              <span className="nb-why-dollar">$</span>
              <input
                id={`nb-why-${f.id}`}
                type="text"
                inputMode="numeric"
                value={f.val.toLocaleString("en-US")}
                onChange={(e) => f.set(parse(e.target.value))}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 12,
          fontSize: 12,
          fontWeight: 700,
          color: "#56657a",
          margin: "2px 0 12px",
        }}
      >
        <span>Total monthly expenses: {usd(monthlyExpenses)}</span>
        <span>Monthly cash flow: {usd(monthlyCashFlow)}</span>
      </div>

      <button type="button" className="nb-why-calc" onClick={() => setShown(true)}>Calculate My Return on Equity</button>


      {shown && (
        <div className="nb-why-result">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 12,
              marginBottom: 14,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#7c8899", fontWeight: 800 }}>Equity</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#16284a" }}>{usd(equity)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#7c8899", fontWeight: 800 }}>Annual Cash Flow</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#16284a" }}>{usd(income)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#7c8899", fontWeight: 800 }}>Current ROE</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: numColor }}>{roe.toFixed(1)}%</div>
            </div>
          </div>

          <p className="nb-why-result-note" style={{ fontWeight: 800, color: "#16284a" }}>
            Is your equity working as hard as it could?
          </p>

          <p className="nb-why-result-note">
            After <b>{usd(monthlyExpenses)}/mo</b> in P&amp;I, T&amp;I and other operating expenses, your annual
            cash flow is about <b>{usd(income)}/yr</b>. With <b>{usd(equity)}</b> in equity, your property is
            returning <b style={{ color: numColor }}>{roe.toFixed(1)}%</b>. ExchangeUp™ can continuously monitor
            for investment opportunities that may better align with your goals.
          </p>

          <a href={signupHref} className="nb-why-calc" style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 14 }}>
            Monitor My Opportunities
          </a>

          <p className="nb-why-fine">
            Annual cash flow is calculated as gross monthly rent less your entered P&amp;I, T&amp;I and other monthly
            operating expenses, multiplied by twelve. This calculator is for
            educational purposes only and does not constitute financial, tax or investment advice. Results are estimates
            and do not predict or guarantee any outcome.
          </p>

        </div>
      )}
    </div>
  );
}




export function Sec_why() {
  return (
<section id="why" className="px-5 sm:px-8 py-20 sm:py-24">
  <div className="mx-auto" style={{ maxWidth: 1240 }}>
    <div className="nb-why-wrap px-6 sm:px-12 lg:px-16 py-14 lg:py-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* LEFT */}
        <div>
          <h2 className="nb-why-h2">
            Is Your Equity Working<span className="nb-why-up"> Hard Enough</span>?
          </h2>
          <p style={{ color: "#c4d2e6", fontSize: 16, lineHeight: 1.6, margin: "-14px 0 26px" }}>
            Run the numbers on what you own today. If your equity could be doing more elsewhere, that’s what we watch for.
          </p>

          <div className="nb-why-list">
            {[
              "Automatic Return-on-Equity Matching",
              "Purchasing-Capacity Guardrails",
              "Private, Network-Wide Opportunities",
              "Agent & Investor Workspaces",
              "Educational Webinars & Events",
              "And Much More...",

            ].map((item) => (
              <div className="nb-why-item" key={item}>
                <span className="nb-why-check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 7.2L5.2 10.4L12 3.6" stroke="#5cc15f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT - ROE calculator */}
        <RoeMiniCalc />
      </div>
    </div>
  </div>
</section>
  );
}


const SUMMIT_VENDORS = [
  { name: "Joe Bonavita", role: "Qualified Intermediary", info: "Sessions on the qualified-intermediary side of an exchange - mechanics, deadlines, and how funds are handled. Full partner profile coming soon." },
  { name: "Emily Yormak", role: "Cost Segregation Expert", info: "Sessions on cost segregation and bonus depreciation strategies. Full partner profile coming soon." },
  { name: "Wolfgang Suess", role: "DST Specialist", info: "Sessions on Delaware Statutory Trusts (DSTs) as replacement options. Full partner profile coming soon." },
];

function SummitEventCard() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "investor">("agent");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [openVendor, setOpenVendor] = useState<string | null>(null);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = fullName.trim();
    const mail = email.trim();
    if (!name) {
      toast({ title: "Enter your name.", variant: "destructive" });
      return;
    }
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) || mail.length > 255) {
      toast({ title: "Enter a valid email address.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("event_registrations")
      .upsert(
        { full_name: name, email: mail, role, event: "1031-exchange-summit" },
        { onConflict: "email,event", ignoreDuplicates: true },
      );
    setSubmitting(false);

    if (error) {
      toast({
        title: "We couldn't register you.",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    setDone(true);
    toast({ title: "You're registered!", description: "See you at the next summit." });
  }

  const active = SUMMIT_VENDORS.find((v) => v.name === openVendor);

  return (
    <div className="nb-ev">
      <div className="nb-ev-left">
        <span className="nb-ev-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
          Monthly Event Series
        </span>
        <h3 className="nb-ev-title">{UPCOMING_EVENT.title}</h3>
        <p className="nb-ev-copy">{UPCOMING_EVENT.description}</p>
        <div className="nb-ev-meta">
          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
            Next session: {UPCOMING_EVENT.dateLabel}
          </span>
          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
            {UPCOMING_EVENT.timeLabel}
          </span>
          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M15 10l5-5M15 10l5 5M15 10H3" /></svg>
            {UPCOMING_EVENT.platform}
          </span>

          <span className="nb-ev-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.4c2.7.2 5 1.9 5 4.6" /></svg>
            Real Estate Agents, Investors and professionals welcomed
          </span>
        </div>
        <div className="nb-ev-vlabel">Partnered vendors - tap for more info:</div>
        <div className="nb-ev-vchips">
          {SUMMIT_VENDORS.map((v) => (
            <button
              key={v.name}
              type="button"
              className={`nb-ev-vchip${openVendor === v.name ? " open" : ""}`}
              onClick={() => setOpenVendor(openVendor === v.name ? null : v.name)}
            >
              {v.name}
              <i>{v.role}</i>
            </button>
          ))}
        </div>
        {active && <div className="nb-ev-vinfo">{active.info}</div>}
      </div>

      <div className="nb-ev-form">
        {done ? (
          <div className="nb-ev-done">
            <span className="nb-ev-done-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#43a047" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9.5" /><path d="M8 12.3l2.6 2.6L16.5 9" /></svg>
            </span>
            <h4>You're registered!</h4>
            <p>We'll email you the details for the {UPCOMING_EVENT.dateLabel} session - and every monthly summit after it.</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} noValidate>
            <h4 className="nb-ev-form-title">Register free</h4>
            <label className="nb-ev-label" htmlFor="ev-name">Full Name</label>
            <input id="ev-name" className="nb-ev-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" disabled={submitting} />
            <label className="nb-ev-label" htmlFor="ev-email">Email</label>
            <input id="ev-email" className="nb-ev-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={submitting} />
            <span className="nb-ev-label">I'm an</span>
            <div className="nb-ev-roles">
              <button type="button" className={`nb-ev-role${role === "agent" ? " on" : ""}`} onClick={() => setRole("agent")}>Agent</button>
              <button type="button" className={`nb-ev-role${role === "investor" ? " on" : ""}`} onClick={() => setRole("investor")}>Investor</button>
            </div>
            <button type="submit" className="nb-ev-submit" disabled={submitting}>
              {submitting ? "Registering…" : "Register for the Summit"}
            </button>
            <p className="nb-ev-fine">Free to attend. We'll only use your info to send event details.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function Sec_resources() {
  return (
<section id="resources" className="w-full" style={{ background: '#ffffff' }}>
  <div className="mx-auto" style={{ maxWidth: 1240 }}>
    <div className="px-5 sm:px-8 py-20 sm:py-24">
      <SummitEventCard />
      <div className="nb-res-grid">
        {/* (1) Educational Resources */}
        <div className="nb-res-card">
          <h3 className="nb-res-title">Educational Resources</h3>
          <ul className="nb-res-list">
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="2" stroke="#43a047" strokeWidth="1.8"/><path d="M3 9h18M8 2v4M16 2v4" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span><strong>{UPCOMING_EVENT.title}</strong> · {UPCOMING_EVENT.dateLabel}</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="12" rx="2" stroke="#43a047" strokeWidth="1.8"/><path d="M8 21h8M12 17v4" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span>Webinars &amp; Workshops</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 3h10l4 4v14H5z" stroke="#43a047" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v4h4M8 12h7M8 16h7" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span>Articles &amp; Guides</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#43a047" strokeWidth="1.8"/><path d="M10 9l5 3-5 3z" fill="#43a047"/></svg>
              <span>Videos &amp; Tutorials</span>
            </li>
            <li className="nb-res-li">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 18l5-5 4 3 6-7" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 9h4v4" stroke="#43a047" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>Tax Strategies &amp; Insights</span>
            </li>
          </ul>
          <a href="/signup" className="nb-res-link" style={{ marginTop: 'auto', paddingTop: 24 }}>View All Resources →</a>
        </div>

        {/* (2) Learn From Trusted Experts */}
        <div className="nb-res-card">
          <h3 className="nb-res-title">Learn From Trusted Experts</h3>
          <div className="nb-res-experts">
            {/* Placeholder initials avatars - swap each for the real headshot
                (drop photos in /public and replace the div with an <img>). */}
            <div className="nb-res-expert">
              <img className="nb-res-avatar" src="/expert-joe.webp" alt="Joe Bonavita" />
              <div>
                <div className="nb-res-ename">Joe Bonavita</div>
                <div className="nb-res-erole">Qualified Intermediary</div>
              </div>
            </div>
            <div className="nb-res-expert">
              <img className="nb-res-avatar" src="/expert-emily.png" alt="Emily Yormak" />
              <div>
                <div className="nb-res-ename">Emily Yormak</div>
                <div className="nb-res-erole">Cost Segregation Expert</div>
              </div>
            </div>
            <div className="nb-res-expert">
              <img className="nb-res-avatar" src="/expert-wolfgang.jpg" alt="Wolfgang Suess" />
              <div>
                <div className="nb-res-ename">Wolfgang Suess</div>
                <div className="nb-res-erole">DST Specialist</div>
              </div>
            </div>
          </div>
          <a href="/signup" className="nb-res-link" style={{ marginTop: 'auto', paddingTop: 24 }}>Meet All Our Experts →</a>
        </div>

        {/* (3) Pricing */}
        <div className="nb-res-card nb-res-dark">
          <h3 className="nb-res-title">Free for Agents & Investors</h3>
          <ul className="nb-res-clist">
            {[
              'Free for investors - every property and criteria',
              'Free for agents - every client, every property',
              'No plans, no tiers, no upsells',
              'No card required, ever',
              'Members help shape the platform',
            ].map((t) => (
              <li className="nb-res-cli" key={t}>
                <span className="nb-res-check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="#5cc15f" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <a href="/signup" className="nb-btn nb-btn-green nb-res-btn">Add Your First Opportunity</a>
          <div className="nb-res-cap">Completely free</div>
        </div>


      </div>
    </div>
  </div>
</section>
  );
}

function Sec_faqcta() {
  return (
<section id="faq" className="w-full px-5 sm:px-8 py-20 sm:py-24" style={{ background: '#eef3fb' }}>
  <div className="mx-auto" style={{ maxWidth: '1240px' }}>
    <div className="nb-fct-grid">

      {/* LEFT - FAQ column */}
      <div className="nb-fct-left">

      {/* (A) Heading */}
      <div className="nb-fct-head">
        <h2 className="nb-h2">Frequently Asked Questions</h2>
      </div>

      {/* (B) Accordion */}
      <div className="nb-fct-acc">
        {[
          {
            q: 'What happens when ExchangeUp finds an opportunity for me?',
            a: "You'll receive an alert letting you know that ExchangeUp has identified a potential opportunity based on your property, equity position, and investment criteria. You can review the opportunity and decide whether you want to explore it further. There's no obligation to sell, exchange, or pursue any opportunity.",
          },
          {
            q: 'Why is ExchangeUp free?',
            a: "Because ExchangeUp becomes more valuable as more investors, agents, and properties join the network. Our goal is to remove the friction of finding potential 1031 Exchange opportunities and build the largest possible network of investment properties and participating real estate professionals. There is no cost to register your property, receive potential opportunity alerts, or explore matches.",
          },
          {
            q: 'Do I need to be planning a 1031 Exchange right now?',
            a: "No. In fact, that's one of the biggest benefits of ExchangeUp. Register your investment property today and let ExchangeUp continuously look for potential opportunities. If a property enters the network that could be a better fit for your investment goals, we'll let you know. You decide if and when you want to explore an exchange.",
          },
          {
            q: 'How does ExchangeUp determine if another property could be a better investment?',
            a: 'ExchangeUp uses property data, financial information, available equity, and your investment criteria to evaluate potential opportunities across the network. Rather than simply showing you more listings, ExchangeUp is designed to identify properties that may represent a meaningful opportunity to put your equity to work differently. Any opportunity is intended as a starting point for further evaluation-not investment, tax, or financial advice.',
          },
          {
            q: "Will ExchangeUp recommend properties that don't fit what I'm looking for?",
            a: "ExchangeUp uses your investment criteria to help narrow potential opportunities based on factors such as property type, value, location, and other preferences. The goal isn't to send you more properties. It's to surface relevant opportunities worth taking a closer look at.",
          },
          {
            q: 'Are properties registered on ExchangeUp actually for sale?',
            a: "Not necessarily. ExchangeUp is an opportunity network, not another MLS. A property can be registered so the system can evaluate potential matches even if the owner isn't actively marketing it for sale. When a potential opportunity is identified, the parties can decide whether there is mutual interest in exploring a transaction.",
          },
          {
            q: "If I'm an investor, do I have to use an ExchangeUp real estate agent?",
            a: "No. ExchangeUp doesn't require you to give up your existing real estate relationship. If you already have an agent you want to work with, you can continue working with them. If you need an experienced real estate professional, ExchangeUp may also be able to connect you with a participating agent.",
          },
          {
            q: "If I'm a real estate agent, do I keep my client?",
            a: "Yes. ExchangeUp is designed to make your existing relationships and database more valuable-not replace you. When you add clients and properties, you remain their real estate agent. ExchangeUp simply helps uncover potential opportunities within your own database and across the broader ExchangeUp network.",
          },
          {
            q: 'Can other agents see my clients or my entire database?',
            a: "No. Your database isn't made publicly available to other agents. ExchangeUp evaluates information behind the scenes to identify potential opportunities without turning your client list into a shared prospecting database. When an opportunity is identified, only the information necessary to evaluate and facilitate that opportunity is surfaced.",
          },
          {
            q: 'What information do I need to add a property?',
            a: "We've intentionally kept it simple. You can get started with basic information about the property and a few key financial details, such as its estimated value, current loan balance, and rental income. You don't need to complete a complicated financial analysis just to join the network. Additional information can be added as needed to improve the quality of potential matches.",
          },
          {
            q: 'Does ExchangeUp actually handle my 1031 Exchange?',
            a: "No. ExchangeUp helps solve one of the biggest challenges surrounding a 1031 Exchange: identifying potential replacement-property opportunities. The actual exchange should still be completed with the appropriate professionals, including a qualified intermediary and your legal, tax, financial, and real estate advisors. ExchangeUp helps you discover the opportunity. Your professional team helps you determine whether the transaction is right for you and properly execute the exchange.",
          },
        ].map((item, i) => (
          <details className="nb-fct-item" key={i}>
            <summary className="nb-fct-q">
              {item.q}
              <span className="nb-fct-plus" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
            </summary>
            <div className="nb-fct-a">{item.a}</div>
          </details>
        ))}
      </div>


      </div>{/* /nb-fct-left */}

      {/* RIGHT - CTA card */}
      <div className="nb-fct-cta">
        <h3 className="nb-fct-cta-h">Register Your Property. There’s No Obligation to Exchange.</h3>
        <p className="nb-fct-cta-sub">It takes a few minutes and it’s free. From there, we keep watching the network and let you know if something better shows up for your equity.</p>
        <div className="nb-fct-cta-btns">
          <a href="/signup" className="nb-fct-btn nb-fct-btn-green">Register My Property - Free</a>
          <a href="/book-demo" className="nb-fct-btn nb-fct-btn-out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
            Schedule a Demo
          </a>
        </div>
        <div className="nb-fct-social-proof">
          <div className="nb-fct-avatars" aria-hidden="true">
            <span>JM</span>
            <span>AK</span>
            <span>RP</span>
            <span>+</span>
          </div>
          <span className="nb-fct-proof-txt">Join a growing network of 1031-focused agents and investors.</span>
        </div>
      </div>

    </div>
  </div>

  {/* FOOTER */}
  <footer className="nb-fct-footer">
    <div className="nb-fct-footer-inner">
      <div className="nb-fct-fgrid">
        <div>
          <div className="nb-fct-flogo">1031Exchange<b>UP</b><sup>™</sup></div>
          <p className="nb-fct-ftag">Private 1031 exchange matching for investors/property owners and their agents.</p>
        </div>

        <div className="nb-fct-fcol">
          <h4>Platform</h4>
          <ul>
            <li><a href="#how">How It Works</a></li>
            <li><a href="#agents">For Agents</a></li>
            <li><a href="#why">Why Join</a></li>
            <li><a href="#resources">Resources</a></li>
          </ul>
        </div>

        <div className="nb-fct-fcol">
          <h4>Get Started</h4>
          <ul>
            <li><a href="/signup">Join Free</a></li>
            <li><a href="/book-demo">Book a Demo</a></li>
            <li><a href="/landlords">For Property Owners</a></li>
            <li><a href="/login">Log In</a></li>
          </ul>
        </div>

        <div className="nb-fct-fcol">
          <h4>Support</h4>
          <ul>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="mailto:support@1031exchangeup.com">Contact Us</a></li>
            <li><a href="/terms">Terms of Service</a></li>
            <li><a href="/privacy">Privacy Policy</a></li>
          </ul>
        </div>

        <div className="nb-fct-fcol">
          <h4>Stay Up to Date</h4>
          <form className="nb-fct-sub-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" aria-label="Email address" />
            <button type="submit" className="nb-fct-sub-btn">Subscribe</button>
          </form>
        </div>
      </div>
    </div>

    <div className="nb-fct-fbottom">
      <span className="nb-fct-copy">© 2025 1031ExchangeUp™. All rights reserved.</span>
    </div>
  </footer>
</section>
  );
}



export function LandingSections() {
  return (
    <>
      <style>{EXTRA_CSS}</style>
      <Sec_why />
      <Sec_resources />
      <Sec_faqcta />

    </>
  );
}


