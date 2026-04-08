import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Target, Zap, Handshake, BarChart3, Calculator, ShieldCheck, Users, GitBranch, CreditCard, Check, X as XIcon } from "lucide-react";
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
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              The 1031 Exchange Agent Network
            </div>
            <h1 id="hero-heading" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Every Property Pledged Is a Match for{" "}
              <span className="text-primary">Someone Else</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Join a network of agents where your client's property becomes inventory for
              everyone else's client — and theirs becomes inventory for yours. Automatic
              matching. Zero manual searching.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:mt-12 sm:flex-row sm:justify-center sm:gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full gap-2 rounded-lg px-8 text-base sm:w-auto">
                  Join the Network <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="w-full rounded-lg px-8 text-base sm:w-auto">
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Free to join · No upfront costs · Fee only on completed exchanges
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] to-transparent" aria-hidden="true" />
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
