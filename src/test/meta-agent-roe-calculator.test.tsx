import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AgentRoeCalculatorSection } from "@/features/metaAgentLanding/AgentRoeCalculatorSection";
import { calculateRoe } from "@/features/metaAgentLanding/agentRoeCalculator";

describe("Meta agent ROE calculator", () => {
  it("uses the matching-engine ROE and 75% maximum-LTV formulas", () => {
    const result = calculateRoe({
      propertyValue: 2_400_000,
      loanBalance: 1_200_000,
      annualNoi: 180_000,
      annualDebtService: 102_000,
      additionalCash: 0,
    });

    expect(result.equity).toBe(1_200_000);
    expect(result.annualCashFlow).toBe(78_000);
    expect(result.currentRoe).toBeCloseTo(0.065, 8);
    expect(result.purchasingCapacity).toBe(4_800_000);
    expect(result.hasPositiveEquity).toBe(true);
  });

  it("adds optional exchange cash to purchasing capacity without changing current ROE", () => {
    const result = calculateRoe({
      propertyValue: 2_000_000,
      loanBalance: 1_000_000,
      annualNoi: 150_000,
      annualDebtService: 70_000,
      additionalCash: 1_000_000,
    });

    expect(result.currentRoe).toBeCloseTo(0.08, 8);
    expect(result.purchasingCapacity).toBe(8_000_000);
  });

  it("requires positive current equity and does not create capacity from additional cash alone", () => {
    const result = calculateRoe({
      propertyValue: 1_000_000,
      loanBalance: 1_100_000,
      annualNoi: 90_000,
      annualDebtService: 65_000,
      additionalCash: 500_000,
    });

    expect(result.hasPositiveEquity).toBe(false);
    expect(result.currentRoe).toBeNull();
    expect(result.purchasingCapacity).toBe(0);
  });

  it("updates the displayed results and preserves the supplied CTA destination", () => {
    const onCtaClick = vi.fn();
    render(
      <MemoryRouter>
        <AgentRoeCalculatorSection
          ctaDestination="/signup?role=agent&utm_source=meta"
          onCtaClick={onCtaClick}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("roe-result")).toHaveTextContent("6.5%");
    expect(screen.getByTestId("equity-result")).toHaveTextContent("$1,200,000");
    expect(screen.getByTestId("cash-flow-result")).toHaveTextContent("$78,000");
    expect(screen.getByTestId("capacity-result")).toHaveTextContent("$4,800,000");

    fireEvent.change(screen.getByLabelText(/additional exchange cash/i), {
      target: { value: "500000" },
    });
    expect(screen.getByTestId("capacity-result")).toHaveTextContent("$6,800,000");

    const cta = screen.getByRole("link", { name: "Find My Client’s Replacement Property" });
    expect(cta).toHaveAttribute("href", "/signup?role=agent&utm_source=meta");
    fireEvent.click(cta);
    expect(onCtaClick).toHaveBeenCalledWith("calculator");
  });

  it("shows an actionable message when the loan balance removes positive equity", () => {
    render(
      <MemoryRouter>
        <AgentRoeCalculatorSection
          ctaDestination="/signup?role=agent"
          onCtaClick={vi.fn()}
        />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/current loan balance/i), {
      target: { value: "2500000" },
    });

    expect(screen.getByRole("status")).toHaveTextContent("Positive equity is required");
    expect(screen.queryByTestId("roe-result")).not.toBeInTheDocument();
  });
});
