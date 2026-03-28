import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Search, ShieldCheck, Bell, Eye } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground sm:text-5xl">How 1031ExchangeUp Works</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          A private, guided experience to help you find the right replacement property for your 1031 exchange.
        </p>
      </div>

      <div className="mt-16 space-y-12">
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
          <div key={item.step} className="flex gap-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-primary">Step {item.step}</p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-20 border-t pt-16">
        <h2 className="text-2xl font-semibold text-foreground">Frequently Asked Questions</h2>
        <div className="mt-8 space-y-8">
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
              <h3 className="font-semibold text-foreground">{faq.q}</h3>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-20 rounded-xl border bg-card p-10 text-center">
        <h2 className="text-2xl font-semibold text-foreground">
          Ready to get started?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Submit your 1031 exchange goals and start receiving curated matches.
        </p>
        <Link to="/signup" className="mt-6 inline-block">
          <Button size="lg" className="gap-2 px-8">
            Start Your Search <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
