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

// Default maximum LTV used when the client/agent has not set their own
// `max_ltv` on the exchange's replacement criteria. Purchasing capacity is
// NEVER derived from this alone — see estimatePurchasingCapacity().
export const MAX_COMMERCIAL_LTV = 0.75;

// Eligibility gate: candidate ROE must exceed buyer's current ROE by at least
// this many percentage points. Default is strictly > baseline.
export const ELIGIBILITY_MIN_ROE_IMPROVEMENT_PP = 0;

// ─── Exchange Up ───────────────────────────────────────────────────────────
// The platform's directional rule: a replacement property must be worth at
// least as much as the relinquished property. This is a HARD gate, never a
// scoring factor — a lower-value candidate can never surface as a match no
// matter how good its projected ROE is.
export const EXCHANGE_UP_ENFORCED = true;

// Tolerance (dollars) when comparing replacement value to the minimum. Absorbs
// rounding in stored financials so a $1,000,000 ↔ $1,000,000 pair is "equal
// value", not "below relinquished value".
export const EXCHANGE_UP_VALUE_TOLERANCE = 1;

// Exchange-up percentage that earns the full value-increase score component.
export const EXCHANGE_UP_FULL_SCORE_PCT = 50;

// Share of the final score attributable to the exchange-up magnitude. The rest
// is split by MATCH_WEIGHTS (roe / fit) on the remaining weight.
export const EXCHANGE_UP_WEIGHT = 0.15;

// Fallbacks used only if the app_settings row is missing or unreadable.
export const FALLBACK_MORTGAGE_RATE = 7.0;
export const FALLBACK_AMORTIZATION_YEARS = 25;

// Internal per-candidate classification codes. Only `eligible_exchange_up_match`
// reaches agents; the rest stay in admin diagnostics.
export const MATCH_CLASSIFICATION = {
  ELIGIBLE: "eligible_exchange_up_match",
  BELOW_VALUE: "below_relinquished_value",
  ABOVE_CAPACITY: "above_purchasing_capacity",
  LOW_ROE: "insufficient_roe_improvement",
  PREFERENCES: "property_preferences_mismatch",
  FINANCING_INCOMPLETE: "financing_information_incomplete",
  EXCHANGE_INCOMPLETE: "exchange_information_incomplete",
} as const;

export type MatchClassification =
  (typeof MATCH_CLASSIFICATION)[keyof typeof MATCH_CLASSIFICATION];

// Compliance copy shown anywhere we surface estimates.
export const EXCHANGE_DISCLAIMER =
  "1031 Exchange Up provides property-matching and financial estimates for informational purposes only. Exchange eligibility, taxable boot, debt-replacement requirements, and tax consequences should be reviewed with a qualified intermediary, tax adviser, attorney, and lender.";

