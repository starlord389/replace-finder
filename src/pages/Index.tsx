import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Building2, Target, Zap, Handshake, BarChart3, Calculator, ShieldCheck, Users, GitBranch, CreditCard, Check, X as XIcon, LayoutDashboard, UserCheck, TrendingUp, ArrowUpRight } from "lucide-react";
import { useHead } from "@/hooks/useHead";

export default function Index() {
  useHead({
    title: "1031ExchangeUp — The 1031 Exchange Agent Network",
    description: "Join a network of agents where your client's property becomes inventory for everyone else's client. Automatic matching. Zero manual searching.",
    canonical: "https://1031exchangeup.com",
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30" aria-labelledby="hero-heading">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:px-6 sm:pt-28">
          {/* Trust badge */}
          <div className="flex justify-center">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
              <div className="flex -space-x-2">
                {["bg-primary", "bg-blue-400", "bg-indigo-500", "bg-sky-500"].map((bg, i) => (
                  <div key={i} className={`flex h-7 w-7 items-center justify-center rounded-full ${bg} text-[10px] font-bold text-primary-foreground ring-2 ring-card`}>
                    {["JM", "KL", "SR", "AP"][i]}
                  </div>
                ))}
              </div>
              <span className="text-sm font-medium text-muted-foreground">Trusted by <span className="font-semibold text-foreground">50+ agents</span></span>
            </div>
          </div>

          {/* Headline */}
          <div className="relative mx-auto max-w-4xl text-center">
            {/* Floating icon cards — desktop only */}
            <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
              <div className="absolute -left-24 top-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-lg rotate-[-8deg]">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -right-20 top-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-lg rotate-[6deg]">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="absolute -left-16 bottom-8 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-lg rotate-[10deg]">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -right-12 bottom-12 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card shadow-lg rotate-[-6deg]">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
            </div>

            <h1 id="hero-heading" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Every Property Pledged Is a Match for Someone Else
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Join a network of agents where your client's property becomes inventory for
              everyone else's client — and theirs becomes inventory for yours. Automatic
              matching. Zero manual searching.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:mt-10">
              <Link to="/signup">
                <Button size="lg" className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-md">
                  Join the Network <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                Free to join · No upfront costs · Fee only on completed exchanges
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/[0.04]">
            {/* Mock browser chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400/70" />
                <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                <div className="h-3 w-3 rounded-full bg-green-400/70" />
              </div>
              <div className="ml-3 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                app.1031exchangeup.com/agent
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="flex min-h-[320px] sm:min-h-[380px]">
              {/* Sidebar */}
              <div className="hidden w-48 shrink-0 border-r border-border bg-muted/30 p-4 sm:block">
                <div className="mb-6 text-sm font-bold text-foreground">ExchangeUp</div>
                <nav className="space-y-1">
                  {[
                    { icon: LayoutDashboard, label: "Dashboard", active: true },
                    { icon: Users, label: "Clients" },
                    { icon: Target, label: "Matches" },
                    { icon: Handshake, label: "Exchanges" },
                  ].map((item) => (
                    <div key={item.label} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${item.active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>
              {/* Main content */}
              <div className="flex-1 p-4 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Agent Dashboard</h3>
                  <span className="text-xs text-muted-foreground">Last updated: just now</span>
                </div>
                {/* Stat cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Active Matches", value: "12", icon: Target, change: "+3 this week" },
                    { label: "Pending Connections", value: "3", icon: UserCheck, change: "2 awaiting response" },
                    { label: "Exchange Progress", value: "78%", icon: TrendingUp, change: "On track" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border bg-background p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                        <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <p className="mt-1.5 text-xl font-bold text-foreground">{stat.value}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.change}</p>
                    </div>
                  ))}
                </div>
                {/* Recent matches list */}
                <div className="rounded-xl border border-border bg-background">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <span className="text-sm font-medium text-foreground">Recent Matches</span>
                    <span className="text-xs text-primary">View all <ArrowUpRight className="ml-0.5 inline h-3 w-3" /></span>
                  </div>
                  {[
                    { name: "Retail Strip — Phoenix, AZ", score: 92, status: "New" },
                    { name: "Office Park — Austin, TX", score: 87, status: "Reviewed" },
                    { name: "Multifamily — Denver, CO", score: 81, status: "Connected" },
                  ].map((match) => (
                    <div key={match.name} className="flex items-center justify-between border-b border-border/50 px-4 py-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{match.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={match.score} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{match.score}% match</span>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        match.status === "New" ? "bg-primary/10 text-primary" :
                        match.status === "Connected" ? "bg-green-500/10 text-green-600" :
                        "bg-muted text-muted-foreground"
                      }`}>{match.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Trust Bar */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 md:grid-cols-4 md:py-10">
          {[
            { value: "50+", label: "Active Agents" },
            { value: "120+", label: "Properties Pledged" },
            { value: "800+", label: "Matches Generated" },
            { value: "25+", label: "Exchanges Completed" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="how-heading" className="text-3xl font-bold text-foreground sm:text-4xl">How the Network Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Four steps from pledge to close.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 md:grid-cols-4 md:gap-8">
            {[
              {
                icon: Building2,
                step: "01",
                title: "Pledge Property",
                description: "Add your client's property to the network. It becomes a potential replacement for every other agent's client.",
              },
              {
                icon: Target,
                step: "02",
                title: "Set Criteria",
                description: "Define what your client needs — asset type, geography, price range, cap rate, debt replacement requirements.",
              },
              {
                icon: Zap,
                step: "03",
                title: "Get Matched",
                description: "The system automatically scores your criteria against every pledged property. 8 dimensions. Boot calculations included.",
              },
              {
                icon: Handshake,
                step: "04",
                title: "Connect & Close",
                description: "Review matches, start a connection, and the listing agent's identity is revealed. Track the deal through closing.",
              },
            ].map((item) => (
              <article key={item.step} className="rounded-xl border border-border/80 bg-card p-7 transition-shadow hover:shadow-sm">
                <span className="text-xs font-semibold text-primary" aria-hidden="true">{item.step}</span>
                <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid — Bento */}
      <section className="border-t border-border/60 bg-muted/30" aria-labelledby="features-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="features-heading" className="text-3xl font-bold text-foreground sm:text-4xl">Built for How Agents Actually Work</h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
            {[
              {
                icon: BarChart3,
                title: "8-Dimension Matching",
                description: "Price, geography, asset type, strategy, financials, timing, debt fit, and scale — all scored automatically.",
              },
              {
                icon: Calculator,
                title: "Boot Calculator",
                description: "Every match shows estimated cash boot, mortgage boot, and tax exposure before you ever make a call.",
              },
              {
                icon: ShieldCheck,
                title: "Identity Protection",
                description: "No cold calls. Agent identities stay hidden until both sides agree to connect.",
              },
              {
                icon: Users,
                title: "Multi-Client Management",
                description: "Manage multiple clients, each with their own exchange, criteria, and matches.",
              },
              {
                icon: GitBranch,
                title: "Exchange Tracking",
                description: "Track connections from first contact through closing with milestone updates and messaging.",
              },
              {
                icon: CreditCard,
                title: "Facilitation Fee",
                description: "No subscriptions. No upfront costs. A simple fee only when an exchange is completed.",
              },
            ].map((feature) => (
              <article key={feature.title} className="rounded-xl border border-border/80 bg-card p-6 transition-shadow hover:shadow-sm sm:p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-border/60 bg-background" aria-labelledby="compare-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="compare-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Why Agents Choose ExchangeUp
            </h2>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
            {/* With */}
            <div className="rounded-xl border-l-4 border border-l-primary border-border/80 bg-card p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-foreground">With ExchangeUp</h3>
              <ul className="mt-5 space-y-4">
                {[
                  "Automatic matching across a national agent network",
                  "Boot calculations on every match instantly",
                  "Agent identity protected until you choose to connect",
                  "One platform from match through closing",
                  "Fee only on completed exchanges",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Without */}
            <div className="rounded-xl border border-border/80 bg-card p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-muted-foreground">Without ExchangeUp</h3>
              <ul className="mt-5 space-y-4">
                {[
                  "Manual searching across multiple platforms",
                  "Spreadsheets and guesswork",
                  "Cold calls and unsolicited pitches",
                  "Emails, phone calls, scattered documents",
                  "Upfront subscriptions and listing fees",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-destructive/60" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60 bg-muted/40" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="cta-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Ready to grow your exchange network?
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Join 50+ agents already matching on the platform.
            </p>
            <Link to="/signup" className="mt-8 inline-block sm:mt-10">
              <Button size="lg" className="gap-2 rounded-lg px-8 text-base">
                Join the Network <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Questions?{" "}
              <a href="mailto:support@1031exchangeup.com" className="text-primary hover:underline">
                support@1031exchangeup.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
