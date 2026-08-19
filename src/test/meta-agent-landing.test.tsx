import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MetaAgentReplacementProperty from "@/pages/meta/MetaAgentReplacementProperty";
import Signup from "@/pages/auth/Signup";
import {
  CURRENT_PROPERTY,
  ILLUSTRATIVE_DEAL_ASSUMPTIONS,
  ILLUSTRATIVE_MATCHES,
} from "@/features/metaAgentLanding/agentWorkflowData";
import {
  buildAgentSignupDestination,
  readAgentLandingAttribution,
} from "@/features/metaAgentLanding/landingAttribution";
import { AGENT_LANDING_CTA } from "@/features/metaAgentLanding/AgentLandingCta";
import { trackEvent } from "@/lib/telemetry";

vi.mock("@/lib/telemetry", () => ({
  trackEvent: vi.fn(),
}));

const campaignSearch =
  "?utm_source=facebook&utm_medium=paid_social&utm_campaign=agents&utm_content=workflow&" +
  "utm_term=1031&fbclid=fb-123&campaign_id=campaign-1&adset_id=adset-2&ad_id=ad-3&" +
  "creative_angle=private-search&placement=instagram_story";

describe("Meta agent replacement-property landing page", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
    document.querySelector('meta[name="robots"]')?.remove();
  });

  afterEach(() => {
    cleanup();
  });

  it("preserves paid attribution and forces the agent signup path", () => {
    const destination = buildAgentSignupDestination(`${campaignSearch}&role=investor`);
    const destinationUrl = new URL(destination, "https://exchangeup.test");

    expect(destinationUrl.pathname).toBe("/signup");
    expect(destinationUrl.searchParams.get("role")).toBe("agent");
    expect(destinationUrl.searchParams.get("utm_source")).toBe("facebook");
    expect(destinationUrl.searchParams.get("campaign_id")).toBe("campaign-1");
    expect(destinationUrl.searchParams.get("adset_id")).toBe("adset-2");
    expect(destinationUrl.searchParams.get("ad_id")).toBe("ad-3");
    expect(destinationUrl.searchParams.get("creative_angle")).toBe("private-search");
    expect(destinationUrl.searchParams.get("placement")).toBe("instagram_story");
  });

  it("renders the approved agent-only message, noindex metadata, and one CTA action", () => {
    const { unmount } = render(
      <StrictMode>
        <MemoryRouter initialEntries={[`/meta/agents/replacement-property${campaignSearch}`]}>
          <MetaAgentReplacementProperty />
        </MemoryRouter>
      </StrictMode>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Find Replacement Properties Faster.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("For Real Estate Agents")).toBeInTheDocument();
    expect(document.querySelector(".agent-hero .agent-eyebrow svg")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "The biggest obstacle to a 1031 Exchange is finding a replacement property. We’ve solved that. 1031 ExchangeUp™ creates more opportunities and deal flow by connecting property owners, agents, and investment properties across one intelligent network.",
      ),
    ).toBeInTheDocument();
    const announcement = screen.getByRole("link", {
      name: "Sign Up for Free — No Credit Card Required",
    });
    expect(announcement).toHaveAttribute(
      "href",
      buildAgentSignupDestination(campaignSearch),
    );
    expect(screen.getByRole("link", { name: "See How ExchangeUp Works" })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
    expect(screen.getAllByRole("link", { name: AGENT_LANDING_CTA })).toHaveLength(3);
    expect(document.querySelector('[data-cta-location="header"]')).toHaveTextContent(AGENT_LANDING_CTA);
    expect(document.querySelector('[data-cta-location="hero"]')).toHaveTextContent(AGENT_LANDING_CTA);
    expect(screen.queryByText("For Investors")).not.toBeInTheDocument();
    expect(screen.queryByText("Talk to sales")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /keep the full replacement story connected/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Stop searching listing by listing." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("ExchangeUp automatically surfaces the strongest replacement opportunities using your client’s property and investment goals, helping you close the sale, stay involved in the replacement purchase, and generate more business from every client completing a 1031 exchange."),
    ).toBeInTheDocument();
    const workflowHeading = screen.getByRole("heading", { name: "Stop searching listing by listing." });
    const platformStoryHeading = screen.getByRole("heading", { name: /keep the full replacement story connected/i });
    const controlHeading = screen.getByRole("heading", { name: "A private search you stay in control of." });
    const trustedBrokerages = screen.getByText("Trusted by agents from these brokerages");
    expect(
      trustedBrokerages.compareDocumentPosition(workflowHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      workflowHeading.compareDocumentPosition(platformStoryHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      platformStoryHeading.compareDocumentPosition(controlHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getAllByText("Turn your client’s current property and priorities into a search for something better.")).toHaveLength(2);
    expect(screen.getAllByText("Find the opportunity that starts the conversation.")).toHaveLength(2);
    expect(screen.getAllByText("Know what’s worth putting in front of your client.")).toHaveLength(2);
    expect(screen.getAllByText("Turn the right match into action.")).toHaveLength(2);
    expect(screen.getByText("The current property establishes the client’s estimated equity and purchasing position. Optional criteria, such as location, property type, financing, and projected return, help ExchangeUp focus on opportunities that could make an exchange more compelling.")).toBeInTheDocument();
    expect(screen.getByText("Rather than waiting to learn whether your client wants to sell, ExchangeUp continuously monitors the network for properties that may improve their investment position, so you can uncover potential exchanges worth reviewing and create a new reason to start the conversation.")).toBeInTheDocument();
    expect(screen.getByText("See the matched properties, review the financial comparison with your client’s current property, and understand why they fit the search. ExchangeUp only creates matches for properties with a higher projected return on equity, giving you a clear financial case to present to your client.")).toBeInTheDocument();
    expect(screen.getByText("Present the opportunity to your client and explain why it may be worth considering. If your client wants to move forward, connect directly with the listing agent, coordinate the next steps, and guide the exchange toward closing. If the property is not the right fit, you can keep the search active so ExchangeUp can continue finding new opportunities for your client.")).toBeInTheDocument();
    const workflowNav = screen.getByRole("list", { name: "How the ExchangeUp search works" });
    const workflowButtons = within(workflowNav).getAllByRole("button");
    expect(workflowButtons).toHaveLength(4);
    expect(workflowButtons.map((button) => button.querySelector("small")?.textContent)).toEqual([
      "Build the Search",
      "Discover Opportunities Automatically",
      "Review the Matches",
      "Advance the Opportunity",
    ]);
    workflowButtons.forEach((button) => {
      fireEvent.focus(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
    });
    const workflowPanels = document.querySelectorAll(".agent-workflow__panel");
    expect(workflowPanels).toHaveLength(4);
    const buildSearchPanel = within(workflowPanels[0] as HTMLElement);
    const buildSearchPreview = buildSearchPanel.getByLabelText(
      "Animated client listing creation and publishing workflow",
    );
    expect(["property-details", "financial-details", "replacement-criteria", "listing-review", "listing-published"]).toContain(
      buildSearchPreview.getAttribute("data-workflow-phase"),
    );
    const buildSearchScenes = buildSearchPreview.querySelectorAll(".workflow-build-live__scene");
    expect(buildSearchScenes).toHaveLength(5);
    expect(
      Array.from(buildSearchScenes).filter(
        (scene) => scene.getAttribute("aria-hidden") === "false",
      ),
    ).toHaveLength(1);
    expect(buildSearchPanel.getByText("Create the listing for your client’s current property")).toBeInTheDocument();
    expect(buildSearchPanel.getAllByText("$2,400,000")).not.toHaveLength(0);
    expect(buildSearchPanel.getByText("Publish listing")).toBeInTheDocument();
    expect(buildSearchPanel.getByText("214 Shrewsbury Street is now active")).toBeInTheDocument();
    expect(buildSearchPanel.queryByText("Relinquished property")).not.toBeInTheDocument();
    const advancePanel = within(workflowPanels[3] as HTMLElement);
    expect(advancePanel.getByLabelText("Animated listing-agent conversation workflow")).toBeInTheDocument();
    expect(advancePanel.getByText("Start agent conversation")).toBeInTheDocument();
    expect(advancePanel.getByText("Conversation with listing agent")).toBeInTheDocument();
    document.querySelectorAll(".workflow-canvas__progress").forEach((progress) => {
      expect(progress.children).toHaveLength(4);
    });
    expect(screen.getAllByText("Match rationale")).toHaveLength(1);
    expect(screen.getByText("Pipeline stage")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Real estate brokerage network" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Compass" })).toHaveAttribute(
      "src",
      "/logos/compass.svg",
    );
    expect(screen.getByRole("img", { name: "Keller Williams Realty" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "eXp Realty" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Churchill Real Estate" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Aluxety Real Estate" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "LYV Realty" })).toBeInTheDocument();
    expect(screen.getByText("Trusted by agents from these brokerages")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "RE/MAX" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Coldwell Banker" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Corcoran" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Redfin" })).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Additional real estate brokerages" }),
    ).not.toHaveTextContent("Financial position");
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
    );
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Create a private search using the property your client is selling, then review potential replacement properties based on its financials and your client’s preferences.",
    );

    const viewEvents = vi
      .mocked(trackEvent)
      .mock.calls.filter(([event]) => event === "agent_landing_view");
    expect(viewEvents).toHaveLength(1);
    expect(viewEvents[0][1]).toMatchObject({
      route: "/meta/agents/replacement-property",
      creativeAngle: "private-search",
      attribution: {
        utm_source: "facebook",
        campaign_id: "campaign-1",
        adset_id: "adset-2",
        ad_id: "ad-3",
        placement: "instagram_story",
      },
    });

    unmount();
    expect(document.querySelector('meta[name="robots"]')).not.toBeInTheDocument();
  });

  it("starts the Step 1 dashboard sequence in view and advances through listing publication", () => {
    vi.useFakeTimers();
    const VisibleIntersectionObserver = class {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, intersectionRatio: 0.55, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
    };
    vi.stubGlobal("IntersectionObserver", VisibleIntersectionObserver);

    try {
      render(
        <MemoryRouter initialEntries={["/meta/agents/replacement-property#how-it-works"]}>
          <MetaAgentReplacementProperty />
        </MemoryRouter>,
      );

      const preview = screen.getByLabelText(
        "Animated client listing creation and publishing workflow",
      );
      expect(preview).toHaveAttribute("data-workflow-phase", "property-details");
      expect(preview.querySelector(".workflow-build-live__scene--property")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(3_500));
      expect(preview).toHaveAttribute("data-workflow-phase", "financial-details");
      expect(preview.querySelector(".agent-live-scene--analysis")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(3_700));
      expect(preview).toHaveAttribute("data-workflow-phase", "replacement-criteria");
      expect(preview.querySelector(".workflow-build-live__scene--goals")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(3_800));
      expect(preview).toHaveAttribute("data-workflow-phase", "listing-review");
      expect(preview.querySelector(".workflow-build-live__scene--ready")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(3_600));
      expect(preview).toHaveAttribute("data-workflow-phase", "listing-published");
      expect(preview.querySelector(".workflow-build-live__scene--published")).toHaveAttribute("aria-hidden", "false");
    } finally {
      cleanup();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("runs the Step 2 automatic-discovery sequence only after the dashboard enters view", () => {
    vi.useFakeTimers();
    const VisibleIntersectionObserver = class {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, intersectionRatio: 0.55, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
    };
    vi.stubGlobal("IntersectionObserver", VisibleIntersectionObserver);

    try {
      render(
        <MemoryRouter initialEntries={["/meta/agents/replacement-property#how-it-works"]}>
          <MetaAgentReplacementProperty />
        </MemoryRouter>,
      );

      const preview = screen.getByLabelText(
        "Animated automatic replacement-property discovery preview",
      );
      expect(preview).not.toHaveTextContent(/new match notification|a new match was found/i);
      expect(preview).toHaveTextContent("Matched properties");
      expect(preview).toHaveAttribute("data-workflow-phase", "listing-published");
      expect(preview.querySelector(".workflow-build-live__scene--published")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(2_200));
      expect(preview).toHaveAttribute("data-workflow-phase", "calculating-position");
      expect(preview).toHaveTextContent("Calculating the exchange position");
      expect(preview.querySelector(".workflow-discover-shared__scene--engine")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(3_600));
      expect(preview).toHaveAttribute("data-workflow-phase", "evaluating-network");
      expect(preview).toHaveTextContent("Evaluating eligible properties across the network");

      act(() => vi.advanceTimersByTime(3_600));
      expect(preview).toHaveAttribute("data-workflow-phase", "matches");
      expect(preview.querySelector(".workflow-discover-shared__scene--matches")).toHaveAttribute("aria-hidden", "false");
    } finally {
      cleanup();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("runs the Step 3 matched-property review sequence only after the dashboard enters view", () => {
    vi.useFakeTimers();
    const VisibleIntersectionObserver = class {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, intersectionRatio: 0.55, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
    };
    vi.stubGlobal("IntersectionObserver", VisibleIntersectionObserver);

    try {
      render(
        <MemoryRouter initialEntries={["/meta/agents/replacement-property#how-it-works"]}>
          <MetaAgentReplacementProperty />
        </MemoryRouter>,
      );

      const preview = screen.getByLabelText(
        "Animated matched-property review and financial comparison preview",
      );
      expect(preview).toHaveAttribute("data-workflow-phase", "matches");
      expect(preview.querySelector(".workflow-discover-shared__scene--matches")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(4_200));
      expect(preview).toHaveAttribute("data-workflow-phase", "opening-match");
      expect(preview.querySelector(".workflow-discover-shared__match-grid > article.is-opening")).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1_800));
      expect(preview).toHaveAttribute("data-workflow-phase", "property-overview");
      expect(preview.querySelector(".agent-live-review__panel--property")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(4_000));
      expect(preview).toHaveAttribute("data-workflow-phase", "financial-comparison");
      expect(preview.querySelector(".agent-live-review__panel--financials")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(4_500));
      expect(preview).toHaveAttribute("data-workflow-phase", "match-rationale");
      expect(preview.querySelector(".agent-live-review__panel--match")).toHaveAttribute("aria-hidden", "false");
    } finally {
      cleanup();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("runs the Step 4 contact-and-conversation sequence only after the dashboard enters view", () => {
    vi.useFakeTimers();
    const VisibleIntersectionObserver = class {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, intersectionRatio: 0.55, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
    };
    vi.stubGlobal("IntersectionObserver", VisibleIntersectionObserver);

    try {
      render(
        <MemoryRouter initialEntries={["/meta/agents/replacement-property#how-it-works"]}>
          <MetaAgentReplacementProperty />
        </MemoryRouter>,
      );

      const preview = screen.getByLabelText("Animated listing-agent conversation workflow");
      expect(preview).toHaveAttribute("data-workflow-phase", "match-rationale");
      expect(preview.querySelector(".workflow-review-shared__scene--detail")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(4_200));
      expect(preview).toHaveAttribute("data-workflow-phase", "contact-tab");
      expect(preview.querySelector(".agent-live-review__panel--contact")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(1_800));
      expect(preview).toHaveAttribute("data-workflow-phase", "listing-agent");

      act(() => vi.advanceTimersByTime(3_000));
      expect(preview).toHaveAttribute("data-workflow-phase", "conversation-open");
      expect(preview.querySelector(".agent-live-review__panel--conversation")).toHaveAttribute("aria-hidden", "false");

      act(() => vi.advanceTimersByTime(1_800));
      expect(preview).toHaveAttribute("data-workflow-phase", "message-typing");
      expect(preview.querySelector(".agent-live-thread__composer")).toHaveTextContent(/my client is interested/i);

      act(() => vi.advanceTimersByTime(4_200));
      expect(preview).toHaveAttribute("data-workflow-phase", "message-sent");
      expect(preview).toHaveTextContent("Just now · Delivered");
      expect(preview).toHaveTextContent("Conversation started. The opportunity moved to In Conversation in the pipeline.");
    } finally {
      cleanup();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("tracks CTA location without losing campaign values", () => {
    render(
      <MemoryRouter initialEntries={[`/meta/agents/replacement-property${campaignSearch}`]}>
        <MetaAgentReplacementProperty />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("link", { name: AGENT_LANDING_CTA })[1]);

    expect(vi.mocked(trackEvent)).toHaveBeenCalledWith(
      "agent_landing_cta_clicked",
      expect.objectContaining({
        ctaLocation: "hero",
        creativeAngle: "private-search",
        attribution: expect.objectContaining({ fbclid: "fb-123" }),
      }),
    );

    fireEvent.click(screen.getByRole("link", {
      name: "Sign Up for Free — No Credit Card Required",
    }));

    expect(vi.mocked(trackEvent)).toHaveBeenCalledWith(
      "agent_landing_cta_clicked",
      expect.objectContaining({
        ctaLocation: "announcement",
        ctaLabel: AGENT_LANDING_CTA,
        creativeAngle: "private-search",
        attribution: expect.objectContaining({ fbclid: "fb-123" }),
      }),
    );
  });

  it("shows an authentic live exchange workflow instead of a generic AI chat", () => {
    render(
      <MemoryRouter initialEntries={["/meta/agents/replacement-property"]}>
        <MetaAgentReplacementProperty />
      </MemoryRouter>,
    );

    const liveWorkflow = screen.getByLabelText(
      "Illustrative live replacement-property matching workflow",
    );
    const liveWorkflowView = within(liveWorkflow);
    expect(liveWorkflow).toBeInTheDocument();
    expect(document.querySelectorAll(".agent-rollout-window")).toHaveLength(0);
    expect(document.querySelector(".agent-live-demo__camera")).toBeInTheDocument();
    expect(liveWorkflowView.queryByRole("button", { name: /find qualified replacements/i })).not.toBeInTheDocument();
    expect(liveWorkflowView.getAllByText("184 River Avenue")).not.toHaveLength(0);
    expect(liveWorkflowView.queryByText("Blackstone Mill Lofts")).not.toBeInTheDocument();
    expect(liveWorkflowView.queryByText("Merrimack Commerce Park")).not.toBeInTheDocument();
    expect(
      liveWorkflowView.getByText("Active client workspace"),
    ).toBeInTheDocument();
    expect(liveWorkflowView.getByText("Current property")).toBeInTheDocument();
    expect(liveWorkflowView.getByText("42 days remaining")).toBeInTheDocument();
    expect(liveWorkflowView.getByRole("img", { name: "214 Shrewsbury Street property" })).toHaveAttribute(
      "src",
      "/mf-4.jpg",
    );
    expect(liveWorkflowView.getByRole("tab", { name: "Property" })).toBeInTheDocument();
    expect(liveWorkflowView.getByRole("tab", { name: "Financials" })).toBeInTheDocument();
    expect(liveWorkflowView.getByRole("tab", { name: "Why it fits" })).toBeInTheDocument();
    expect(liveWorkflowView.getByRole("tab", { name: "Contact agent" })).toBeInTheDocument();
    expect(liveWorkflowView.getAllByText("Jordan Lee")).toHaveLength(2);
    expect(liveWorkflowView.getByText("Just now · Delivered")).toBeInTheDocument();
    expect(liveWorkflowView.getByText("Conversation started. The opportunity moved to In Conversation in the pipeline.")).toBeInTheDocument();
    expect(liveWorkflowView.queryByText("Give the client a clear next step")).not.toBeInTheDocument();
    expect(liveWorkflowView.queryByText(/ask exchangeup/i)).not.toBeInTheDocument();
  });

  it("opens the selected match comparison from either photographic listing card", () => {
    vi.useFakeTimers();
    const VisibleIntersectionObserver = class {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, intersectionRatio: 0.55, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
    };
    vi.stubGlobal("IntersectionObserver", VisibleIntersectionObserver);

    try {
      render(
        <MemoryRouter initialEntries={["/meta/agents/replacement-property"]}>
          <MetaAgentReplacementProperty />
        </MemoryRouter>,
      );

      act(() => vi.advanceTimersByTime(23_600));
      const liveWorkflow = screen.getByLabelText("Illustrative live replacement-property matching workflow");
      fireEvent.click(within(liveWorkflow).getByRole("button", { name: "Review 675 Harvey Road comparison" }));

      expect(screen.getByRole("heading", { name: "675 Harvey Road" })).toBeInTheDocument();
      expect(screen.getByRole("img", { name: "675 Harvey Road property" })).toHaveAttribute(
        "src",
        "/landing-prop-industrial.jpg",
      );
      expect(screen.getByText("+$210K / yr")).toBeInTheDocument();
      expect(screen.getAllByText("$3.20M · 72.7%")).not.toHaveLength(0);
    } finally {
      cleanup();
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it("finishes the demonstration by opening an agent conversation and sending a message", () => {
    render(
      <MemoryRouter initialEntries={["/meta/agents/replacement-property"]}>
        <MetaAgentReplacementProperty />
      </MemoryRouter>,
    );

    const liveWorkflow = within(screen.getByLabelText("Illustrative live replacement-property matching workflow"));
    fireEvent.click(liveWorkflow.getByRole("tab", { name: "Contact agent" }));
    fireEvent.click(liveWorkflow.getByRole("button", { name: /start agent conversation/i }));

    expect(liveWorkflow.getByText("Conversation with listing agent")).toBeInTheDocument();
    expect(liveWorkflow.getByText("Write a message…")).toBeInTheDocument();

    fireEvent.click(liveWorkflow.getByRole("button", { name: "Send message to Jordan Lee" }));

    expect(liveWorkflow.getByText("Just now · Delivered")).toBeInTheDocument();
    expect(liveWorkflow.getByText("Conversation started. The opportunity moved to In Conversation in the pipeline.")).toBeInTheDocument();
  });

  it("derives every displayed exchange figure from the matching model", () => {
    const bestMatch = ILLUSTRATIVE_MATCHES[0];

    expect(CURRENT_PROPERTY.raw.equity).toBe(1_200_000);
    expect(CURRENT_PROPERTY.raw.purchasingCapacity).toBe(4_800_000);
    expect(CURRENT_PROPERTY.raw.cashFlow).toBe(78_000);
    expect(CURRENT_PROPERTY.raw.roe).toBeCloseTo(0.065, 6);

    expect(bestMatch.raw.replacementLoan).toBe(2_800_000);
    expect(bestMatch.raw.ltv).toBeCloseTo(0.7, 6);
    expect(bestMatch.raw.debtService).toBeCloseTo(237_477.81, 2);
    expect(bestMatch.raw.cashFlow).toBeCloseTo(126_522.19, 2);
    expect(bestMatch.raw.roe).toBeCloseTo(0.105435, 5);
    expect(bestMatch.raw.roeImprovement).toBeCloseTo(4.0435, 3);
    expect(bestMatch.raw.cashBoot).toBe(0);
    expect(bestMatch.raw.mortgageBoot).toBe(0);
    expect(bestMatch.raw.score).toBe(90);
    expect(bestMatch.raw.ltv).toBeLessThanOrEqual(ILLUSTRATIVE_DEAL_ASSUMPTIONS.maximumLtv);
  });

  it("uses only the expected attribution values in telemetry", () => {
    expect(readAgentLandingAttribution(`${campaignSearch}&unrelated=value`)).toEqual(
      expect.objectContaining({
        utm_source: "facebook",
        utm_medium: "paid_social",
        creative_angle: "private-search",
      }),
    );
    expect(readAgentLandingAttribution("?unrelated=value")).toEqual({});
  });

  it("opens the existing signup flow directly on the agent form", () => {
    render(
      <MemoryRouter initialEntries={[`/signup${campaignSearch}&role=agent`]}>
        <Signup />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Create Agent Account" })).toBeInTheDocument();
    expect(screen.queryByText("How would you like to use the platform?")).not.toBeInTheDocument();
  });
});
