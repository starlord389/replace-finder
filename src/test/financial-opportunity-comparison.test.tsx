import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialOpportunityComparison } from "@/features/matches/components/inbox/FinancialOpportunityComparison";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

describe("FinancialOpportunityComparison", () => {
  const buyerRelationship = {
    mySide: "buyer",
    buyerCurrentRoe: 0.04,
    candidateRoe: 0.09,
    currentNoi: 180_000,
    noi: 300_000,
    currentAnnualDebtService: 125_000,
    candidateAnnualDebtService: 190_000,
    currentCapRate: 5.8,
    capRate: 6.5,
  } as unknown as Relationship;

  it("visually compares current and replacement financial performance", () => {
    render(<FinancialOpportunityComparison rel={buyerRelationship} />);

    expect(screen.getByText("Financial opportunity comparison")).toBeInTheDocument();
    expect(screen.getByText("Return on equity")).toBeInTheDocument();
    expect(screen.getByText("Net operating income")).toBeInTheDocument();
    expect(screen.getByText("Annual cash flow after debt service")).toBeInTheDocument();
    expect(screen.getByText("Cap rate")).toBeInTheDocument();
    expect(screen.getByText("+5.0 pp")).toBeInTheDocument();
    expect(screen.getByText("+$120K/yr")).toBeInTheDocument();
    expect(screen.getByText("+$55K/yr")).toBeInTheDocument();
    expect(screen.getByText("+0.7 pp")).toBeInTheDocument();
    expect(screen.getAllByText("Current property")).toHaveLength(4);
    expect(screen.getAllByText("Replacement")).toHaveLength(4);
  });

  it("does not expose a buyer's private financial comparison to the seller", () => {
    const { container } = render(
      <FinancialOpportunityComparison rel={{ ...buyerRelationship, mySide: "seller" }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
