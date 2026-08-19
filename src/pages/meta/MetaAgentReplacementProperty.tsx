import { useEffect, useMemo, useRef, useState } from "react";
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
  AgentPlatformStorySection,
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
  const [darkHeader, setDarkHeader] = useState(false);
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

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const darkSection = document.getElementById("agent-control");
    if (!darkSection) return;
    const observer = new IntersectionObserver(
      ([entry]) => setDarkHeader(entry.isIntersecting),
      { rootMargin: "-112px 0px -72% 0px", threshold: 0 },
    );
    observer.observe(darkSection);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>("[data-agent-reveal]");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add("is-visible");
        observer.unobserve(entry.target);
      }),
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    revealItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-meta-agent-landing]");
    const hero = document.querySelector<HTMLElement>(".agent-hero");
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".agent-workflow__panel"));
    const control = document.querySelector<HTMLElement>(".agent-control");
    const finalCta = document.querySelector<HTMLElement>(".agent-final-cta");
    if (!root || !hero) return;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const smoothstep = (value: number) => value * value * (3 - 2 * value);
    let frame = 0;

    const updateMotion = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      const heroRect = hero.getBoundingClientRect();
      const heroProgress = clamp((112 - heroRect.top) / 420);
      root.style.setProperty("--hero-copy-opacity", String(1 - heroProgress));
      root.style.setProperty("--hero-copy-blur", `${heroProgress * 7}px`);
      root.style.setProperty("--hero-copy-shift", `${heroProgress * -12}px`);
      root.style.setProperty("--hero-product-scale", String(0.992 - heroProgress * 0.042));
      root.style.setProperty("--hero-product-lift", `${heroProgress * -20}px`);
      root.style.setProperty("--hero-field-scale-x", String(1 - heroProgress * 0.43));
      root.style.setProperty("--hero-field-scale-y", String(1 - heroProgress * 0.25));
      root.style.setProperty("--hero-field-opacity", String(0.4 + heroProgress * 0.3));

      const activityReveal = smoothstep(clamp((heroProgress - 0.02) / 0.34));
      const conversationReveal = smoothstep(clamp((heroProgress - 0.17) / 0.38));
      const listingReveal = smoothstep(clamp((heroProgress - 0.25) / 0.38));
      root.style.setProperty("--roll-activity-opacity", String(activityReveal));
      root.style.setProperty("--roll-activity-x", `${(1 - activityReveal) * 70}px`);
      root.style.setProperty("--roll-activity-y", `${(1 - activityReveal) * -24}px`);
      root.style.setProperty("--roll-activity-scale", String(0.94 + activityReveal * 0.06));
      root.style.setProperty("--roll-activity-rotate", `${(1 - activityReveal) * -1.4}deg`);
      root.style.setProperty("--roll-activity-blur", `${(1 - activityReveal) * 5}px`);
      root.style.setProperty("--roll-conversation-opacity", String(conversationReveal));
      root.style.setProperty("--roll-conversation-x", `${(1 - conversationReveal) * 76}px`);
      root.style.setProperty("--roll-conversation-y", `${(1 - conversationReveal) * 22}px`);
      root.style.setProperty("--roll-conversation-scale", String(0.95 + conversationReveal * 0.05));
      root.style.setProperty("--roll-conversation-rotate", `${(1 - conversationReveal) * 1.15}deg`);
      root.style.setProperty("--roll-conversation-blur", `${(1 - conversationReveal) * 4}px`);
      root.style.setProperty("--roll-listing-opacity", String(listingReveal));
      root.style.setProperty("--roll-listing-x", `${(1 - listingReveal) * -78}px`);
      root.style.setProperty("--roll-listing-y", `${(1 - listingReveal) * 24}px`);
      root.style.setProperty("--roll-listing-scale", String(0.95 + listingReveal * 0.05));
      root.style.setProperty("--roll-listing-rotate", `${(1 - listingReveal) * -1.15}deg`);
      root.style.setProperty("--roll-listing-blur", `${(1 - listingReveal) * 4}px`);

      panels.forEach((panel, index) => {
        const rect = panel.getBoundingClientRect();
        const progress = clamp((viewportHeight * 0.92 - rect.top) / (viewportHeight * 0.7));
        panel.style.setProperty("--panel-opacity", String(0.22 + progress * 0.78));
        panel.style.setProperty("--panel-scale", String(0.925 + progress * 0.075));
        panel.style.setProperty("--panel-shift", `${(1 - progress) * 76}px`);
        panel.style.setProperty("--panel-copy-shift", `${(1 - progress) * 32}px`);
        const cardShift = (1 - progress) * (index % 2 === 0 ? 54 : -54);
        panel.style.setProperty("--panel-card-shift", `${cardShift}px`);
        panel.style.setProperty("--panel-card-shift-reverse", `${cardShift * -1}px`);
        panel.style.setProperty("--panel-glow-opacity", String(progress * 0.9));
      });

      if (control) {
        const rect = control.getBoundingClientRect();
        const progress = clamp((viewportHeight * 0.88 - rect.top) / (viewportHeight * 0.72));
        control.style.setProperty("--control-motion-opacity", String(0.25 + progress * 0.75));
        control.style.setProperty("--control-motion-shift", `${(1 - progress) * 62}px`);
        control.style.setProperty("--control-orbit-scale", String(0.36 + progress * 0.64));
        control.style.setProperty("--control-map-scale", String(0.92 + progress * 0.08));
        control.style.setProperty("--control-orbit-offset", String(620 - progress * 620));
      }

      if (finalCta) {
        const rect = finalCta.getBoundingClientRect();
        const progress = clamp((viewportHeight * 0.9 - rect.top) / (viewportHeight * 0.72));
        finalCta.style.setProperty("--final-motion-opacity", String(0.2 + progress * 0.8));
        finalCta.style.setProperty("--final-motion-shift", `${(1 - progress) * 52}px`);
        finalCta.style.setProperty("--final-line-offset", String(780 - progress * 780));
      }
    };

    const scheduleMotionUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateMotion);
    };

    updateMotion();
    window.addEventListener("scroll", scheduleMotionUpdate, { passive: true });
    window.addEventListener("resize", scheduleMotionUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleMotionUpdate);
      window.removeEventListener("resize", scheduleMotionUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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
    <div data-meta-agent-landing className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#16284a] focus:shadow-lg"
      >
        Skip to content
      </a>

      <header className={`agent-header${darkHeader ? " is-dark" : ""}`}>
        <a className="agent-header__announcement" href="#how-it-works">
          See how ExchangeUp turns one property into a focused replacement search
          <span aria-hidden="true">→</span>
        </a>
        <div className="agent-header__nav-row">
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
                label="Start for free"
              />
            </div>
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
            </div>

            <div className="agent-hero__product">
              <AgentSearchPreview />
            </div>
          </div>
        </section>

        <AgentPlatformStorySection />
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
