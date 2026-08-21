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

  it("keeps zero-activity signups visible with a plain-language journey stage", () => {
    const people = read("src/features/admin-crm/pages/CrmUsersIndex.tsx");
    expect(people).toContain("Every real signup appears here");
    expect(people).toContain("Journey stage");
    expect(people).toContain("getAdminOnboardingStage");
    expect(people).toContain("Includes zero-activity accounts");
  });

  it("presents properties and matches as relationship-rich CRM records", () => {
    const deals = read("src/pages/admin/AdminDeals.tsx");
    expect(deals).toContain('label="Missing photos"');
    expect(deals).toContain('label="Ready to advance"');
    expect(deals).toContain("PropertyDirectoryCard");
    expect(deals).toContain('className="divide-y divide-slate-100"');
    expect(deals).not.toContain('className="grid gap-px bg-slate-200 xl:grid-cols-2"');
    expect(deals).toContain("MatchOpportunityCard");
    expect(deals).toContain('label="ROE improvement"');
    expect(deals).toContain('aria-label="Filter by status"');
    expect(deals).toContain('from("property_financials")');
    expect(deals).toContain('from("property_images")');
  });
});
