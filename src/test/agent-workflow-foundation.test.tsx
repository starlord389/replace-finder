import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AgentWorkflowFrame,
  AgentWorkflowNavigation,
} from "@/features/metaAgentLanding/AgentWorkflowFoundation";
import { useAgentWorkflowPlayback } from "@/features/metaAgentLanding/useAgentWorkflowPlayback";
import {
  AGENT_WORKFLOW_SEGMENTS,
  AGENT_WORKFLOW_STORY,
  type AgentWorkflowSegmentId,
} from "@/features/metaAgentLanding/agentWorkflowStory";
import {
  CURRENT_PROPERTY,
  ILLUSTRATIVE_CLIENT,
  ILLUSTRATIVE_LISTING_AGENT,
  ILLUSTRATIVE_MATCHES,
} from "@/features/metaAgentLanding/agentWorkflowData";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function PlaybackHarness({ segment }: { segment: AgentWorkflowSegmentId }) {
  const playback = useAgentWorkflowPlayback(segment);
  return <div ref={playback.stageRef} data-testid="playback" data-phase={playback.phase.id}>{playback.phase.label}</div>;
}

describe("canonical agent workflow foundation", () => {
  it("defines one continuous story with shared boundaries and no notification phase", () => {
    expect(AGENT_WORKFLOW_STORY.map((phase) => phase.id)).toEqual([
      "property-details",
      "financial-details",
      "replacement-criteria",
      "listing-review",
      "listing-published",
      "calculating-position",
      "evaluating-network",
      "matches",
      "opening-match",
      "property-overview",
      "financial-comparison",
      "match-rationale",
      "contact-tab",
      "listing-agent",
      "conversation-open",
      "message-typing",
      "message-sent",
    ]);
    expect(AGENT_WORKFLOW_STORY.some((phase) => phase.id.includes("notification"))).toBe(false);
    expect(AGENT_WORKFLOW_SEGMENTS.build[AGENT_WORKFLOW_SEGMENTS.build.length - 1].id).toBe(AGENT_WORKFLOW_SEGMENTS.discover[0].id);
    expect(AGENT_WORKFLOW_SEGMENTS.discover[AGENT_WORKFLOW_SEGMENTS.discover.length - 1].id).toBe(AGENT_WORKFLOW_SEGMENTS.review[0].id);
    expect(AGENT_WORKFLOW_SEGMENTS.review[AGENT_WORKFLOW_SEGMENTS.review.length - 1].id).toBe(AGENT_WORKFLOW_SEGMENTS.advance[0].id);
    expect(AGENT_WORKFLOW_SEGMENTS.full).toHaveLength(17);
  });

  it("keeps every animation on the same client, property, agent, and financial model", () => {
    expect(ILLUSTRATIVE_CLIENT.name).toBe("Elaine Thomas");
    expect(CURRENT_PROPERTY.address).toBe("214 Shrewsbury Street");
    expect(CURRENT_PROPERTY.raw.purchasingCapacity).toBe(4_800_000);
    expect(ILLUSTRATIVE_MATCHES[0].address).toBe("184 River Avenue");
    expect(ILLUSTRATIVE_MATCHES[0].raw.score).toBe(90);
    expect(ILLUSTRATIVE_LISTING_AGENT.name).toBe("Jordan Lee");
  });

  it("plays a selected segment from its shared first phase when it enters view", () => {
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

    render(<PlaybackHarness segment="discover" />);
    const playback = screen.getByTestId("playback");
    expect(playback).toHaveAttribute("data-phase", "listing-published");

    act(() => vi.advanceTimersByTime(2_200));
    expect(playback).toHaveAttribute("data-phase", "calculating-position");

    act(() => vi.advanceTimersByTime(3_600));
    expect(playback).toHaveAttribute("data-phase", "evaluating-network");

    act(() => vi.advanceTimersByTime(3_600));
    expect(playback).toHaveAttribute("data-phase", "matches");
  });

  it("provides one reusable dashboard frame and navigation system", () => {
    function FrameHarness() {
      const playback = useAgentWorkflowPlayback("review", { loop: false });
      return (
        <div data-meta-agent-landing>
          <AgentWorkflowFrame
            stageRef={playback.stageRef}
            phaseId={playback.phase.id}
            cycle={playback.cycle}
            ariaLabel="Shared workflow frame"
            workspace="Elaine Thomas · Matches"
            privacy="Private agent workspace"
            eyebrow="Review the matches"
            heading="Review one continuous workflow"
            status={playback.phase.label}
            disclosure="Illustrative workflow"
          >
            <AgentWorkflowNavigation active="Matches" matchesCount={2} />
          </AgentWorkflowFrame>
        </div>
      );
    }

    render(<FrameHarness />);
    expect(screen.getByLabelText("Shared workflow frame")).toHaveAttribute("data-workflow-phase", "match-rationale");
    expect(screen.getByRole("navigation", { name: "Illustrative agent workspace" })).toHaveTextContent("DashboardClientsPipelineListingsMatches2Client Requests");
  });
});
