import { describe, expect, it } from "vitest";
import { AGENT_LAUNCHPAD_GROUPS, AGENT_LAUNCHPAD_STEPS } from "@/content/agentLaunchpad";

describe("agent launchpad content", () => {
  it("keeps the required checklist order", () => {
    expect(AGENT_LAUNCHPAD_STEPS.map((step) => step.id)).toEqual([
      "profile",
      "client",
      "exchange",
      "matching",
      "matches",
      "connection",
    ]);
  });

  it("uses grouped sections for setup and network actions", () => {
    expect(AGENT_LAUNCHPAD_GROUPS.map((group) => group.id)).toEqual(["setup", "network"]);
    expect(AGENT_LAUNCHPAD_GROUPS[0].steps).toEqual(["profile", "client", "exchange"]);
    expect(AGENT_LAUNCHPAD_GROUPS[1].steps).toEqual(["matching", "matches", "connection"]);
  });
});
