import { Enums } from "@/integrations/supabase/types";
import type { UploadedPropertyImage } from "@/components/exchange/PropertyPhotoUploader";

export type { UploadedPropertyImage };

export interface PropertyData {
  property_name: string;
  // The property's street address. It is only revealed to other agents when
  // `address_is_public` is true; the listing agent + admins always see it.
  address: string;
  address_is_public: boolean;
  city: string;
  state: string;
  asset_type: Enums<"asset_type"> | "";
  description: string;
  // Compliance: the agent attests they have a listing/representation agreement
  // or written authorization from the owner to market this property.
  owner_authorization_confirmed: boolean;
}

// NOTE ON UNITS: the three recurring figures below — gross_rent_roll,
// total_operating_expenses, monthly_mortgage_payment — are entered by the agent
// as MONTHLY dollars (that's how owners think). The cap-rate / match math works
// in ANNUAL terms, so we annualize (×12) in getDerivedFinancials before storing
// and deriving NOI. Asking price and loan balance are point-in-time amounts.
export interface FinancialsData {
  asking_price: string;
  gross_rent_roll: string;            // monthly gross rent
  total_operating_expenses: string;   // monthly operating expenses (excl. mortgage)
  monthly_mortgage_payment: string;   // monthly mortgage payment (owner-specific)
  loan_balance: string;
}

export interface CriteriaData {
  target_asset_types: Enums<"asset_type">[];
  target_states: string[];
  target_price_min: string;
  target_price_max: string;
  target_metros: string[];
  target_year_built_min: string;
  additional_cash_available: string;
  max_ltv: string;
  min_projected_roe: string;
  preferred_monthly_cash_flow: string;
  require_location_match: boolean;
  require_asset_type_match: boolean;
  additional_notes: string;
}

export interface WizardState {
  selectedClientId: string;
  property: PropertyData;
  financials: FinancialsData;
  criteria: CriteriaData;
  images: UploadedPropertyImage[];
}

export const initialPropertyData: PropertyData = {
  property_name: "",
  address: "",
  address_is_public: false,
  city: "",
  state: "",
  asset_type: "",
  description: "",
  owner_authorization_confirmed: false,
};

export const initialFinancialsData: FinancialsData = {
  asking_price: "",
  gross_rent_roll: "",
  total_operating_expenses: "",
  monthly_mortgage_payment: "",
  loan_balance: "",
};

export const initialCriteriaData: CriteriaData = {
  target_asset_types: [],
  target_states: [],
  target_price_min: "",
  target_price_max: "",
  target_metros: [],
  target_year_built_min: "",
  additional_cash_available: "",
  max_ltv: "",
  min_projected_roe: "",
  preferred_monthly_cash_flow: "",
  require_location_match: false,
  require_asset_type_match: false,
  additional_notes: "",
};

export const initialWizardState: WizardState = {
  selectedClientId: "",
  property: initialPropertyData,
  financials: initialFinancialsData,
  criteria: initialCriteriaData,
  images: [],
};

