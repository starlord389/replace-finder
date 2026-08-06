const STRATEGY_TYPES = new Set([
  "core",
  "core_plus",
  "value_add",
  "opportunistic",
  "development",
  "nnn",
  "other",
]);

const TEXT_LIMITS: Record<string, number> = {
  property_name: 200,
  address: 250,
  unit_suite: 100,
  county: 100,
  asset_subtype: 150,
  property_class: 50,
  property_condition: 100,
  parking_type: 100,
  construction_type: 100,
  roof_type: 100,
  hvac_type: 100,
  zoning: 150,
  description: 4000,
  recent_renovations: 2000,
};

const WHOLE_NUMBER_FIELDS = [
  "units",
  "building_square_footage",
  "num_buildings",
  "num_stories",
  "parking_spaces",
] as const;

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function invalidNumber(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "" && numberOrNull(value) === null;
}

function cleanAmenities(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
}

export function validateOptionalPropertyDetails(input: unknown): string[] {
  if (input == null) return [];
  if (typeof input !== "object" || Array.isArray(input)) return ["property must be an object"];
  const property = input as Record<string, unknown>;
  const errors: string[] = [];

  const zip = cleanText(property.zip);
  if (zip && !/^\d{5}(?:-\d{4})?$/.test(zip)) {
    errors.push("zip must be a valid 5-digit or ZIP+4 code");
  }

  const strategy = cleanText(property.strategy_type);
  if (strategy && !STRATEGY_TYPES.has(strategy)) {
    errors.push("strategy_type is unsupported");
  }

  const yearBuilt = numberOrNull(property.year_built);
  const maximumYear = new Date().getUTCFullYear() + 2;
  if (
    invalidNumber(property.year_built) ||
    (yearBuilt != null && (!Number.isInteger(yearBuilt) || yearBuilt < 1700 || yearBuilt > maximumYear))
  ) {
    errors.push(`year_built must be a whole year from 1700 to ${maximumYear}`);
  }

  for (const field of WHOLE_NUMBER_FIELDS) {
    const value = numberOrNull(property[field]);
    if (invalidNumber(property[field]) || (value != null && (!Number.isInteger(value) || value < 0))) {
      errors.push(`${field} must be a whole number of 0 or greater`);
    }
  }

  const landArea = numberOrNull(property.land_area_acres);
  if (invalidNumber(property.land_area_acres) || (landArea != null && landArea < 0)) {
    errors.push("land_area_acres must be 0 or greater");
  }

  for (const [field, limit] of Object.entries(TEXT_LIMITS)) {
    const value = cleanText(property[field]);
    if (value && value.length > limit) errors.push(`${field} may not exceed ${limit} characters`);
  }

  const amenities = cleanAmenities(property.amenities);
  if (amenities.length > 50 || amenities.some((amenity) => amenity.length > 100)) {
    errors.push("amenities may contain up to 50 entries of 100 characters each");
  }

  return errors;
}

export function normalizeOptionalPropertyDetails(input: Record<string, unknown>) {
  const amenities = cleanAmenities(input.amenities);
  return {
    unit_suite: cleanText(input.unit_suite),
    zip: cleanText(input.zip),
    county: cleanText(input.county),
    asset_subtype: cleanText(input.asset_subtype),
    strategy_type: cleanText(input.strategy_type),
    property_class: cleanText(input.property_class),
    property_condition: cleanText(input.property_condition),
    year_built: numberOrNull(input.year_built),
    units: numberOrNull(input.units),
    building_square_footage: numberOrNull(input.building_square_footage),
    land_area_acres: numberOrNull(input.land_area_acres),
    num_buildings: numberOrNull(input.num_buildings),
    num_stories: numberOrNull(input.num_stories),
    parking_spaces: numberOrNull(input.parking_spaces),
    parking_type: cleanText(input.parking_type),
    construction_type: cleanText(input.construction_type),
    roof_type: cleanText(input.roof_type),
    hvac_type: cleanText(input.hvac_type),
    zoning: cleanText(input.zoning),
    amenities: amenities.length ? amenities : null,
    recent_renovations: cleanText(input.recent_renovations),
  };
}
