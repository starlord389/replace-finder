import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MetaAgentReplacementProperty from "@/pages/meta/MetaAgentReplacementProperty";
import Signup from "@/pages/auth/Signup";
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
        name: "Find your client’s next property.",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: AGENT_LANDING_CTA })).toHaveLength(3);
    expect(screen.queryByText("For Investors")).not.toBeInTheDocument();
    expect(screen.queryByText("Talk to sales")).not.toBeInTheDocument();
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex, nofollow",
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
  });

  it("shows an authentic live exchange workflow instead of a generic AI chat", () => {
    render(
      <MemoryRouter initialEntries={["/meta/agents/replacement-property"]}>
        <MetaAgentReplacementProperty />
      </MemoryRouter>,
    );

    expect(
      screen.getByLabelText("Illustrative live replacement-property matching workflow"),
    ).toBeInTheDocument();
    expect(screen.getByText("ExchangeUp Matching Engine")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 qualified matches" })).toBeInTheDocument();
    expect(screen.getAllByText("Blackstone Mill Lofts")).not.toHaveLength(0);
    expect(screen.getAllByText("Merrimack Commerce Park")).not.toHaveLength(0);
    expect(screen.queryByText(/ask exchangeup/i)).not.toBeInTheDocument();
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
