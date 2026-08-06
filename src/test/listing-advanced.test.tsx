import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StepPropertyAndFinancials from "@/components/exchange/StepPropertyAndFinancials";
import {
  FinancialsData,
  PropertyData,
  initialFinancialsData,
  initialPropertyData,
} from "@/lib/exchangeWizardTypes";

const completeProperty: PropertyData = {
  ...initialPropertyData,
  city: "Tampa",
  state: "FL",
  asset_type: "multifamily",
};

const completeFinancials: FinancialsData = {
  ...initialFinancialsData,
  asking_price: "2000000",
  gross_rent_roll: "25000",
  total_operating_expenses: "10000",
  loan_balance: "1000000",
};

function ListingHarness({ onNext = () => {} }: { onNext?: () => void }) {
  const [property, setProperty] = useState(completeProperty);
  const [financials, setFinancials] = useState(completeFinancials);
  return (
    <StepPropertyAndFinancials
      property={property}
      financials={financials}
      images={[]}
      onChangeProperty={setProperty}
      onChangeFinancials={setFinancials}
      onChangeImages={() => {}}
      onNext={onNext}
      onBack={() => {}}
    />
  );
}

describe("listing Basic and Advanced information", () => {
  it("shows required matching inputs while keeping optional details collapsed", () => {
    render(<ListingHarness />);

    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/asking price/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/property name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/monthly mortgage payment/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /advanced property information/i }));
    expect(screen.getByLabelText(/property name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year built/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly mortgage payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recent renovations/i)).toBeInTheDocument();
  });

  it("allows a listing to continue with every advanced field blank", () => {
    const onNext = vi.fn();
    render(<ListingHarness onNext={onNext} />);

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("validates an optional advanced field only after it is entered", () => {
    const onNext = vi.fn();
    render(<ListingHarness onNext={onNext} />);

    fireEvent.click(screen.getByRole("button", { name: /advanced property information/i }));
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: "not-a-zip" } });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/enter a valid 5-digit or zip\+4 code/i)).toBeInTheDocument();
  });
});
