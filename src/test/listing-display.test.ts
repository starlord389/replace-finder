import { describe, expect, it } from "vitest";
import {
  getListingLocationLabel,
  getPrivateListingLabel,
  resolveListingName,
} from "@/lib/listingDisplay";

const listing = {
  property_name: "Retired property label",
  address: "145 Russell St",
  address_is_public: false,
  city: "Worcester",
  state: "MA",
  zip: "01609",
  asset_type: "multifamily",
};

describe("listing display names", () => {
  it("uses city, state, and ZIP instead of a retired property label", () => {
    expect(getListingLocationLabel(listing)).toBe("Worcester, MA 01609");
    expect(getPrivateListingLabel(listing)).toBe("Worcester, MA 01609");
    expect(resolveListingName(listing, false)).toBe("Worcester, MA 01609");
  });

  it("shows the street address when it is public", () => {
    expect(resolveListingName({ ...listing, address_is_public: true }, false)).toBe("145 Russell St");
  });

  it("still lets the listing owner or an admin see the stored address", () => {
    expect(resolveListingName(listing, true)).toBe("145 Russell St");
  });
});