export function parseCurrency(val: string): number | null {
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const MONTHS_PER_YEAR = 12;

export function monthlyToAnnual(monthly: number | null | undefined): number | null {
  return monthly == null ? null : monthly * MONTHS_PER_YEAR;
}

// Stored periodic financials are annual; the edit form shows them monthly.
// Trim to at most 2 decimals so legacy annual rows divide cleanly.
export function annualToMonthlyString(annual: number | null | undefined): string {
  if (annual == null) return "";
  return String(Math.round((annual / MONTHS_PER_YEAR) * 100) / 100);
}

// Adds thousands separators to a raw numeric string while it's being typed,
// preserving an in-progress decimal (e.g. "1250000." → "1,250,000.").
export function formatThousands(raw: string): string {
  if (!raw) return "";
  const negative = raw.startsWith("-");
  const digits = raw.replace(/[^0-9.]/g, "");
  const [intPart, ...decParts] = digits.split(".");
  const grouped = (intPart || "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const hasDot = digits.includes(".");
  const result = hasDot ? `${grouped}.${decParts.join("")}` : grouped;
  return negative ? `-${result}` : result;
}

// Strips formatting back to a raw numeric string (digits + at most one dot).
export function stripThousands(formatted: string): string {
  const cleaned = formatted.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  // keep only the first decimal point
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

// Occupancy is assumed fully leased (100%). We no longer ask for it, so the
// gross rent roll is treated as the effective gross income.
export const ASSUMED_OCCUPANCY_RATE = 100;

// NOI = gross rent roll − total operating expenses (occupancy assumed 100%).
export function calculateNoi(
  grossRentRoll: number | null | undefined,
  totalOperatingExpenses: number | null | undefined,
): number | null {
  if (grossRentRoll == null || totalOperatingExpenses == null) return null;
  return grossRentRoll - totalOperatingExpenses;
}

// Cap rate (%) = NOI / asking price.
export function calculateCapRate(
  noi: number | null | undefined,
  askingPrice: number | null | undefined,
): number | null {
  if (noi == null || askingPrice == null || askingPrice <= 0) return null;
  return (noi / askingPrice) * 100;
}

/**
 * Single source of truth for everything we derive from the numbers an agent
 * enters. The agent types MONTHLY gross rent, MONTHLY operating expenses, and a
 * MONTHLY mortgage payment; we annualize them (×12) here so NOI / cap rate and
 * the stored columns are always annual. Used by the form preview, the review
 * step, and the API wrappers so the client and server always agree.
 */
export function getDerivedFinancials(financials: FinancialsData) {
  const askingPrice = parseCurrency(financials.asking_price);
  const loanBalance = parseCurrency(financials.loan_balance);

  const monthlyGrossRent = parseCurrency(financials.gross_rent_roll);
  const monthlyOperatingExpenses = parseCurrency(financials.total_operating_expenses);
  const monthlyMortgagePayment = parseCurrency(financials.monthly_mortgage_payment);

  const grossRentRoll = monthlyToAnnual(monthlyGrossRent);             // annual
  const totalOperatingExpenses = monthlyToAnnual(monthlyOperatingExpenses); // annual
  const annualDebtService = monthlyToAnnual(monthlyMortgagePayment);   // annual

  const noi = calculateNoi(grossRentRoll, totalOperatingExpenses);
  const capRate = calculateCapRate(noi, askingPrice);
  return {
    askingPrice,
    loanBalance,
    monthlyGrossRent,
    monthlyOperatingExpenses,
    monthlyMortgagePayment,
    grossRentRoll,
    totalOperatingExpenses,
    annualDebtService,
    noi,
    capRate,
    occupancyRate: ASSUMED_OCCUPANCY_RATE,
  };
}

export const DEFAULT_SELLER_COST_ESTIMATE_RATE = 0.05;

export function calculateEstimatedEquity(
  askingPrice: number | null | undefined,
  loanBalance: number | null | undefined,
): number | null {
  if (askingPrice == null || loanBalance == null) return null;
  return askingPrice - loanBalance;
}

export function calculateEstimatedExchangeProceeds(
  askingPrice: number | null | undefined,
  loanBalance: number | null | undefined,
  sellerCostRate = DEFAULT_SELLER_COST_ESTIMATE_RATE,
): number | null {
  const estimatedEquity = calculateEstimatedEquity(askingPrice, loanBalance);
  if (askingPrice == null || estimatedEquity == null) return null;

  const sellerCosts = askingPrice * sellerCostRate;
  return Math.max(estimatedEquity - sellerCosts, 0);
}

export function getEstimatedExchangeEconomics(
  financials: Pick<FinancialsData, "asking_price" | "loan_balance">,
) {
  const askingPrice = parseCurrency(financials.asking_price);
  const loanBalance = parseCurrency(financials.loan_balance);
  const estimatedEquity = calculateEstimatedEquity(askingPrice, loanBalance);
  const exchangeProceeds = calculateEstimatedExchangeProceeds(
    askingPrice,
    loanBalance,
  );

  return {
    askingPrice,
    loanBalance,
    estimatedEquity,
    exchangeProceeds,
  };
}

export const DEFAULT_MAX_REPLACEMENT_LTV_PERCENT = 75;

/** Blank criteria are intentionally a no-op so the original automatic matching
 * algorithm remains the default. */
export function hasExchangeCriteria(criteria: CriteriaData): boolean {
  return Boolean(
    criteria.target_asset_types.length ||
    criteria.target_states.length ||
    criteria.target_metros.length ||
    criteria.target_price_min.trim() ||
    criteria.target_price_max.trim() ||
    criteria.additional_cash_available.trim() ||
    criteria.max_ltv.trim() ||
    criteria.min_projected_roe.trim() ||
    criteria.preferred_monthly_cash_flow.trim() ||
    criteria.additional_notes.trim(),
  );
}

export function getCriteriaPurchasingCapacity(
  financials: Pick<FinancialsData, "asking_price" | "loan_balance">,
  criteria: Pick<CriteriaData, "additional_cash_available" | "max_ltv">,
): { equity: number | null; additionalCash: number; maxLtvPercent: number; capacity: number | null } {
  const { estimatedEquity } = getEstimatedExchangeEconomics(financials);
  const additionalCash = Math.max(0, parseCurrency(criteria.additional_cash_available) ?? 0);
  const parsedMaxLtv = criteria.max_ltv.trim() === "" ? null : Number(criteria.max_ltv);
  const maxLtvPercent = parsedMaxLtv != null && Number.isFinite(parsedMaxLtv)
    ? Math.min(DEFAULT_MAX_REPLACEMENT_LTV_PERCENT, Math.max(0, parsedMaxLtv))
    : DEFAULT_MAX_REPLACEMENT_LTV_PERCENT;
  const availableEquity = estimatedEquity != null ? estimatedEquity + additionalCash : null;
  const capacity = availableEquity != null && availableEquity > 0
    ? availableEquity / (1 - maxLtvPercent / 100)
    : null;

  return { equity: estimatedEquity, additionalCash, maxLtvPercent, capacity };
}
