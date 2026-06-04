// All matching knobs live here so they're tunable in one place.

// Top-level score weights (sum to 1.0).
export const MATCH_WEIGHTS = {
  roe: 0.7,
  fit: 0.3,
} as const;

// Within the fit component, how to weigh each dimension.
export const FIT_SUBWEIGHTS = {
  geo: 0.4,
  asset: 0.35,
  strategy: 0.25,
} as const;

// ROE improvement (in percentage points above the buyer's current ROE) that
// maps to a full 100 on the ROE component. Improvements above this clamp.
export const ROE_IMPROVEMENT_FULL_SCORE_PP = 5;

// Quality tiebreaker (occupancy + building age) adjusts the final score by at
// most this many points up or down.
export const QUALITY_TIEBREAKER_MAX_POINTS = 3;

// Hard affordability ceiling: candidate price cannot exceed buyer equity /
// (1 - MAX_COMMERCIAL_LTV) because no loan can bridge the rest.
export const MAX_COMMERCIAL_LTV = 0.75;

// Eligibility gate: candidate ROE must exceed buyer's current ROE by at least
// this many percentage points. Default is strictly > baseline.
export const ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP = 0;

// Fallbacks used only if the app_settings row is missing or unreadable.
export const FALLBACK_MORTGAGE_RATE = 7.0;
export const FALLBACK_AMORTIZATION_YEARS = 25;
