import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  ArrowRight, Building2, Target, Zap, Handshake,
  BarChart3, Shield, Users, ArrowLeftRight, DollarSign,
  Check, X as XIcon, Star, Search, Bell, Settings,
  Briefcase, Link2, LayoutDashboard
} from "lucide-react";

/* ── scroll-reveal hook ────────────────────────── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("animate-fade-in-up");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    children.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ── page ──────────────────────────────────────── */
export default function Index() {
  const root = useReveal();

  return (
    <div ref={root} className="overflow-hidden">
      {/* ═══ HERO — Two column layout like reference ═══ */}
      <section className="relative px-4 pb-0 pt-24 sm:px-6 sm:pt-32 lg:pt-36">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 -z-10" style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-white/80 to-white" />

        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left — text content */}
            <div className="pt-4 lg:pt-8">
              {/* Pill badge */}
              <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[13px] font-medium text-gray-600">
                  Now available for early access
                </span>
              </div>

              {/* Headline — large, left-aligned */}
              <h1 className="animate-fade-in-up delay-100 text-[2.75rem] font-extrabold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
                Real-time matching for{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">modern exchanges</span>
                  <span className="absolute -bottom-1 left-0 z-0 h-3 w-full rounded-sm bg-blue-100/70" />
                </span>
              </h1>

              {/* CTAs */}
              <div className="animate-fade-in-up delay-300 mt-10 flex flex-wrap items-center gap-3">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/10 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/15 active:scale-[0.98]"
                >
                  Join the Network
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3.5 text-[15px] font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                >
                  How It Works
                </Link>
              </div>
            </div>

            {/* Right — illustration area with description + stars */}
            <div className="animate-fade-in-up delay-300 relative hidden lg:block">
              <div className="relative flex flex-col items-end">
                {/* Illustration placeholder — abstract graphic */}
                <div className="relative mb-6 h-64 w-80">
                  {/* Abstract composition of floating cards */}
                  <div className="absolute right-0 top-0 h-52 w-52 rounded-3xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400">Match Score</p>
                        <p className="text-lg font-bold text-gray-900">94%</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-blue-500" style={{width:'94%'}} /></div>
                      <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-blue-400" style={{width:'88%'}} /></div>
                      <div className="h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-blue-300" style={{width:'76%'}} /></div>
                    </div>
                  </div>
                  <div className="animate-float absolute -left-4 top-16 w-44 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-md">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">New Match</p>
                        <p className="text-[10px] text-gray-400">No Boot · 92 Score</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description + stars */}
                <div className="max-w-xs text-right">
                  <p className="text-sm leading-relaxed text-gray-500">
                    Powerful matching engine connecting agents and surfacing replacement properties for faster 1031 exchanges.
                  </p>
                  <div className="mt-3 flex items-center justify-end gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1.5 text-xs font-medium text-gray-400">Built by agents, for agents</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo / stats marquee bar */}
          <div className="mt-16 overflow-hidden border-t border-gray-100 pt-8 pb-4">
            <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-12">
                  {[
                    { icon: Building2, name: "50+ Active Agents" },
                    { icon: Briefcase, name: "120+ Properties Pledged" },
                    { icon: Target, name: "800+ Matches Generated" },
                    { icon: Handshake, name: "25+ Exchanges Completed" },
                    { icon: Shield, name: "Identity Protected" },
                    { icon: Zap, name: "Automatic Matching" },
                  ].map((item) => (
                    <div key={`${setIdx}-${item.name}`} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-gray-300" />
                      <span className="text-sm font-medium text-gray-400">{item.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW — Large card like reference ═══ */}
      <section className="px-4 pb-24 pt-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div data-reveal className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-200/50">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">EU</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">Dashboard</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">Search for something</span>
                </div>
                <Settings className="h-4 w-4 text-gray-300" />
                <Bell className="h-4 w-4 text-gray-300" />
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
              </div>
            </div>
            {/* Content area */}
            <div className="flex min-h-[420px]">
              {/* Sidebar */}
              <div className="hidden w-52 shrink-0 border-r border-gray-50 bg-gray-50/30 px-4 py-5 sm:block">
                {[
                  { icon: LayoutDashboard, label: "Dashboard", active: true },
                  { icon: Briefcase, label: "Exchanges", active: false },
                  { icon: Users, label: "Clients", active: false },
                  { icon: Target, label: "Matches", active: false },
                  { icon: Link2, label: "Connections", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium ${
                      item.active ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="flex-1 p-5">
                {/* Stat cards */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Briefcase, label: "Active Exchanges", value: "12", color: "bg-blue-50 text-blue-600" },
                    { icon: Target, label: "Total Matches", value: "847", color: "bg-emerald-50 text-emerald-600" },
                    { icon: ArrowRight, label: "Completion Rate", value: "+78%", color: "bg-violet-50 text-violet-600" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-gray-100 bg-white p-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-lg ${kpi.color} flex items-center justify-center`}>
                          <kpi.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-400">{kpi.label}</p>
                          <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two charts side by side */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <p className="text-xs font-semibold text-gray-900 mb-3">Match Activity</p>
                    <div className="relative h-28">
                      <svg viewBox="0 0 200 60" className="h-full w-full" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points="0,50 20,42 40,35 60,38 80,28 100,22 120,25 140,18 160,12 180,15 200,8"
                        />
                        {[
                          [0,50],[40,35],[80,28],[120,25],[160,12],[200,8]
                        ].map(([cx, cy], i) => (
                          <circle key={i} cx={cx} cy={cy} r="3" fill="white" stroke="#3b82f6" strokeWidth="2" />
                        ))}
                      </svg>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <p className="text-xs font-semibold text-gray-900 mb-3">Monthly Revenue</p>
                    <div className="relative h-28">
                      <svg viewBox="0 0 200 60" className="h-full w-full" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points="0,45 25,40 50,48 75,30 100,35 125,22 150,28 175,15 200,20"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Two tables side by side */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {/* Recent Matches */}
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <p className="text-xs font-semibold text-gray-900 mb-3">Recent Matches</p>
                    <div className="space-y-3">
                      {[
                        { name: "Riverside Apartments", type: "Multifamily, Phoenix", value: "$4.2M", change: "+16%", positive: true },
                        { name: "Oak Street Office", type: "Office, Dallas", value: "$2.8M", change: "+8%", positive: true },
                        { name: "Harbor Retail", type: "Retail, San Diego", value: "$1.5M", change: "-4%", positive: false },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                              <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-900">{item.name}</p>
                              <p className="text-[10px] text-gray-400">{item.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-700">{item.value}</p>
                            <p className={`text-[10px] font-medium ${item.positive ? "text-emerald-600" : "text-red-500"}`}>{item.change}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Trending Properties */}
                  <div className="rounded-xl border border-gray-100 bg-white p-4">
                    <p className="text-xs font-semibold text-gray-900 mb-3">Trending Properties</p>
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-medium text-gray-400">
                          <td className="pb-2">ID</td>
                          <td className="pb-2">Name</td>
                          <td className="pb-2">Price</td>
                          <td className="pb-2 text-right">Score</td>
                        </tr>
                      </thead>
                      <tbody className="text-xs">
                        {[
                          { id: "041", name: "Mesa Plaza", price: "$3.2M", score: "+92" },
                          { id: "032", name: "Scottsdale Lofts", price: "$5.1M", score: "+88" },
                          { id: "390", name: "Tempe Office", price: "$2.2M", score: "+85" },
                          { id: "120", name: "Gilbert Retail", price: "$4.8M", score: "+81" },
                        ].map((row) => (
                          <tr key={row.id} className="border-t border-gray-50">
                            <td className="py-2 text-gray-400">{row.id}</td>
                            <td className="py-2 font-medium text-gray-700">{row.name}</td>
                            <td className="py-2 text-gray-500">{row.price}</td>
                            <td className="py-2 text-right font-medium text-emerald-600">{row.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-gray-50/60 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-600">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Four steps from pledge to close
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              The entire process is automated. No manual searching, no cold
              calls, no wasted time.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Building2,
                step: "01",
                title: "Pledge Property",
                desc: "Add your client's property to the network. It becomes a potential replacement for every other agent's client.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: Target,
                step: "02",
                title: "Set Criteria",
                desc: "Define what your client needs — asset type, geography, price range, debt replacement requirements.",
                color: "bg-indigo-50 text-indigo-600",
              },
              {
                icon: Zap,
                step: "03",
                title: "Get Matched",
                desc: "The system scores your criteria against every pledged property. 8 dimensions. Boot calculations included.",
                color: "bg-violet-50 text-violet-600",
              },
              {
                icon: Handshake,
                step: "04",
                title: "Connect & Close",
                desc: "Review matches, start a connection, and the listing agent is revealed. Track the deal through closing.",
                color: "bg-emerald-50 text-emerald-600",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                data-reveal
                className={`group relative rounded-2xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 delay-${(i + 1) * 100}`}
              >
                <span className="text-xs font-bold text-gray-300">{item.step}</span>
                <div className={`mt-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-[15px] font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURE GRID (Bento) ═══ */}
      <section className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <div data-reveal className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-600">
              Platform Features
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Built for how agents actually work
            </h2>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "8-Dimension Matching",
                desc: "Price, geography, asset type, strategy, financials, timing, debt fit, and scale — all scored automatically.",
              },
              {
                icon: DollarSign,
                title: "Boot Calculator",
                desc: "Every match shows estimated cash boot, mortgage boot, and tax exposure before you ever make a call.",
              },
              {
                icon: Shield,
                title: "Identity Protection",
                desc: "No cold calls. Agent identities stay hidden until both sides agree to connect.",
              },
              {
                icon: Users,
                title: "Multi-Client Management",
                desc: "Manage multiple clients, each with their own exchange, criteria, and matches — all from one dashboard.",
              },
              {
                icon: ArrowLeftRight,
                title: "Exchange Tracking",
                desc: "Track connections from first contact through closing with milestone updates and in-platform messaging.",
              },
              {
                icon: Handshake,
                title: "Simple Facilitation Fee",
                desc: "No subscriptions. No upfront costs. A simple fee only when an exchange is completed.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                data-reveal
                className={`group rounded-2xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/80 delay-${(i % 3 + 1) * 100}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                  <item.icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="mt-5 text-[15px] font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="bg-gray-50/60 px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <div data-reveal className="text-center">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-600">
              Comparison
            </p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Why agents choose ExchangeUp
            </h2>
          </div>

          <div data-reveal className="mt-14 grid gap-5 delay-200 md:grid-cols-2">
            {/* With */}
            <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-blue-50/50 to-white p-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Check className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">With ExchangeUp</h3>
              </div>
              <ul className="mt-6 space-y-4">
                {[
                  "Automatic matching across a national agent network",
                  "Boot calculations on every match instantly",
                  "Agent identity protected until you choose to connect",
                  "One platform from match through closing",
                  "Fee only on completed exchanges",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Without */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-8">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                  <XIcon className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-400">Without ExchangeUp</h3>
              </div>
              <ul className="mt-6 space-y-4">
                {[
                  "Manual searching across multiple platforms",
                  "Spreadsheets and guesswork for boot exposure",
                  "Cold calls and unsolicited pitches",
                  "Emails, phone calls, scattered documents",
                  "Upfront subscriptions and listing fees",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
                    <span className="text-sm text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BOTTOM CTA ═══ */}
      <section className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <div
            data-reveal
            className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center sm:px-16 sm:py-20"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
            <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
              Ready to grow your exchange network?
            </h2>
            <p className="relative mt-4 text-gray-400">
              Join 50+ agents already matching on the platform.
            </p>
            <Link
              to="/signup"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg active:scale-[0.98]"
            >
              Join the Network
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="relative mt-4 text-sm text-gray-500">
              Questions?{" "}
              <a href="mailto:support@1031exchangeup.com" className="text-gray-400 underline underline-offset-2 hover:text-gray-300">
                support@1031exchangeup.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
