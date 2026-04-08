import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Building2, Target, Zap, Handshake, BarChart3, Calculator, ShieldCheck, Users, GitBranch, CreditCard, Check, X as XIcon, LayoutDashboard, UserCheck, TrendingUp, ArrowUpRight } from "lucide-react";
import { useHead } from "@/hooks/useHead";
import { useEffect, useRef } from "react";

export default function Index() {
  useHead({
    title: "1031ExchangeUp — The 1031 Exchange Agent Network",
    description: "Join a network of agents where your client's property becomes inventory for everyone else's client. Automatic matching. Zero manual searching.",
    canonical: "https://1031exchangeup.com",
  });

  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionsRef.current;
    if (!el) return;
    const targets = el.querySelectorAll("[data-animate]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  const stats = [
    "50+ Active Agents",
    "120+ Properties Pledged",
    "800+ Matches Generated",
    "25+ Exchanges Completed",
  ];

  return (
    <div ref={sectionsRef}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50/80 pt-32 pb-8 sm:pt-40" aria-labelledby="hero-heading">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          {/* Pill badge */}
          <div className="flex justify-center">
            <div className="shimmer-badge mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-gray-600">The 1031 Exchange Agent Network</span>
            </div>
          </div>

          {/* Headline */}
          <h1 id="hero-heading" className="text-5xl font-bold leading-[1.05] tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Every Property Pledged Is a Match for Someone Else
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
            Join a network of agents where your client's property becomes inventory for
            everyone else's client — and theirs becomes inventory for yours. Automatic
            matching. Zero manual searching.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-4">
            <Link to="/signup">
              <button className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-gray-800">
                Join the Network <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/how-it-works">
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50">
                See How It Works
              </button>
            </Link>
          </div>

          {/* Sub-CTA text */}
          <p className="mt-4 text-sm text-gray-400">
            Free to join · No upfront costs · Fee only on completed exchanges
          </p>
        </div>

        {/* Marquee stats bar */}
        <div className="mt-16 overflow-hidden border-y border-gray-100 bg-gray-50/50 py-4">
          <div className="animate-marquee flex whitespace-nowrap">
            {[...stats, ...stats, ...stats, ...stats].map((stat, i) => (
              <span key={i} className="mx-6 text-sm font-medium text-gray-400">
                {stat}
                <span className="ml-6 text-gray-300">·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-20 sm:px-6 sm:pb-28">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Mock browser chrome */}
            <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/70" />
                <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                <div className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-400">
                app.1031exchangeup.com/agent
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="flex min-h-[320px] sm:min-h-[380px]">
              {/* Sidebar */}
              <div className="hidden w-48 shrink-0 border-r border-gray-100 bg-gray-50/50 p-4 sm:block">
                <div className="mb-6 text-sm font-bold text-gray-900">ExchangeUp</div>
                <nav className="space-y-1">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: Users, label: "Clients" },
                    { icon: Target, label: "Matches" },
                    { icon: Handshake, label: "Exchanges" },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${item.active ? "bg-primary/10 font-medium text-primary" : "text-gray-400"}`}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>
              {/* Main content */}
              <div className="flex-1 p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Agent Dashboard</h3>
                  <span className="text-xs text-gray-400">Last updated: just now</span>
                </div>
                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Active Matches", value: "12", icon: Target, change: "+3 this week" },
                    { label: "Pending Connections", value: "3", icon: UserCheck, change: "2 awaiting response" },
                    { label: "Exchange Progress", value: "78%", icon: TrendingUp, change: "On track" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-gray-100 bg-white p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{stat.label}</span>
                        <stat.icon className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <p className="mt-1.5 text-xl font-bold text-gray-900">{stat.value}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{stat.change}</p>
                    </div>
                  ))}
                </div>
                {/* Recent matches list */}
                <div className="rounded-xl border border-gray-100 bg-white">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">Recent Matches</span>
                    <span className="text-xs text-primary">View all <ArrowUpRight className="ml-0.5 inline h-3 w-3" /></span>
                  </div>
                  {[
                    { name: "Retail Strip — Phoenix, AZ", score: 92, status: "New" },
                    { name: "Office Park — Austin, TX", score: 87, status: "Reviewed" },
                    { name: "Multifamily — Denver, CO", score: 81, status: "Connected" },
                  ].map((match) => (
                    <div key={match.name} className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{match.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={match.score} className="h-1.5 w-16" />
                          <span className="text-xs text-gray-400">{match.score}% match</span>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        match.status === "New" ? "bg-primary/10 text-primary" :
                        match.status === "Connected" ? "bg-green-500/10 text-green-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>{match.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white" aria-labelledby="how-heading" data-animate>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="how-heading" className="text-3xl font-bold text-gray-900 sm:text-4xl">How the Network Works</h2>
            <p className="mt-4 text-lg text-gray-500">Four steps from pledge to close.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
            {[
              { icon: Building2, step: "01", title: "Pledge Property", description: "Add your client's property to the network. It becomes a potential replacement for every other agent's client." },
              { icon: Target, step: "02", title: "Set Criteria", description: "Define what your client needs — asset type, geography, price range, cap rate, debt replacement requirements." },
              { icon: Zap, step: "03", title: "Get Matched", description: "The system automatically scores your criteria against every pledged property. 8 dimensions. Boot calculations included." },
              { icon: Handshake, step: "04", title: "Connect & Close", description: "Review matches, start a connection, and the listing agent's identity is revealed. Track the deal through closing." },
            ].map((item) => (
              <article key={item.step} className="rounded-xl border border-gray-200 bg-white p-7 transition-shadow hover:shadow-md">
                <span className="text-xs font-semibold text-primary" aria-hidden="true">{item.step}</span>
                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="border-t border-gray-100 bg-gray-50/50" aria-labelledby="features-heading" data-animate>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 sm:text-4xl">Built for How Agents Actually Work</h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {[
              { icon: BarChart3, title: "8-Dimension Matching", description: "Price, geography, asset type, strategy, financials, timing, debt fit, and scale — all scored automatically." },
              { icon: Calculator, title: "Boot Calculator", description: "Every match shows estimated cash boot, mortgage boot, and tax exposure before you ever make a call." },
              { icon: ShieldCheck, title: "Identity Protection", description: "No cold calls. Agent identities stay hidden until both sides agree to connect." },
              { icon: Users, title: "Multi-Client Management", description: "Manage multiple clients, each with their own exchange, criteria, and matches." },
              { icon: GitBranch, title: "Exchange Tracking", description: "Track connections from first contact through closing with milestone updates and messaging." },
              { icon: CreditCard, title: "Facilitation Fee", description: "No subscriptions. No upfront costs. A simple fee only when an exchange is completed." },
            ].map((feature) => (
              <article key={feature.title} className="rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md sm:p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-gray-100 bg-white" aria-labelledby="compare-heading" data-animate>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="compare-heading" className="text-3xl font-bold text-gray-900 sm:text-4xl">Why Agents Choose ExchangeUp</h2>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
            <div className="rounded-xl border border-gray-200 border-l-4 border-l-primary bg-white p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-900">With ExchangeUp</h3>
              <ul className="mt-5 space-y-4">
                {["Automatic matching across a national agent network", "Boot calculations on every match instantly", "Agent identity protected until you choose to connect", "One platform from match through closing", "Fee only on completed exchanges"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-gray-400">Without ExchangeUp</h3>
              <ul className="mt-5 space-y-4">
                {["Manual searching across multiple platforms", "Spreadsheets and guesswork", "Cold calls and unsolicited pitches", "Emails, phone calls, scattered documents", "Upfront subscriptions and listing fees"].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
                    <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-400/60" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-100 bg-gray-50/50" aria-labelledby="cta-heading" data-animate>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="cta-heading" className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Ready to grow your exchange network?
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              Join 50+ agents already matching on the platform.
            </p>
            <Link to="/signup" className="mt-8 inline-block sm:mt-10">
              <button className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-gray-800">
                Join the Network <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Questions?{" "}
              <a href="mailto:support@1031exchangeup.com" className="text-primary hover:underline">
                support@1031exchangeup.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
