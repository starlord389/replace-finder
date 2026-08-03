import { describe, expect, it } from "vitest";
import {
  INVESTOR_LAUNCHPAD_GROUPS,
  INVESTOR_LAUNCHPAD_STEPS,
} from "@/content/investorLaunchpad";

describe("investor launchpad content", () => {
  it("mirrors the agent launchpad checklist structure without client steps", () => {
    expect(INVESTOR_LAUNCHPAD_STEPS.map((step) => step.id)).toEqual([
      "profile",
      "listing",
      "publish",
      "matching",
      "matches",
      "pipeline",
    ]);
    expect(INVESTOR_LAUNCHPAD_STEPS.some((step) => step.id.includes("client"))).toBe(false);
  });

  it("groups setup and daily workflow into three steps each", () => {
    expect(INVESTOR_LAUNCHPAD_GROUPS.map((group) => group.id)).toEqual([
      "setup",
      "workflow",
    ]);
    expect(INVESTOR_LAUNCHPAD_GROUPS[0].steps).toHaveLength(3);
    expect(INVESTOR_LAUNCHPAD_GROUPS[1].steps).toHaveLength(3);
  });
});
