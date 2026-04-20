import { Enums } from "@/integrations/supabase/types";
import type { UploadedPropertyImage } from "@/components/exchange/PropertyPhotoUploader";

export type { UploadedPropertyImage };

export interface PropertyData {
  property_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  asset_type: Enums<"asset_type"> | "";
  year_built: string;
  units: string;
  building_square_footage: string;
  description: string;
}

export interface FinancialsData {
  asking_price: string;
  noi: string;
  occupancy_rate: string;
  cap_rate: string;
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
  address: "",
  city: "",
  state: "",
  zip: "",
  asset_type: "",
  year_built: "",
  units: "",
  building_square_footage: "",
  description: "",
};

export const initialFinancialsData: FinancialsData = {
  asking_price: "",
  noi: "",
  occupancy_rate: "",
  cap_rate: "",
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
