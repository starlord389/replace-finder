import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StepCriteria from "@/components/exchange/StepCriteria";
import {
  CriteriaData,
  getCriteriaPurchasingCapacity,
  hasExchangeCriteria,
  initialCriteriaData,
  initialFinancialsData,
} from "@/lib/exchangeWizardTypes";

const financials = {
  ...initialFinancialsData,
  asking_price: "2000000",
  loan_balance: "1000000",
};

function CriteriaHarness({ onNext = () => {} }: { onNext?: () => void }) {
  const [criteria, setCriteria] = useState<CriteriaData>({ ...initialCriteriaData });
  return (
    <StepCriteria
      criteria={criteria}
      financials={financials}
      onChange={setCriteria}
      onNext={onNext}
      onBack={() => {}}
    />
  );
}

describe("optional exchange criteria", () => {
  it("keeps a completely blank criteria object inactive", () => {
    expect(hasExchangeCriteria({ ...initialCriteriaData })).toBe(false);
    expect(getCriteriaPurchasingCapacity(financials, initialCriteriaData)).toEqual({
      equity: 1_000_000,
      additionalCash: 0,
      maxLtvPercent: 75,
      capacity: 4_000_000,
    });
  });

  it("starts with default matching and keeps advanced fields collapsed", () => {
    render(<CriteriaHarness />);

    expect(screen.getByText(/default automatic matching is active/i)).toBeInTheDocument();
    expect(screen.getByText("$4,000,000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip preferences/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/minimum projected roe/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /advanced preferences/i }));
    expect(screen.getByLabelText(/minimum projected roe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
  });

  it("expands capacity when optional cash is entered and still allows continuation", () => {
    const onNext = vi.fn();
    render(<CriteriaHarness onNext={onNext} />);

    fireEvent.change(screen.getByLabelText(/additional cash available/i), { target: { value: "250000" } });
    expect(screen.getByText("$5,000,000")).toBeInTheDocument();
    expect(screen.getByText(/your optional details are ready/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
