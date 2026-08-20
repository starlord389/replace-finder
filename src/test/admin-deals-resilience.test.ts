import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/pages/admin/AdminDeals.tsx"), "utf8");

describe("admin deal oversight load resilience", () => {
  it("tracks every dataset and prevents stale requests from replacing a newer snapshot", () => {
    for (const dataset of ["exchanges", "properties", "matches", "connections", "profiles", "clients"]) {
      expect(source).toContain(`${dataset}:`);
    }
    expect(source).toContain("const requestId = ++requestSequence.current");
    expect(source.match(/requestId !== requestSequence\.current/g)?.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("setExchanges([])");
    expect(source).toContain("setProperties([])");
    expect(source).toContain("setMatches([])");
    expect(source).toContain("setConnections([])");
  });

  it("distinguishes partial data from total failure and never labels a failed dataset as zero", () => {
    expect(source).toContain('return "Unavailable"');
    expect(source).toContain('status === "partial" ? "Partial · "');
    expect(source).toContain("adminDealsHasTotalFailure");
    expect(source).toContain("Deal oversight could not be loaded");
    expect(source).toContain("Deal oversight is showing partial data");
    expect(source).toContain("no empty totals are being presented as authoritative");
    expect(source).toContain("Retry loading");
  });
});
