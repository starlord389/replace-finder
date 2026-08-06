import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { normalizeReplacementCriteria, validateReplacementCriteria } from "./replacement-criteria.ts";

Deno.test("blank replacement criteria normalize to neutral defaults", () => {
  assertEquals(validateReplacementCriteria({}), []);
  assertEquals(normalizeReplacementCriteria({}), {
    target_asset_types: [],
    target_states: [],
    target_price_min: 0,
    target_price_max: 0,
    target_metros: null,
    target_year_built_min: null,
    additional_cash_available: null,
    max_ltv: null,
    min_projected_roe: null,
    preferred_monthly_cash_flow: null,
    require_location_match: false,
    require_asset_type_match: false,
    additional_notes: null,
  });
});

Deno.test("criteria normalization preserves valid optional preferences", () => {
  const input = {
    target_asset_types: ["multifamily", "multifamily"],
    target_states: ["fl", "TX"],
    target_metros: [" Tampa "],
    additional_cash_available: 250_000,
    max_ltv: 0.65,
    min_projected_roe: 8,
    preferred_monthly_cash_flow: 5_000,
    require_location_match: true,
    require_asset_type_match: true,
    additional_notes: "  Prefer newer roofs.  ",
  };
  assertEquals(validateReplacementCriteria(input), []);
  const normalized = normalizeReplacementCriteria(input);
  assertEquals(normalized.target_asset_types, ["multifamily"]);
  assertEquals(normalized.target_states, ["FL", "TX"]);
  assertEquals(normalized.target_metros, ["Tampa"]);
  assertEquals(normalized.max_ltv, 0.65);
  assertEquals(normalized.additional_notes, "Prefer newer roofs.");
  assertEquals(normalized.require_location_match, true);
});

Deno.test("criteria validation rejects unsafe numeric ranges and unsupported types", () => {
  const errors = validateReplacementCriteria({
    additional_cash_available: -1,
    max_ltv: 0.9,
    min_projected_roe: 101,
    target_asset_types: ["spaceship"],
  });
  assertEquals(errors.length, 4);
});
