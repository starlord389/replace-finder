import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowDownRight } from "lucide-react";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";
import { useHead } from "@/hooks/useHead";
import { trackEvent } from "@/lib/telemetry";
import { ROUTES } from "@/app/routes/routeManifest";
import {
  AgentLandingCta,
  AGENT_LANDING_CTA,
} from "@/features/metaAgentLanding/AgentLandingCta";
import { AgentSearchPreview } from "@/features/metaAgentLanding/AgentSearchPreview";
import {
  AgentControlSection,
  AgentFaqSection,
  AgentWorkflowSection,
} from "@/features/metaAgentLanding/AgentLandingSections";
import {
  buildAgentSignupDestination,
  getCreativeAngle,
  readAgentLandingAttribution,
} from "@/features/metaAgentLanding/landingAttribution";
import "@/features/metaAgentLanding/agentLanding.css";

const PAGE_TITLE = "Find Replacement Properties for 1031 Clients | ExchangeUp";
const PAGE_DESCRIPTION =
  "Create a private client search, set replacement-property requirements, and review potential 1031 exchange matches in ExchangeUp.";

export default function MetaAgentReplacementProperty() {
  const location = useLocation();
  const viewTracked = useRef(false);
  const attribution = useMemo(
    () => readAgentLandingAttribution(location.search),
    [location.search],
  );
  const signupDestination = useMemo(
    () => buildAgentSignupDestination(location.search),
    [location.search],
  );

  useHead({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    robots: "noindex, nofollow",
  });

  useEffect(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    trackEvent("agent_landing_view", {
      route: location.pathname,
      attribution,
      creativeAngle: getCreativeAngle(attribution),
    });
  }, [attribution, location.pathname]);

  const trackCta = (ctaLocation: "header" | "hero" | "final") => {
    trackEvent("agent_landing_cta_clicked", {
      route: location.pathname,
      ctaLocation,
      ctaLabel: AGENT_LANDING_CTA,
      attribution,
      creativeAngle: getCreativeAngle(attribution),
    });
  };

  return (
    <div data-meta-agent-landing className="min-h-screen overflow-x-clip">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#16284a] focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className="agent-header">
        <div className="agent-landing-shell agent-header__inner">
          <a href="#main-content" aria-label="1031ExchangeUP™" className="agent-header__brand">
            <ExchangeLogoLockup textClassName="text-[16px] sm:text-[19px]" />
          </a>

          <nav className="agent-header__nav" aria-label="Landing page">
            <a href="#how-it-works">How it works</a>
            <a href="#agent-control">Your control</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="agent-header__actions">
            <Link className="agent-header__login" to={ROUTES.login}>Log in</Link>
            <AgentLandingCta
              compact
              destination={signupDestination}
              location="header"
              onClick={trackCta}
              className="agent-header__cta"
            />
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="agent-hero" aria-labelledby="agent-hero-title">
          <svg className="agent-hero__parcel-field" viewBox="0 0 1600 920" preserveAspectRatio="none" aria-hidden="true">
            <path className="parcel-line" d="M0 164 H372 V0 M372 164 H636 V392 H922 V108 H1240 V310 H1600" />
            <path className="parcel-line" d="M0 550 H228 V362 H510 V676 H792 V488 H1110 V744 H1404 V520 H1600" />
            <path className="parcel-line" d="M92 920 V730 H420 V842 H696 V702 H1002 V920 M1328 0 V176 H1512" />
            <path className="exchange-line" d="M-40 748 C164 748 214 646 350 646 S550 760 706 612 915 306 1088 306 1280 414 1640 148" />
            <circle className="exchange-node" cx="350" cy="646" r="7" />
            <circle className="exchange-node" cx="706" cy="612" r="7" />
            <circle className="exchange-node exchange-node--active" cx="1088" cy="306" r="10" />
          </svg>

          <div className="agent-landing-shell agent-hero__grid">
            <div className="agent-hero__copy">
              <p className="agent-eyebrow">Built for 1031 exchange agents</p>
              <h1 id="agent-hero-title">Find your client’s next property.</h1>
              <p className="agent-hero__lead">
                Create a private search, define what the replacement property needs to do, and review potential matches in one workspace.
              </p>
              <div className="agent-hero__action">
                <AgentLandingCta
                  destination={signupDestination}
                  location="hero"
                  onClick={trackCta}
                  label="Start a free search"
                />
                <a className="agent-hero__secondary" href="#how-it-works">
                  See how it works
                  <ArrowDownRight aria-hidden="true" />
                </a>
              </div>
              <p className="agent-hero__microcopy">Free to use · Private agent workspace · No credit card required</p>
            </div>

            <div className="agent-hero__product">
              <AgentSearchPreview />
            </div>
          </div>
        </section>

        <AgentWorkflowSection />
        <AgentControlSection />
        <AgentFaqSection />

        <section aria-labelledby="final-cta-title" className="agent-final-cta">
          <svg className="agent-final-cta__motif" viewBox="0 0 1600 640" preserveAspectRatio="none" aria-hidden="true">
            <path className="parcel-line" d="M0 122 H330 V0 M330 122 H568 V306 H842 V86 H1108 V254 H1600" />
            <path className="parcel-line" d="M0 502 H246 V344 H498 V640 M1240 0 V170 H1450 V640" />
            <path className="exchange-line" d="M-60 528 C248 528 296 408 518 408 S758 528 962 320 1264 186 1660 186" />
            <circle className="exchange-node" cx="518" cy="408" r="7" />
            <circle className="exchange-node exchange-node--active" cx="962" cy="320" r="12" />
          </svg>
          <div className="agent-landing-shell agent-final-cta__inner">
            <p className="agent-eyebrow agent-eyebrow--light">Your next search starts here</p>
            <h2 id="final-cta-title">Put your client’s next property in motion.</h2>
            <p className="agent-final-cta__lead">Create the private search, define what fits, and keep the market working in the background.</p>
            <div className="agent-final-cta__action">
              <AgentLandingCta
                destination={signupDestination}
                location="final"
                onClick={trackCta}
                className="focus-visible:ring-white"
              />
              <p className="agent-final-cta__microcopy">Free to use. No credit card required.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="agent-footer">
        <div className="agent-landing-shell agent-footer__inner">
          <p>© {new Date().getFullYear()} 1031ExchangeUP™. All rights reserved.</p>
          <nav aria-label="Legal">
            <Link to={ROUTES.privacy}>Privacy</Link>
            <Link to={ROUTES.terms}>Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
