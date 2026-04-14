import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";

export default function Features() {
  return (
    <section className="bg-[#f4f2ee] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
          Features
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#1d1d1d] sm:text-5xl">
          Everything you need to close more exchanges.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#4a4a4a]">
          From automatic matching to boot calculations, our platform handles the
          heavy lifting so you can focus on your clients.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "8-Dimension Matching",
              desc: "Price, geography, asset type, strategy, financials, timing, debt fit, and scale — all scored automatically.",
            },
            {
              title: "Boot Calculator",
              desc: "Every match shows estimated cash boot, mortgage boot, and tax exposure before you ever make a call.",
            },
            {
              title: "Identity Protection",
              desc: "Agent identities stay hidden until both sides agree to connect. No cold calls.",
            },
            {
              title: "Multi-Client Management",
              desc: "Manage multiple clients, each with their own exchange, criteria, and matches from one dashboard.",
            },
            {
              title: "Exchange Tracking",
              desc: "Track connections from first contact through closing with milestone updates and messaging.",
            },
            {
              title: "Simple Facilitation Fee",
              desc: "No subscriptions. No upfront costs. A simple fee only when an exchange is completed.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[#d8d5ce] bg-white p-6"
            >
              <h3 className="text-base font-semibold text-[#1d1d1d]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#4a4a4a]">
                {item.desc}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10">
          <Link
            to={ROUTES.signup}
            className="inline-flex rounded-full bg-[#1d1d1d] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
}
