import { Enums } from "@/integrations/supabase/types";
import type { UploadedPropertyImage } from "@/components/exchange/PropertyPhotoUploader";

export type { UploadedPropertyImage };

export interface PropertyData {
  property_name: string;
  // Street address + ZIP are intentionally NOT collected — owners don't want
  // their property address revealed. We only capture city + state.
  city: string;
  state: string;
  asset_type: Enums<"asset_type"> | "";
  year_built: string;
  units: string;
  building_square_footage: string;
  description: string;
}

export interface FinancialsData {
  asking_price: string;
  gross_rent_roll: string;
  total_operating_expenses: string;
  loan_balance: string;
}

export interface CriteriaData {
  target_asset_types: Enums<"asset_type">[];
  target_states: string[];
  target_price_min: string;
  target_price_max: string;
  target_metros: string[];
  target_year_built_min: string;
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
  city: "",
  state: "",
  asset_type: "",
  year_built: "",
  units: "",
  building_square_footage: "",
  description: "",
};

export const initialFinancialsData: FinancialsData = {
  asking_price: "",
  gross_rent_roll: "",
  total_operating_expenses: "",
  loan_balance: "",
};

export const initialCriteriaData: CriteriaData = {
  target_asset_types: [],
  target_states: [],
  target_price_min: "",
  target_price_max: "",
  target_metros: [],
  target_year_built_min: "",
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
  return isNaN(n) ? null : n;
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
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
 * Single source of truth for everything we derive from the four numbers an
 * agent now enters (asking price, gross rent roll, total operating expenses,
 * loan balance). Used by the form preview, the review step, and the API
 * wrappers so the client and server always agree.
 */
export function getDerivedFinancials(financials: FinancialsData) {
  const askingPrice = parseCurrency(financials.asking_price);
  const grossRentRoll = parseCurrency(financials.gross_rent_roll);
  const totalOperatingExpenses = parseCurrency(financials.total_operating_expenses);
  const loanBalance = parseCurrency(financials.loan_balance);
  const noi = calculateNoi(grossRentRoll, totalOperatingExpenses);
  const capRate = calculateCapRate(noi, askingPrice);
  return {
    askingPrice,
    grossRentRoll,
    totalOperatingExpenses,
    loanBalance,
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
