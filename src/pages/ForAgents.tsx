import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/app/routes/routeManifest";
import { NB_STYLE, SkyBackdrop } from "@/pages/Home";
import { EXTRA_CSS, SECTIONS_CSS, Sec_agents, Sec_how, Sec_network, Sec_trust } from "./HomeSections";

export default function ForAgents() {
  useEffect(() => {
    document.title = "For Agents - 1031ExchangeUp™";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        "content",
        "Built for agents: add clients, properties and investment criteria to 1031ExchangeUp™. Your database and the network are monitored continuously for new investment and 1031 exchange opportunities.",
      );
    }
  }, []);

  return (
    <div data-nb className="min-h-screen bg-white">
      <style>{NB_STYLE}</style>
      <style>{SECTIONS_CSS}</style>
      <style>{EXTRA_CSS}</style>

      <section className="nb-hero">
        <SkyBackdrop />
        <div className="nb-hero-inner mx-auto max-w-[1240px] px-5 py-16 text-center sm:px-8 lg:py-24">
          <h1 className="nb-hero-h1 mx-auto max-w-[600px]">
            Your Database. Constantly Monitored for New Opportunities.
          </h1>
          <p className="nb-hero-sub mx-auto mt-5 max-w-[540px]">
            Add investor clients and investment properties to ExchangeUp™. The system continuously evaluates your database and the broader network, and alerts you when a relevant opportunity appears.
          </p>

          <div className="nb-cta-row justify-center" style={{ marginTop: 32 }}>
            <Link to={ROUTES.signup} className="nb-btn nb-btn-green">Add My First Opportunity</Link>
            <Link to={ROUTES.bookDemo} className="nb-btn-demo">Schedule a Demo</Link>
          </div>
        </div>
      </section>

      <Sec_agents />
      <Sec_how />
      <Sec_network />
      <Sec_trust />
    </div>
  );
}
