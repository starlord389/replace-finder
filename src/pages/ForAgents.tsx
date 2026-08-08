import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { NB_STYLE, SkyBackdrop, HeroNetwork } from "@/pages/Home";
import { SECTIONS_CSS, Sec_agents, Sec_how, Sec_network, Sec_trust } from "./HomeSections";

export default function ForAgents() {
  useEffect(() => {
    document.title = "For Agents — 1031ExchangeUp";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Built for agents: add clients, properties and investment criteria to 1031ExchangeUp and discover 1031 exchange opportunities through intelligent opportunity monitoring.",
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
              Turn Your Client Relationships Into More 1031 Transactions.
            </h1>
            <p className="nb-hero-sub mt-5 max-w-[540px]">
              Add a client, property or investor criteria to 1031ExchangeUp. Exchange IQ continuously monitors the network and alerts you when a potential match appears.
            </p>

            <div className="nb-cta-row" style={{ marginTop: 32 }}>
              <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Join Free</Link>
              <Link to={ROUTES.bookDemo} className="nb-btn-demo">Schedule a Demo</Link>
            </div>
          </div>

          <HeroNetwork />
        </div>
      </section>

      <Sec_agents />
      <Sec_how />
      <Sec_network />
      <Sec_trust />
    </div>
  );
}
