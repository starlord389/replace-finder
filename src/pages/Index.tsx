import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Search, CheckCircle, Building2, TrendingUp, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Index() {
  return (
    <>
      <Helmet>
        <title>1031ExchangeUp — Private Replacement Property Matching</title>
        <meta name="description" content="Find your 1031 exchange replacement property before you sell. Submit your exchange goals and receive curated matches from our private inventory." />
        <link rel="canonical" href="https://1031exchangeup.com" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-heading">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Private Replacement-Property Matching
            </div>
            <h1 id="hero-heading" className="text-3xl font-bold leading-[1.1] text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Find your replacement property{" "}
              <span className="text-primary">before you sell.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
              Stop waiting for the right 1031 exchange property to appear on the market.
              Submit your exchange goals and receive curated replacement-property matches
              from our private inventory.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
              <Link to="/signup">
                <Button size="lg" className="w-full gap-2 px-8 text-base sm:w-auto">
                  Start Your Search <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg" className="w-full px-8 text-base sm:w-auto">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] to-transparent" aria-hidden="true" />
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/30" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 id="how-heading" className="text-2xl font-semibold text-foreground sm:text-3xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to your replacement property.</p>
          </div>
          <div className="mt-10 grid gap-6 sm:mt-14 md:grid-cols-3 md:gap-8">
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
              <article key={item.step} className="relative rounded-xl border bg-card p-6 sm:p-8">
                <span className="text-xs font-semibold text-primary" aria-hidden="true">{item.step}</span>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t" aria-labelledby="trust-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="trust-heading" className="text-2xl font-semibold text-foreground sm:text-3xl">
              Built for Serious Exchangers
            </h2>
            <p className="mt-3 text-muted-foreground">
              This is not a public marketplace. It's a private matching platform designed
              for property owners, brokers, and advisors navigating 1031 exchanges.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
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
              <article key={item.title} className="rounded-xl border bg-card p-5 sm:p-6">
                <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="border-t bg-muted/30" aria-labelledby="preview-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id="preview-heading" className="text-2xl font-semibold text-foreground sm:text-3xl">
              Your Private Dashboard
            </h2>
            <p className="mt-3 text-muted-foreground">
              Track your exchange request status and review approved replacement-property matches — all in one calm, focused interface.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm" role="img" aria-label="Preview of the 1031ExchangeUp private dashboard">
              <div className="border-b px-4 py-3 sm:px-6 sm:py-4">
                <p className="text-sm font-medium text-muted-foreground">My Exchange Request</p>
              </div>
              <div className="grid gap-3 p-4 sm:gap-4 sm:p-6 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/50 p-4 sm:p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Request Status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <p className="text-sm font-semibold text-foreground">Active — Searching</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted Jan 15, 2026</p>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 sm:p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Approved Matches</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">3</p>
                  <p className="mt-1 text-xs text-muted-foreground">2 new this week</p>
                </div>
              </div>
              <div className="border-t px-4 py-3 sm:px-6 sm:py-4">
                <p className="text-xs text-muted-foreground">
                  Latest match: <span className="font-medium text-foreground">Medical Office — Phoenix, AZ</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Strong Match
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="cta-heading" className="text-2xl font-semibold text-foreground sm:text-3xl">
              Ready to find your replacement property?
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Submit your 1031 exchange goals today. Our team will start matching
              you with properties from our private inventory.
            </p>
            <Link to="/signup" className="mt-6 inline-block sm:mt-8">
              <Button size="lg" className="gap-2 px-8 text-base">
                Start Your Search <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
