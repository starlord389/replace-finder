import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";

export default function Contact() {
  return (
    <section className="bg-[#f4f2ee] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#6d6a63]">
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#1d1d1d] sm:text-5xl">
          Let&apos;s talk about your exchange goals.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#4a4a4a]">
          Reach out to our team for onboarding questions, product walkthroughs,
          and support. We usually respond within one business day.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <article className="rounded-2xl border border-[#d8d5ce] bg-white p-6">
            <p className="text-sm font-medium text-[#6d6a63]">Email</p>
            <a
              href="mailto:support@1031exchangeup.com"
              className="mt-2 inline-block text-lg font-semibold text-[#1d1d1d] underline-offset-4 hover:underline"
            >
              support@1031exchangeup.com
            </a>
          </article>

          <article className="rounded-2xl border border-[#d8d5ce] bg-white p-6">
            <p className="text-sm font-medium text-[#6d6a63]">Get Started</p>
            <p className="mt-2 text-sm leading-6 text-[#4a4a4a]">
              Ready to join the network? Create your account and set up your
              first exchange profile.
            </p>
            <Link
              to={ROUTES.signup}
              className="mt-4 inline-flex rounded-full bg-[#1d1d1d] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
            >
              Create Account
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
