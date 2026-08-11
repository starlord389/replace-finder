import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboard = readFileSync(
  resolve(process.cwd(), "src/pages/agent/AgentDashboard.tsx"),
  "utf8",
);
const attentionQuery = readFileSync(
  resolve(process.cwd(), "src/features/agent/hooks/useAgentAttentionQuery.ts"),
  "utf8",
);

describe("agent dashboard command center", () => {
  it("combines every new workflow into one action center", () => {
    expect(dashboard).toContain("Action center");
    expect(dashboard).toContain("useAgentContactRequests");
    expect(dashboard).toContain("useRepresentations");
    expect(dashboard).toContain("useRepresentationInvites");
    expect(dashboard).toContain("A client wants you to review a match");
    expect(dashboard).toContain("New representation request");
    expect(dashboard).toContain("A client invitation needs attention");
    expect(dashboard).not.toContain("What to do first");
    expect(dashboard).not.toContain("Needs your attention");
  });

  it("shows operational snapshots without mixing investor-owned demo exchanges into agent clients", () => {
    expect(dashboard).toContain("Pipeline snapshot");
    expect(dashboard).toContain("Client network");
    expect(dashboard).toContain("Best current opportunities");
    expect(dashboard).toContain("Client listings");
    expect(dashboard).toContain("Boolean(relationship.clientId)");
    expect(attentionQuery).toContain('.eq("owner_type", "agent")');
  });

  it("uses real listing photos or the shared no-photo disclosure", () => {
    expect(dashboard).toContain("PropertyPhotoPlaceholder");
    expect(dashboard).not.toContain("unsplash.com");
    expect(dashboard).not.toContain("Â");
    expect(dashboard).not.toContain("â†’");
  });
});
