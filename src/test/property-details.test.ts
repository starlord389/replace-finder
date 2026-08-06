import { describe, expect, it } from "vitest";
import {
  normalizeOptionalPropertyDetails,
  validateOptionalPropertyDetails,
} from "../../supabase/functions/_shared/property-details";

describe("optional property detail validation", () => {
  it("normalizes blank advanced details to neutral database values", () => {
    expect(validateOptionalPropertyDetails({})).toEqual([]);
    expect(normalizeOptionalPropertyDetails({})).toMatchObject({
      zip: null,
      strategy_type: null,
      year_built: null,
      units: null,
      building_square_footage: null,
      land_area_acres: null,
      amenities: null,
      recent_renovations: null,
    });
  });

  it("preserves valid structured details and de-duplicates amenities", () => {
    const input = {
      zip: "33602",
      strategy_type: "value_add",
      year_built: "2008",
      units: "48",
      building_square_footage: "72,000",
      land_area_acres: "4.5",
      amenities: ["Loading docks", "Loading docks", " Fitness center "],
    };
    expect(validateOptionalPropertyDetails(input)).toEqual([]);
    expect(normalizeOptionalPropertyDetails(input)).toMatchObject({
      zip: "33602",
      strategy_type: "value_add",
      year_built: 2008,
      units: 48,
      building_square_footage: 72_000,
      land_area_acres: 4.5,
      amenities: ["Loading docks", "Fitness center"],
    });
  });

  it("rejects invalid optional values without making blanks required", () => {
    expect(validateOptionalPropertyDetails({ zip: "", units: "" })).toEqual([]);
    expect(validateOptionalPropertyDetails({
      zip: "ABC",
      strategy_type: "flip_everything",
      year_built: 1200,
      units: 1.5,
      land_area_acres: -1,
    })).toHaveLength(5);
  });
});
