import { supabase } from "@/integrations/supabase/client";
import type { WizardState } from "@/lib/exchangeWizardTypes";
import { getDerivedFinancials, getEstimatedExchangeEconomics, parseCurrency } from "@/lib/exchangeWizardTypes";

export interface CreateExchangeRequest {
  data: WizardState;
  activate: boolean;
  clientName?: string;
  /** Stamp the new listing for the active workspace (demo sandbox vs live). */
  isDemo?: boolean;
}

export interface CreateExchangeResponse {
  exchange_id: string;
  property_id: string;
  criteria_id: string;
  matching_queued: boolean;
}

function normalizeWizardData(data: WizardState) {
  const { estimatedEquity, exchangeProceeds } = getEstimatedExchangeEconomics(
    data.financials,
  );
  // NOI, cap rate, and occupancy (assumed 100%) are derived from the four
  // numbers the agent enters. The edge function recomputes them as the source
  // of truth; we send them too so the client and server agree.
  const derived = getDerivedFinancials(data.financials);

  return {
    property: {
      ...data.property,
    },
    financials: {
      asking_price: derived.askingPrice,
      gross_rent_roll: derived.grossRentRoll,
      total_operating_expenses: derived.totalOperatingExpenses,
      annual_debt_service: derived.annualDebtService,
      loan_balance: derived.loanBalance,
      noi: derived.noi,
      cap_rate: derived.capRate,
      occupancy_rate: derived.occupancyRate,
      exchange_proceeds: exchangeProceeds,
      estimated_equity: estimatedEquity,
    },
    criteria: {
      ...data.criteria,
      target_price_min: parseCurrency(data.criteria.target_price_min),
      target_price_max: parseCurrency(data.criteria.target_price_max),
      target_year_built_min: data.criteria.target_year_built_min ? parseInt(data.criteria.target_year_built_min, 10) : null,
    },
    images: data.images.map((img, i) => ({
      storage_path: img.storage_path,
      file_name: img.file_name,
      sort_order: i,
    })),
  };
}

export async function createExchange(request: CreateExchangeRequest): Promise<CreateExchangeResponse> {
  const normalized = normalizeWizardData(request.data);
  const { data, error } = await supabase.functions.invoke<CreateExchangeResponse>("create-exchange", {
    body: {
      clientId: request.data.selectedClientId,
      activate: request.activate,
      clientName: request.clientName,
      isDemo: request.isDemo ?? false,
      ...normalized,
    },
  });

  if (error) throw error;
  if (!data) throw new Error("No response from create-exchange function");
  return data;
}
