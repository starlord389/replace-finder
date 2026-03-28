import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Search, ShieldCheck, Bell, Eye } from "lucide-react";
import { useHead } from "@/hooks/useHead";

export default function HowItWorks() {
  useHead({
    title: "How It Works — 1031ExchangeUp",
    description: "Learn how 1031ExchangeUp matches your exchange goals with curated replacement properties from our private inventory in 5 simple steps.",
    canonical: "https://1031exchangeup.com/how-it-works",
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">How 1031ExchangeUp Works</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          A private, guided experience to help you find the right replacement property for your 1031 exchange.
        </p>
      </header>

      <ol className="mt-12 space-y-10 sm:mt-16 sm:space-y-12" aria-label="How it works steps">
        {[
          {
            icon: FileText,
            step: "1",
            title: "Submit Your Exchange Request",
            description: "Tell us about the property you may sell — its estimated value, your equity, and exchange proceeds. Then describe what you're looking for: target price range, asset types, strategies, geographies, and your exchange timeline.",
          },
          {
            icon: ShieldCheck,
            step: "2",
            title: "We Review & Activate",
            description: "Our team reviews your submission, normalizes the data, and activates your request. Your exchange goals are kept completely confidential — they are never shared publicly.",
          },
          {
            icon: Search,
            step: "3",
            title: "Private Matching Begins",
            description: "We search our internal replacement-property inventory and score each property against your specific goals — financial fit, geography, asset type, strategy, timing, and scale. This is rules-based and explainable, not a black box.",
          },
          {
            icon: Eye,
            step: "4",
            title: "Matches Are Reviewed & Approved",
            description: "Our team reviews every potential match before releasing it to you. Only properties that meet your criteria and pass our review are made visible in your private dashboard.",
          },
          {
            icon: Bell,
            step: "5",
            title: "You Receive Curated Opportunities",
            description: "When an approved match is ready, you'll be notified. Log in to your dashboard to review property details, financials, documents, and a clear explanation of why each property matched your goals.",
          },
        ].map((item) => (
          <li key={item.step} className="flex gap-4 sm:gap-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-12 sm:w-12" aria-hidden="true">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary">Step {item.step}</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* FAQ */}
      <section className="mt-16 border-t pt-12 sm:mt-20 sm:pt-16" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-xl font-semibold text-foreground sm:text-2xl">Frequently Asked Questions</h2>
        <dl className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
          {[
            {
              q: "Is this a public marketplace?",
              a: "No. 1031ExchangeUp is a private matching platform. You will only see properties that have been specifically matched to your exchange goals and approved for release to you.",
            },
            {
              q: "How is matching done?",
              a: "Our matching engine compares your exchange economics, geography preferences, strategy goals, timing, and target price range against our internal inventory using rules-based scoring. Every match comes with an explanation of why it fits.",
            },
            {
              q: "Is my information kept confidential?",
              a: "Absolutely. Your exchange request details and matched properties are never shared publicly. Only our internal team and you have access.",
            },
            {
              q: "What if there are no matches right away?",
              a: "Your request stays active. As new properties enter our inventory, we rerun matching and notify you when an approved match is found.",
            },
            {
              q: "What types of properties are in your inventory?",
              a: "We maintain an internal inventory of investment-grade commercial properties across multiple asset types and strategies, sourced through our own network and research.",
            },
          ].map((faq) => (
            <div key={faq.q}>
              <dt className="font-semibold text-foreground">{faq.q}</dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <div className="mt-16 rounded-xl border bg-card p-8 text-center sm:mt-20 sm:p-10">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          Ready to get started?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Submit your 1031 exchange goals and start receiving curated matches.
        </p>
        <Link to="/signup" className="mt-5 inline-block sm:mt-6">
          <Button size="lg" className="gap-2 px-8">
            Start Your Search <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </main>
  );
}
