import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";

const footerLinks = [
  { label: "Home", to: ROUTES.home },
  { label: "How It Works", to: `${ROUTES.home}#process` },
  { label: "Features", to: `${ROUTES.home}#feature` },
  { label: "Contact", to: `${ROUTES.home}#contact` },
  { label: "Login", to: ROUTES.login },
  { label: "Get Started", to: ROUTES.signup },
] as const;

export default function LandingFooter() {
  return (
    <footer className="px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-[1240px] rounded-[32px] bg-[#f0ece6] px-8 py-10 text-[#1d1d1d] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_110px] md:items-start md:gap-8 lg:gap-10">
          <div className="min-w-0">
            <section className="max-w-[470px]">
              <p className="text-[18px] font-normal tracking-[-0.04em] text-[#5f5a53] sm:text-[22px] lg:text-[28px]">
              Sign up for our newsletter
              </p>
              <form
                className="relative mt-5 max-w-[470px]"
                onSubmit={(event) => event.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="name@email.com"
                  className="h-11 w-full rounded-full border-0 bg-white px-4 pr-32 text-[15px] text-[#1d1d1d] outline-none placeholder:text-[#b2aea8] sm:h-12 sm:px-5 sm:pr-36"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 flex h-9 items-center rounded-full bg-[#efefef] px-5 text-[14px] font-medium tracking-[-0.02em] text-[#1d1d1d] transition-colors hover:bg-[#e8e8e8] sm:h-10 sm:px-6"
                >
                  Subscribe
                </button>
              </form>
            </section>

            <div className="mt-14 sm:mt-20 lg:mt-28">
              <a
                href="mailto:support@1031exchangeup.com"
                className="break-words text-[2.15rem] font-medium leading-[0.95] tracking-[-0.06em] text-[#111111] transition-colors hover:text-[#44403b] sm:text-[3rem] lg:text-[3.45rem] xl:text-[4.05rem]"
              >
                support@1031exchangeup.com
              </a>
              <p className="mt-3 text-[13px] tracking-[-0.02em] text-[#7d766e] sm:text-[14px]">
                © {new Date().getFullYear()} 1031 Exchange Up. All rights reserved.
              </p>
            </div>
          </div>

          <nav aria-label="Footer navigation" className="md:justify-self-end">
            <p className="text-[16px] font-normal tracking-[-0.03em] text-[#605f5f]">
              Pages
            </p>
            <div className="mt-4 flex flex-col items-start gap-3">
              {footerLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-[15px] font-medium tracking-[-0.03em] text-[#1d1d1d] transition-colors hover:text-[#605f5f]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}
