import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("admin CRM operating UX", () => {
  it("makes the dashboard action-first and links into the core workspaces", () => {
    const dashboard = read("src/features/admin-crm/pages/CrmDashboard.tsx");
    expect(dashboard).toContain('title="Admin workspace"');
    expect(dashboard).toContain("The clearest next action across the platform");
    expect(dashboard).toContain('href="/admin/properties"');
    expect(dashboard).toContain('href="/admin/opportunities"');
    expect(dashboard).toContain('href="/admin/representation-requests"');
  });

  it("presents properties and matches as relationship-rich CRM records", () => {
    const deals = read("src/pages/admin/AdminDeals.tsx");
    expect(deals).toContain('label="Missing photos"');
    expect(deals).toContain('label="Ready to advance"');
    expect(deals).toContain("PropertyDirectoryCard");
    expect(deals).toContain("MatchOpportunityCard");
    expect(deals).toContain('label="ROE improvement"');
    expect(deals).toContain('aria-label="Filter by status"');
    expect(deals).toContain('from("property_financials")');
    expect(deals).toContain('from("property_images")');
  });
});
