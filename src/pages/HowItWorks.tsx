import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Target, Zap, Handshake } from "lucide-react";
import { useHead } from "@/hooks/useHead";

export default function HowItWorks() {
  useHead({
    title: "How It Works — 1031ExchangeUp",
    description: "Learn how the 1031ExchangeUp agent network matches pledged properties against exchange criteria in 4 steps — from pledge to close.",
    canonical: "https://1031exchangeup.com/how-it-works",
  });

  const steps = [
    {
      icon: Building2,
      step: "01",
      title: "Pledge Your Client's Property",
      paragraphs: [
        "When your client is considering a 1031 exchange, the first step is adding their relinquished property to the network. You'll enter the property details — address, asset type, square footage, units, year built — along with the financials: asking price, NOI, cap rate, occupancy, and debt structure.",
        "Once pledged, that property becomes a potential replacement property for every other agent's client on the platform. You're not listing it publicly — you're making it available to a private network of verified agents.",
        "You can pledge multiple properties across multiple clients. Each one is tracked independently with its own exchange timeline and status.",
      ],
    },
    {
      icon: Target,
      step: "02",
      title: "Define Your Client's Replacement Criteria",
      paragraphs: [
        "For each exchange, you define what your client is looking for in a replacement property. This includes target asset types, geographic preferences (states, metros), price range, minimum cap rate, strategy type, and debt replacement requirements.",
        "The criteria form is designed around how 1031 exchanges actually work — it captures the financial constraints (equity to deploy, debt to replace) alongside the investment preferences (asset class, geography, strategy).",
        "You can update criteria at any time as your client's needs evolve. The matching engine re-runs automatically when criteria change.",
      ],
    },
    {
      icon: Zap,
      step: "03",
      title: "Automatic 8-Dimension Matching",
      paragraphs: [
        "The matching engine scores every pledged property against every set of active criteria across 8 dimensions:",
        "Price Fit (25%) — Does the asking price fall within the buyer's target range? Geo Fit (20%) — Does the property's location match the buyer's geographic preferences? Asset Fit (20%) — Does the asset type match what the buyer is looking for? Strategy Fit (15%) — Does the investment strategy align? Financial Fit (10%) — Do cap rate, occupancy, and NOI meet minimums? Timing Fit (10%) — Can the exchange timeline work for both sides? Debt Fit — Can the buyer's debt replacement requirements be met? Scale Fit — Is the property the right size relative to the buyer's equity?",
        "Every match also includes boot calculations — estimated cash boot, mortgage boot, and potential tax exposure — so you know the financial implications before you ever pick up the phone. Matches scoring 65 or above are surfaced for review.",
      ],
    },
    {
      icon: Handshake,
      step: "04",
      title: "Connect, Negotiate & Close",
      paragraphs: [
        "When you find a match that works, you initiate a connection. At this point — and only at this point — the other agent's identity is revealed. No cold calls, no unsolicited pitches. Both sides have already expressed interest through the matching process.",
        "The platform tracks the connection through its lifecycle: initiated → accepted → under contract → inspection → financing → closed. Both agents can communicate through the built-in messaging system and track milestones.",
        "Revenue for the platform comes from a simple facilitation fee, charged only when an exchange is successfully completed. There are no subscriptions, no upfront costs, and no listing fees.",
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">How the Network Works</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          From pledging a property to closing an exchange — here's how 1031ExchangeUp connects agents across the country.
        </p>
      </header>

      <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-24">
        {steps.map((item) => (
          <section key={item.step} className="flex gap-5 sm:gap-7">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14" aria-hidden="true">
              <item.icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Step {item.step}</p>
              <h2 className="mt-1.5 text-xl font-semibold text-foreground sm:text-2xl">{item.title}</h2>
              <div className="mt-4 space-y-4">
                {item.paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground sm:text-base">{p}</p>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* FAQ */}
      <section className="mt-20 border-t border-border/60 pt-16 sm:mt-28 sm:pt-20" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-2xl font-bold text-foreground sm:text-3xl">Frequently Asked Questions</h2>
        <dl className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
          {[
            {
              q: "What is a 1031 exchange?",
              a: "A 1031 exchange (named after Section 1031 of the IRS tax code) allows an investor to defer capital gains taxes by reinvesting the proceeds from a sold property into a \"like-kind\" replacement property. There are strict timelines: 45 days to identify replacement properties and 180 days to close.",
            },
            {
              q: "Who can use this platform?",
              a: "1031ExchangeUp is built for licensed real estate agents and brokers. Agents manage their clients' exchanges on the platform. Clients receive read-only access to view their matches and exchange status, but all actions are taken by the agent.",
            },
            {
              q: "How does matching work?",
              a: "The matching engine automatically scores every pledged property against every set of active exchange criteria across 8 dimensions: price fit, geographic fit, asset type fit, strategy fit, financial fit, timing fit, debt fit, and scale fit. Matches scoring 65 or above are surfaced for agent review.",
            },
            {
              q: "What does it cost?",
              a: "Free to join. Free to pledge properties and run matches. The platform charges a facilitation fee only when an exchange is successfully completed through a connection made on the platform. No subscriptions, no listing fees, no upfront costs.",
            },
            {
              q: "How is agent identity protected?",
              a: "Agent identities are hidden until both sides agree to connect. When you view a match, you see the property details and match scores, but not the listing agent. Only when you initiate a connection — and the other agent accepts — are identities revealed.",
            },
          ].map((faq) => (
            <div key={faq.q}>
              <dt className="text-base font-semibold text-foreground">{faq.q}</dt>
              <dd className="mt-2 leading-relaxed text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <div className="mt-20 rounded-xl border border-border/80 bg-muted/30 p-10 text-center sm:mt-28 sm:p-12">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Ready to get started?
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Join the network and start matching your clients with replacement properties.
        </p>
        <Link to="/signup" className="mt-7 inline-block sm:mt-8">
          <Button size="lg" className="gap-2 rounded-lg px-8 text-base">
            Join the Network <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </main>
  );
}
