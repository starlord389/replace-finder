const ASSET_TYPES = new Set([
  "multifamily",
  "office",
  "retail",
  "industrial",
  "medical_office",
  "self_storage",
  "hospitality",
  "mixed_use",
  "land",
  "net_lease",
  "other",
]);

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function cleanArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function invalidNumber(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "" && numberOrNull(value) === null;
}

export function validateReplacementCriteria(input: unknown): string[] {
  if (input == null) return [];
  if (typeof input !== "object" || Array.isArray(input)) return ["criteria must be an object"];
  const criteria = input as Record<string, unknown>;
  const errors: string[] = [];

  const nonNegativeFields = [
    "target_price_min",
    "target_price_max",
    "additional_cash_available",
    "min_projected_roe",
    "preferred_monthly_cash_flow",
  ];
  for (const field of nonNegativeFields) {
    const raw = criteria[field];
    const parsed = numberOrNull(raw);
    if (invalidNumber(raw) || (parsed != null && parsed < 0)) errors.push(`${field} must be a non-negative number`);
  }

  const minPrice = numberOrNull(criteria.target_price_min);
  const maxPrice = numberOrNull(criteria.target_price_max);
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    errors.push("target_price_max must be greater than or equal to target_price_min");
  }

  const maxLtv = numberOrNull(criteria.max_ltv);
  if (invalidNumber(criteria.max_ltv) || (maxLtv != null && (maxLtv <= 0 || maxLtv > 0.75))) {
    errors.push("max_ltv must be greater than 0 and no more than 0.75");
  }

  const minRoe = numberOrNull(criteria.min_projected_roe);
  if (minRoe != null && minRoe > 100) errors.push("min_projected_roe must be between 0 and 100");

  const assetTypes = cleanArray(criteria.target_asset_types);
  if (assetTypes.length > 20 || assetTypes.some((type) => !ASSET_TYPES.has(type))) {
    errors.push("target_asset_types contains an unsupported property type");
  }

  const states = cleanArray(criteria.target_states);
  if (states.length > 52 || states.some((state) => !/^[A-Z]{2}$/.test(state.toUpperCase()))) {
    errors.push("target_states must contain valid two-letter state codes");
  }

  const metros = cleanArray(criteria.target_metros);
  if (metros.length > 25 || metros.some((metro) => metro.length > 100)) {
    errors.push("target_metros may contain up to 25 entries of 100 characters each");
  }

  const notes = cleanText(criteria.additional_notes);
  if (notes && notes.length > 2000) errors.push("additional_notes may not exceed 2000 characters");

  return errors;
}

export function normalizeReplacementCriteria(input: Record<string, unknown>) {
  const targetAssetTypes = cleanArray(input.target_asset_types);
  const targetStates = cleanArray(input.target_states).map((state) => state.toUpperCase());
  const targetMetros = cleanArray(input.target_metros);

  return {
    target_asset_types: targetAssetTypes,
    target_states: targetStates,
    target_price_min: numberOrNull(input.target_price_min) ?? 0,
    target_price_max: numberOrNull(input.target_price_max) ?? 0,
    target_metros: targetMetros.length ? targetMetros : null,
    target_year_built_min: numberOrNull(input.target_year_built_min),
    additional_cash_available: numberOrNull(input.additional_cash_available),
    max_ltv: numberOrNull(input.max_ltv),
    min_projected_roe: numberOrNull(input.min_projected_roe),
    preferred_monthly_cash_flow: numberOrNull(input.preferred_monthly_cash_flow),
    require_location_match: input.require_location_match === true && Boolean(targetStates.length || targetMetros.length),
    require_asset_type_match: input.require_asset_type_match === true && targetAssetTypes.length > 0,
    additional_notes: cleanText(input.additional_notes),
  };
}
