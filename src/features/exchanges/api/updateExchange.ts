import { supabase } from "@/integrations/supabase/client";
import type { WizardState } from "@/lib/exchangeWizardTypes";
import { getEstimatedExchangeEconomics, parseCurrency } from "@/lib/exchangeWizardTypes";

export type UpdateIntent = "save_draft" | "publish" | "save_active" | "move_to_draft" | "delete_draft";

export interface UpdateExchangeRequest {
  exchangeId: string;
  intent: UpdateIntent;
  data?: WizardState; // omitted for status-only intents
}

export interface UpdateExchangeResponse {
  exchange_id?: string;
  updated?: boolean;
  deleted?: boolean;
  status?: string;
}

function normalize(data: WizardState) {
  const { estimatedEquity, exchangeProceeds } = getEstimatedExchangeEconomics(data.financials);
  return {
    property: {
      ...data.property,
      year_built: data.property.year_built ? parseInt(data.property.year_built, 10) : null,
      units: data.property.units ? parseInt(data.property.units, 10) : null,
      building_square_footage: data.property.building_square_footage
        ? parseFloat(data.property.building_square_footage) : null,
    },
    financials: {
      asking_price: parseCurrency(data.financials.asking_price),
      noi: parseCurrency(data.financials.noi),
      occupancy_rate: parseCurrency(data.financials.occupancy_rate),
      cap_rate: parseCurrency(data.financials.cap_rate),
      loan_balance: parseCurrency(data.financials.loan_balance),
      exchange_proceeds: exchangeProceeds,
      estimated_equity: estimatedEquity,
    },
    criteria: {
      target_asset_types: data.criteria.target_asset_types,
      target_states: data.criteria.target_states,
      target_price_min: parseCurrency(data.criteria.target_price_min),
      target_price_max: parseCurrency(data.criteria.target_price_max),
      target_metros: data.criteria.target_metros,
      target_year_built_min: data.criteria.target_year_built_min
        ? parseInt(data.criteria.target_year_built_min, 10) : null,
    },
    images: data.images.map((img, i) => ({
      storage_path: img.storage_path,
      file_name: img.file_name,
      sort_order: i,
    })),
  };
}

export async function updateExchange(req: UpdateExchangeRequest): Promise<UpdateExchangeResponse> {
  const body: Record<string, unknown> = { exchangeId: req.exchangeId, intent: req.intent };
  if (req.data) Object.assign(body, normalize(req.data));

  const { data, error } = await supabase.functions.invoke<UpdateExchangeResponse>("update-exchange", { body });
  if (error) throw error;
  if (!data) throw new Error("No response from update-exchange function");
  return data;
}
