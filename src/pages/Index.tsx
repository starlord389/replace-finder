import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import {
  ArrowRight, Building2, Target, Zap, Handshake,
  BarChart3, Shield, Users, ArrowLeftRight, DollarSign,
  Check, X as XIcon, Sparkles
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
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
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
      {/* ═══ HERO ═══ */}
      <section className="relative px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        {/* Background grain */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,132,227,0.08),transparent)]" />

        <div className="mx-auto max-w-4xl text-center">
          {/* Pill badge */}
          <div
            data-reveal
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 px-4 py-1.5 text-[13px] font-medium text-gray-600 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            The 1031 Exchange Agent Network
          </div>

          {/* Headline */}
          <h1
            data-reveal
            className="mx-auto max-w-3xl text-[2.75rem] font-extrabold leading-[1.08] tracking-tight text-gray-900 delay-100 sm:text-5xl md:text-6xl lg:text-[4.25rem]"
          >
            Every Property Pledged Is a Match for{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Someone Else
            </span>
          </h1>

          {/* Sub */}
          <p
            data-reveal
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500 delay-200 sm:text-xl"
          >
            Join a network of agents where your client's property becomes
            inventory for everyone else's client — and theirs becomes inventory
            for yours. Automatic matching. Zero manual searching.
          </p>

          {/* CTAs */}
          <div data-reveal className="mt-10 flex flex-col items-center gap-3 delay-300 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-gray-900/10 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-900/15"
            >
              Join the Network
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              See How It Works
            </Link>
          </div>

          {/* Micro text */}
          <p data-reveal className="mt-5 text-sm text-gray-400 delay-400">
            Free to join · No upfront costs · Fee only on completed exchanges
          </p>
        </div>
      </section>

      {/* ═══ STATS MARQUEE ═══ */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="relative overflow-hidden py-5">
          <div className="animate-marquee flex w-max items-center gap-12 px-6">
            {[
              "50+ Active Agents",
              "120+ Properties Pledged",
              "800+ Matches Generated",
              "25+ Exchanges Completed",
              "50+ Active Agents",
              "120+ Properties Pledged",
              "800+ Matches Generated",
              "25+ Exchanges Completed",
            ].map((stat, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold uppercase tracking-wider text-gray-400"
              >
                <span className="h-1 w-1 rounded-full bg-gray-300" />
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="px-4 py-24 sm:px-6 sm:py-32">
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
      <section className="bg-gray-50/60 px-4 py-24 sm:px-6 sm:py-32">
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
      <section className="px-4 py-24 sm:px-6 sm:py-32">
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
      <section className="px-4 pb-24 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-4xl">
          <div
            data-reveal
            className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center sm:px-16 sm:py-20"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

            <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
              Ready to grow your exchange network?
            </h2>
            <p className="relative mt-4 text-gray-400">
              Join 50+ agents already matching on the platform.
            </p>
            <Link
              to="/signup"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg"
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
