import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialsTab } from "@/features/matches/components/inbox/tabs/FinancialsTab";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

describe("matched-property financial disclosure", () => {
  it("shows operating results while explaining that seller financing stays private", () => {
    const relationship = {
      askingPrice: 4_000_000,
      capRate: 6.5,
      occupancy: 94,
      grossRentRoll: 520_000,
      totalOperatingExpenses: 260_000,
      noi: 260_000,
      estimatedReplacementLoan: 2_800_000,
      estimatedLtv: 0.7,
      candidateAnnualDebtService: 225_000,
      candidateRoe: 0.025,
    } as unknown as Relationship;

    render(<FinancialsTab rel={relationship} />);

    expect(screen.getAllByText("$520,000")).toHaveLength(2);
    expect(screen.getAllByText("$260,000")).toHaveLength(3);
    expect(screen.getByText(/operating performance is available before connection/i)).toBeInTheDocument();
    expect(screen.getByText(/seller's loan balance, equity, and exchange proceeds remain private/i)).toBeInTheDocument();
  });

  it("does not request seller debt columns in matched-property workspaces", () => {
    const unifiedSource = readFileSync(
      resolve(process.cwd(), "src/features/matches/hooks/useUnifiedRelationships.ts"),
      "utf8",
    );
    const connectionSource = readFileSync(
      resolve(process.cwd(), "src/pages/agent/AgentConnectionDetail.tsx"),
      "utf8",
    );

    expect(unifiedSource).not.toContain('from("property_financials").select("*")');
    expect(connectionSource).not.toContain('from("property_financials").select("*")');
    expect(unifiedSource).toContain("gross_rent_roll, total_operating_expenses, noi");
  });
});
