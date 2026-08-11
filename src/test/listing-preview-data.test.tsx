import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FinancialsTab } from "@/features/matches/components/inbox/tabs/FinancialsTab";
import { OverviewTab } from "@/features/matches/components/inbox/tabs/OverviewTab";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";
import {
  buildListingPreviewRelationship,
  type ListingPreviewDetails,
} from "@/features/workspace/lib/listingPreview";

describe("listing preview database hydration", () => {
  it("maps complete property and financial records into the investor preview", () => {
    const listing = {
      id: "exchange-anita",
      status: "active",
      createdAt: "2026-08-01T12:00:00.000Z",
      clientId: "client-anita",
      clientName: "Anita Patel",
      propertyId: "property-beverly",
      propertyName: "210 Rantoul St",
      address: "210 Rantoul St",
      city: "Beverly",
      state: "MA",
      zip: "01915",
      assetType: "retail",
      strategyType: "core",
      askingPrice: 1_100_000,
      pipelineStageOverride: null,
      coverUrl: null,
    } satisfies AgentListing;

    const details: ListingPreviewDetails = {
      property: {
        id: "property-beverly",
        property_name: null,
        address: "210 Rantoul St",
        address_is_public: true,
        city: "Beverly",
        state: "MA",
        zip: "01915",
        asset_type: "retail",
        asset_subtype: "Neighborhood strip",
        strategy_type: "core",
        property_class: "B",
        property_condition: "Good",
        year_built: 1988,
        units: 4,
        building_square_footage: 6_200,
        land_area_acres: 0.38,
        num_buildings: 1,
        num_stories: 1,
        parking_spaces: 18,
        parking_type: "Surface lot",
        construction_type: "Masonry block",
        roof_type: "EPDM",
        hvac_type: "Rooftop package units",
        zoning: "CC",
        amenities: ["Pylon signage", "Corner visibility", "Rear loading"],
        description: "Four-tenant retail strip with established local service tenants.",
        recent_renovations: "New roof 2022, lot repaved 2023, exterior painted 2024.",
      },
      financials: {
        asking_price: 1_100_000,
        cap_rate: 6,
        occupancy_rate: 100,
        gross_rent_roll: 96_000,
        total_operating_expenses: 30_000,
        noi: 66_000,
      },
      imageUrls: ["https://example.com/beverly-retail.jpg"],
    };

    const relationship = buildListingPreviewRelationship(listing, details, "/agent");

    expect(relationship).toMatchObject({
      propertyName: "210 Rantoul St",
      propertyZip: "01915",
      propertyAssetSubtype: "Neighborhood strip",
      propertyBuildingSquareFeet: 6_200,
      propertyAmenities: ["Pylon signage", "Corner visibility", "Rear loading"],
      propertyImageUrls: ["https://example.com/beverly-retail.jpg"],
      askingPrice: 1_100_000,
      capRate: 6,
      occupancy: 100,
      grossRentRoll: 96_000,
      totalOperatingExpenses: 30_000,
      noi: 66_000,
    });

    render(
      <>
        <OverviewTab rel={relationship} />
        <FinancialsTab rel={relationship} />
      </>,
    );

    expect(screen.getByText("Neighborhood strip")).toBeInTheDocument();
    expect(screen.getByText("Pylon signage")).toBeInTheDocument();
    expect(screen.getByText(/Four-tenant retail strip/)).toBeInTheDocument();
    expect(screen.getByText(/New roof 2022/)).toBeInTheDocument();
    expect(screen.getAllByText("$96,000")).toHaveLength(2);
    expect(screen.getAllByText("$66,000")).toHaveLength(2);
    expect(screen.getAllByText("6.00%")).toHaveLength(2);
    expect(screen.getByText("100%")).toBeInTheDocument();

    const privateAddressPreview = buildListingPreviewRelationship(
      listing,
      {
        ...details,
        property: { ...details.property!, address_is_public: false },
      },
      "/agent",
    );
    expect(privateAddressPreview.propertyName).toBe("Beverly, MA 01915");
    expect(privateAddressPreview.propertyAddress).toBeNull();
  });
});
