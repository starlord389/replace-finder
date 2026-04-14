import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";

export default function Pricing() {
  return (
    <section className="bg-[#f4f2ee] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#1d1d1d] sm:text-5xl">
          Simple, success-based pricing.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#4a4a4a]">
          No subscriptions. No upfront costs. You only pay a facilitation fee
          when an exchange is successfully completed.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <article className="rounded-2xl border border-[#d8d5ce] bg-white p-8">
            <p className="text-sm font-medium text-[#6d6a63]">For Agents</p>
            <p className="mt-3 text-3xl font-semibold text-[#1d1d1d]">
              Free to join
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4a4a4a]">
              Create your account, pledge properties, and start receiving
              matches at no cost.
            </p>
            <Link
              to={ROUTES.signup}
              className="mt-6 inline-flex rounded-full bg-[#1d1d1d] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Get Started
            </Link>
          </article>

          <article className="rounded-2xl border border-[#d8d5ce] bg-white p-8">
            <p className="text-sm font-medium text-[#6d6a63]">
              Facilitation Fee
            </p>
            <p className="mt-3 text-3xl font-semibold text-[#1d1d1d]">
              Pay on close
            </p>
            <p className="mt-2 text-sm leading-6 text-[#4a4a4a]">
              A simple fee is collected only when an exchange transaction
              successfully closes. No hidden charges.
            </p>
            <Link
              to={ROUTES.contact}
              className="mt-6 inline-flex rounded-full border border-[#d8d5ce] bg-white px-6 py-2.5 text-sm font-medium text-[#1d1d1d] transition-colors hover:bg-[#f6f4ef]"
            >
              Contact Us
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
