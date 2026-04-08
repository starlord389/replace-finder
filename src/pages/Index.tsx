import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  ArrowRight, Building2, Target, Zap, Handshake,
  BarChart3, Shield, Users, ArrowLeftRight, DollarSign,
  Check, X as XIcon, Sparkles, TrendingUp, Star,
  Search, Bell, Settings
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
      {/* ═══ HERO — Two column: text left, visual right ═══ */}
      <section className="relative px-4 pb-10 pt-24 sm:px-6 sm:pt-32 lg:pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(99,132,227,0.06),transparent)]" />

        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — text */}
            <div>
              {/* Pill badge */}
              <div className="animate-fade-in-up mb-7 inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[13px] font-medium text-gray-600">
                  The 1031 Exchange Agent Network
                </span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-in-up delay-100 text-[2.5rem] font-extrabold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem]">
                Every property pledged is a match for{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">someone else</span>
                  <span className="absolute -bottom-1 left-0 z-0 h-3 w-full bg-blue-100/70 rounded-sm" />
                </span>
              </h1>

              {/* Sub */}
              <p className="animate-fade-in-up delay-200 mt-6 max-w-lg text-[16px] leading-relaxed text-gray-500">
                Join a network of agents where your client's property becomes
                inventory for everyone else's client — and theirs becomes
                inventory for yours. Automatic matching. Zero manual searching.
              </p>

              {/* CTAs */}
              <div className="animate-fade-in-up delay-300 mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/10 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/15 active:scale-[0.98]"
                >
                  Join the Network
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3 text-[15px] font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
                >
                  How It Works
                </Link>
              </div>
            </div>

            {/* Right — visual / illustration */}
            <div className="animate-fade-in-up delay-300 relative hidden lg:block">
              {/* Floating cards composition */}
              <div className="relative h-[420px]">
                {/* Main card */}
                <div className="absolute right-0 top-8 w-72 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl shadow-gray-200/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Match Score</p>
                      <p className="text-lg font-bold text-gray-900">92/100</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Price Fit</span><span className="font-semibold text-gray-700">95%</span></div>
                    <div className="h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full bg-blue-500" style={{width:'95%'}} /></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Geography</span><span className="font-semibold text-gray-700">88%</span></div>
                    <div className="h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full bg-blue-500" style={{width:'88%'}} /></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Asset Type</span><span className="font-semibold text-gray-700">100%</span></div>
                    <div className="h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full bg-blue-500" style={{width:'100%'}} /></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Boot Status</span><span className="font-semibold text-emerald-600">No Boot</span></div>
                  </div>
                </div>

                {/* Property card (behind, offset) */}
                <div className="animate-float absolute left-0 top-0 w-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-lg shadow-gray-200/40">
                  <div className="h-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">Riverside Apartments</p>
                  <p className="text-xs text-gray-400">Phoenix, AZ · Multifamily</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">$4.2M</span>
                    <span className="text-xs text-gray-400">6.8% cap</span>
                    <span className="text-xs text-gray-400">48 units</span>
                  </div>
                </div>

                {/* Small notification card */}
                <div className="animate-float absolute bottom-12 left-16 w-56 rounded-xl border border-gray-100 bg-white p-3 shadow-md shadow-gray-200/30" style={{animationDelay:'2s'}}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">New Match Found</p>
                      <p className="text-[10px] text-gray-400">Score: 92 · No Boot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social proof row */}
          <div className="mt-16 grid items-center gap-8 border-t border-gray-100 pt-10 lg:grid-cols-2 lg:gap-16">
            {/* Left — stats */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {["50+ Agents", "120+ Properties", "800+ Matches", "25+ Exchanges"].map((stat) => (
                <span key={stat} className="text-[13px] font-semibold text-gray-300 uppercase tracking-wider">
                  {stat}
                </span>
              ))}
            </div>
            {/* Right — tagline + rating */}
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <p className="text-sm text-gray-500 lg:text-right">
                Automatic matching engine built for commercial real estate agents managing 1031 exchanges.
              </p>
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1 text-xs font-medium text-gray-400">Built by agents, for agents</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DASHBOARD PREVIEW ═══ */}
      <section className="px-4 pb-24 pt-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div data-reveal className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-gray-200/50">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">EU</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5">
                  <Search className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">Search...</span>
                </div>
                <Settings className="h-4 w-4 text-gray-300" />
                <Bell className="h-4 w-4 text-gray-300" />
                <div className="h-6 w-6 rounded-full bg-gray-200" />
              </div>
            </div>
            {/* Content area */}
            <div className="flex">
              {/* Sidebar mock */}
              <div className="hidden w-48 shrink-0 border-r border-gray-50 bg-gray-50/50 px-3 py-4 sm:block">
                {["Dashboard", "My Clients", "Exchanges", "Matches", "Connections"].map((item, i) => (
                  <div
                    key={item}
                    className={`mb-0.5 rounded-lg px-3 py-2 text-xs font-medium ${i === 0 ? "bg-blue-50 text-blue-700" : "text-gray-400"}`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Main content mock */}
              <div className="flex-1 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Active Exchanges", value: "12", change: "+3 this month", color: "text-blue-600" },
                    { label: "Total Matches", value: "847", change: "+24 this week", color: "text-emerald-600" },
                    { label: "Pending Connections", value: "5", change: "2 new requests", color: "text-amber-600" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-xl border border-gray-100 bg-white p-4">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{kpi.label}</p>
                      <p className="mt-1.5 text-2xl font-bold text-gray-900">{kpi.value}</p>
                      <p className={`mt-0.5 text-[10px] font-medium ${kpi.color}`}>{kpi.change}</p>
                    </div>
                  ))}
                </div>
                {/* Chart placeholder */}
                <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-900 mb-3">Match Activity</p>
                  <div className="flex items-end gap-1.5 h-20">
                    {[35, 52, 40, 65, 48, 72, 58, 80, 62, 90, 75, 85].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-blue-100" style={{height: `${h}%`}}>
                        <div className="w-full rounded-sm bg-blue-500 transition-all" style={{height: `${h * 0.6}%`, marginTop: `${h * 0.4}%`}} />
                      </div>
                    ))}
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
