import { supabase } from "@/integrations/supabase/client";
import type { WizardState } from "@/lib/exchangeWizardTypes";
import { getEstimatedExchangeEconomics, parseCurrency } from "@/lib/exchangeWizardTypes";

export interface CreateExchangeRequest {
  data: WizardState;
  activate: boolean;
  clientName?: string;
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

  return {
    property: {
      ...data.property,
      year_built: data.property.year_built ? parseInt(data.property.year_built, 10) : null,
      units: data.property.units ? parseInt(data.property.units, 10) : null,
      building_square_footage: data.property.building_square_footage ? parseFloat(data.property.building_square_footage) : null,
    },
    financials: {
      ...data.financials,
      asking_price: parseCurrency(data.financials.asking_price),
      noi: parseCurrency(data.financials.noi),
      occupancy_rate: parseCurrency(data.financials.occupancy_rate),
      cap_rate: parseCurrency(data.financials.cap_rate),
      loan_balance: parseCurrency(data.financials.loan_balance),
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
      ...normalized,
    },
  });

  if (error) throw error;
  if (!data) throw new Error("No response from create-exchange function");
  return data;
}
