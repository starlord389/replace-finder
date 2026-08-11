import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReviewMatchPreview from "@/components/exchange/ReviewMatchPreview";
import {
  initialFinancialsData,
  initialPropertyData,
  type UploadedPropertyImage,
} from "@/lib/exchangeWizardTypes";

const property = {
  ...initialPropertyData,
  city: "Tampa",
  state: "FL",
  asset_type: "multifamily" as const,
};

const financials = {
  ...initialFinancialsData,
  asking_price: "2000000",
  gross_rent_roll: "25000",
  total_operating_expenses: "10000",
  loan_balance: "1000000",
};

describe("property photo disclosure", () => {
  it("shows an explicit no-photo state instead of fabricated imagery", () => {
    const { container } = render(
      <ReviewMatchPreview property={property} financials={financials} images={[]} />,
    );

    expect(screen.getAllByRole("img", { name: "No property photos provided" })).toHaveLength(2);
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("uses the real uploaded photo when one is supplied", () => {
    const images: UploadedPropertyImage[] = [{
      storage_path: "user/property.jpg",
      file_name: "property.jpg",
      sort_order: 0,
      url: "https://example.com/property.jpg",
    }];
    const { container } = render(
      <ReviewMatchPreview property={property} financials={financials} images={images} />,
    );

    expect(screen.queryByRole("img", { name: "No property photos provided" })).not.toBeInTheDocument();
    expect(container.querySelectorAll('img[src="https://example.com/property.jpg"]')).toHaveLength(2);
  });
});
