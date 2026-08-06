import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeOptionalPropertyDetails, validateOptionalPropertyDetails } from "./property-details.ts";

Deno.test("blank optional property details remain valid and neutral", () => {
  assertEquals(validateOptionalPropertyDetails({}), []);
  const normalized = normalizeOptionalPropertyDetails({});
  assertEquals(normalized.zip, null);
  assertEquals(normalized.year_built, null);
  assertEquals(normalized.units, null);
  assertEquals(normalized.amenities, null);
});

Deno.test("valid optional property details normalize to database values", () => {
  const input = {
    zip: "33602",
    strategy_type: "value_add",
    year_built: "2008",
    units: "48",
    building_square_footage: "72,000",
    land_area_acres: "4.5",
    amenities: ["Loading docks", "Loading docks", " Fitness center "],
  };
  assertEquals(validateOptionalPropertyDetails(input), []);
  const normalized = normalizeOptionalPropertyDetails(input);
  assertEquals(normalized.year_built, 2008);
  assertEquals(normalized.units, 48);
  assertEquals(normalized.building_square_footage, 72_000);
  assertEquals(normalized.land_area_acres, 4.5);
  assertEquals(normalized.amenities, ["Loading docks", "Fitness center"]);
});

Deno.test("invalid optional property details are rejected", () => {
  assertEquals(validateOptionalPropertyDetails({ zip: "", units: "" }), []);
  assertEquals(validateOptionalPropertyDetails({
    zip: "ABC",
    strategy_type: "flip_everything",
    year_built: 1200,
    units: 1.5,
    land_area_acres: -1,
  }).length, 5);
});
