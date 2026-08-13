import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { useHead } from "@/hooks/useHead";
import { NB_STYLE, SkyBackdrop } from "@/pages/Home";
import { EXTRA_CSS, SECTIONS_CSS, Sec_how, Sec_investors, Sec_why } from "./HomeSections";

export default function ForInvestors() {
  useHead({
    title: "For Property Owners — 1031ExchangeUp™",
    description:
      "Add your investment property criteria and let 1031ExchangeUp™ monitor the network for replacement opportunities that fit your equity and strategy.",
    canonical: "/investors",
  });

  return (
    <div data-nb className="min-h-screen bg-white">
      <style>{NB_STYLE}</style>
      <style>{SECTIONS_CSS}</style>
      <style>{EXTRA_CSS}</style>

      <section className="nb-hero">
        <SkyBackdrop />
        <div className="nb-hero-inner mx-auto max-w-[1240px] px-5 py-16 text-center sm:px-8 lg:py-24">
          <h1 className="nb-hero-h1 mx-auto max-w-[600px]">
            Your Investment. Constantly Monitored for What’s Next.
          </h1>
          <p className="nb-hero-sub mx-auto mt-5 max-w-[540px]">
            Add investment property criteria. ExchangeUp™ continuously monitors for opportunities that may better align with your equity position and investment strategy.
          </p>

          <div className="nb-cta-row justify-center" style={{ marginTop: 32 }}>
            <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Monitor My Property</Link>
          </div>
        </div>
      </section>

      <Sec_investors />
      <Sec_why />
      <Sec_how />
    </div>
  );
}
