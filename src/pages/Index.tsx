import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Search, CheckCircle, Building2, TrendingUp, Clock, X as XIcon, Check } from "lucide-react";
import { useHead } from "@/hooks/useHead";

export default function Index() {
  useHead({
    title: "1031ExchangeUp — Private Replacement Property Matching",
    description: "Find your 1031 exchange replacement property before you sell. Submit your exchange goals and receive curated matches from our private inventory.",
    canonical: "https://1031exchangeup.com",
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Private Replacement-Property Matching
            </div>
            <h1 id="hero-heading" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Find your replacement property{" "}
              <span className="text-primary">before you sell.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Stop waiting for the right 1031 exchange property to appear on the market.
              Submit your exchange goals and receive curated matches from our private inventory.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:mt-12 sm:flex-row sm:justify-center sm:gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full gap-2 rounded-lg px-8 text-base sm:w-auto">
                  Start Your Search <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="w-full rounded-lg px-8 text-base sm:w-auto">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] to-transparent" aria-hidden="true" />
      </section>

      {/* Social Proof */}
      <section className="border-y border-border/60 bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-5 sm:px-6">
          {["Trusted by 50+ agents", "Private inventory", "Rules-based matching", "Timeline-aware"].map((item) => (
            <span key={item} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-background" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="how-heading" className="text-3xl font-bold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Three simple steps to your replacement property.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              {
                icon: Search,
                step: "01",
                title: "Submit Your Exchange Goals",
                description: "Tell us about your relinquished property, exchange proceeds, and what you're looking for in a replacement property.",
              },
              {
                icon: TrendingUp,
                step: "02",
                title: "We Match & Curate",
                description: "Our team searches our private inventory and scores properties against your specific financial goals, geography, and strategy preferences.",
              },
              {
                icon: CheckCircle,
                step: "03",
                title: "Review Your Matches",
                description: "Receive curated replacement-property opportunities in your private dashboard with full financials and a clear explanation of why each one fits.",
              },
            ].map((item) => (
              <article key={item.step} className="rounded-xl border border-border/80 bg-card p-7 transition-shadow hover:shadow-sm sm:p-8">
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

      {/* Comparison */}
      <section className="border-t border-border/60 bg-muted/30" aria-labelledby="compare-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="text-center">
            <h2 id="compare-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Why 1031ExchangeUp?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A better way to find your replacement property.
            </p>
          </div>
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
            {/* Our approach */}
            <div className="rounded-xl border border-primary/20 bg-card p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-foreground">1031ExchangeUp</h3>
              <ul className="mt-5 space-y-3.5">
                {[
                  "Private, curated inventory",
                  "Rules-based matching with scoring",
                  "Timeline-aware for 45/180-day deadlines",
                  "Every match reviewed before release",
                  "Full financials and fit explanation",
                  "Confidential — never listed publicly",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Traditional */}
            <div className="rounded-xl border border-border/80 bg-card p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-muted-foreground">Traditional Search</h3>
              <ul className="mt-5 space-y-3.5">
                {[
                  "Public listings with stale data",
                  "Manual filtering across multiple sites",
                  "No timeline awareness",
                  "No pre-screening or review",
                  "Limited financials, no fit context",
                  "Your intent visible to the market",
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

      {/* Trust */}
      <section className="border-t border-border/60 bg-background" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="trust-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Built for Serious Exchangers
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              This is not a public marketplace. It's a private matching platform designed
              for property owners, brokers, and advisors navigating 1031 exchanges.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
            {[
              {
                icon: Shield,
                title: "Private & Confidential",
                description: "Your exchange details and matched properties are never exposed publicly.",
              },
              {
                icon: Building2,
                title: "Curated Inventory",
                description: "Our internal inventory is sourced, vetted, and maintained by our team — not scraped from public listings.",
              },
              {
                icon: Clock,
                title: "Timeline-Aware",
                description: "We understand 1031 deadlines. Matching accounts for your 45-day identification and 180-day close windows.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-border/80 bg-card p-6 transition-shadow hover:shadow-sm sm:p-7">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="border-t border-border/60 bg-muted/30" aria-labelledby="preview-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="preview-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Your Private Dashboard
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Track your exchange request status and review approved replacement-property matches — all in one calm, focused interface.
            </p>
          </div>
          <div className="mx-auto mt-14 max-w-4xl">
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm" role="img" aria-label="Preview of the 1031ExchangeUp private dashboard">
              <div className="border-b border-border/60 px-6 py-4">
                <p className="text-sm font-medium text-muted-foreground">My Exchange Request</p>
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <div className="rounded-lg border border-border/60 bg-muted/50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Request Status</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">Active — Searching</p>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">Submitted Jan 15, 2026</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/50 p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Approved Matches</p>
                  <p className="mt-3 text-3xl font-bold text-foreground">3</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">2 new this week</p>
                </div>
              </div>
              <div className="border-t border-border/60 px-6 py-4">
                <p className="text-xs text-muted-foreground">
                  Latest match: <span className="font-medium text-foreground">Medical Office — Phoenix, AZ</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Strong Match
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/60 bg-muted/40" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="cta-heading" className="text-3xl font-bold text-foreground sm:text-4xl">
              Ready to find your replacement property?
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Submit your 1031 exchange goals today. Our team will start matching
              you with properties from our private inventory.
            </p>
            <Link to="/signup" className="mt-8 inline-block sm:mt-10">
              <Button size="lg" className="gap-2 rounded-lg px-8 text-base">
                Start Your Search <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
