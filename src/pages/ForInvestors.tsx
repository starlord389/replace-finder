import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { NB_STYLE, SkyBackdrop, HeroNetwork } from "@/pages/Home";
import { EXTRA_CSS, SECTIONS_CSS, Sec_how, Sec_investors, Sec_network, Sec_trust, Sec_why } from "./HomeSections";

export default function ForInvestors() {
  useEffect(() => {
    document.title = "For Investors & Property Owners — 1031ExchangeUp";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Built for investors and property owners: add your investment property and goals to 1031ExchangeUp and discover opportunities through intelligent opportunity monitoring.",
      );
    }
  }, []);

  return (
    <div data-nb className="min-h-screen bg-white">
      <style>{NB_STYLE}</style>
      <style>{SECTIONS_CSS}</style>

      <section className="nb-hero">
        <SkyBackdrop />
        <div className="nb-hero-inner mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:py-24">
          <div>
            <h1 className="nb-hero-h1 max-w-[600px]">
              Make Your Equity Work Harder.
            </h1>
            <p className="nb-hero-sub mt-5 max-w-[540px]">
              Add your investment property and goals once. 1031ExchangeUp continuously searches for opportunities that better align with what you want next.
            </p>

            <div className="nb-cta-row" style={{ marginTop: 32 }}>
              <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Join Free</Link>
              <Link to={ROUTES.bookDemo} className="nb-btn-demo">Schedule a Demo</Link>
            </div>
          </div>

          <HeroNetwork />
        </div>
      </section>

      <Sec_investors />
      <Sec_why />
      <Sec_how />
      <Sec_network />
      <Sec_trust />
    </div>
  );
}
