import { supabase } from "@/integrations/supabase/client";
import type { WizardState } from "@/lib/exchangeWizardTypes";
import { parseCurrency } from "@/lib/exchangeWizardTypes";

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
  return {
    property: {
      ...data.property,
      year_built: data.property.year_built ? parseInt(data.property.year_built, 10) : null,
      units: data.property.units ? parseInt(data.property.units, 10) : null,
      building_square_footage: data.property.building_square_footage ? parseFloat(data.property.building_square_footage) : null,
      land_area_acres: data.property.land_area_acres ? parseFloat(data.property.land_area_acres) : null,
      num_buildings: data.property.num_buildings ? parseInt(data.property.num_buildings, 10) : null,
      num_stories: data.property.num_stories ? parseInt(data.property.num_stories, 10) : null,
      parking_spaces: data.property.parking_spaces ? parseInt(data.property.parking_spaces, 10) : null,
    },
    financials: {
      ...data.financials,
      asking_price: parseCurrency(data.financials.asking_price),
      noi: parseCurrency(data.financials.noi),
      occupancy_rate: parseCurrency(data.financials.occupancy_rate),
      cap_rate: parseCurrency(data.financials.cap_rate),
      gross_scheduled_income: parseCurrency(data.financials.gross_scheduled_income),
      effective_gross_income: parseCurrency(data.financials.effective_gross_income),
      vacancy_rate: parseCurrency(data.financials.vacancy_rate),
      annual_revenue: parseCurrency(data.financials.annual_revenue),
      annual_expenses: parseCurrency(data.financials.annual_expenses),
      real_estate_taxes: parseCurrency(data.financials.real_estate_taxes),
      insurance: parseCurrency(data.financials.insurance),
      utilities: parseCurrency(data.financials.utilities),
      management_fee: parseCurrency(data.financials.management_fee),
      maintenance_repairs: parseCurrency(data.financials.maintenance_repairs),
      capex_reserves: parseCurrency(data.financials.capex_reserves),
      other_expenses: parseCurrency(data.financials.other_expenses),
      average_rent_per_unit: parseCurrency(data.financials.average_rent_per_unit),
      loan_balance: parseCurrency(data.financials.loan_balance),
      loan_rate: parseCurrency(data.financials.loan_rate),
      annual_debt_service: parseCurrency(data.financials.annual_debt_service),
      exchange_proceeds: parseCurrency(data.financials.exchange_proceeds),
      estimated_equity: parseCurrency(data.financials.estimated_equity),
      estimated_basis: parseCurrency(data.financials.estimated_basis),
      estimated_gain: parseCurrency(data.financials.estimated_gain),
      estimated_tax_liability: parseCurrency(data.financials.estimated_tax_liability),
    },
    criteria: {
      ...data.criteria,
      target_price_min: parseCurrency(data.criteria.target_price_min),
      target_price_max: parseCurrency(data.criteria.target_price_max),
      target_cap_rate_min: parseCurrency(data.criteria.target_cap_rate_min),
      target_cap_rate_max: parseCurrency(data.criteria.target_cap_rate_max),
      target_occupancy_min: parseCurrency(data.criteria.target_occupancy_min),
      target_year_built_min: data.criteria.target_year_built_min ? parseInt(data.criteria.target_year_built_min, 10) : null,
      target_units_min: data.criteria.target_units_min ? parseInt(data.criteria.target_units_min, 10) : null,
      target_units_max: data.criteria.target_units_max ? parseInt(data.criteria.target_units_max, 10) : null,
      target_sf_min: data.criteria.target_sf_min ? parseInt(data.criteria.target_sf_min, 10) : null,
      target_sf_max: data.criteria.target_sf_max ? parseInt(data.criteria.target_sf_max, 10) : null,
      min_debt_replacement: parseCurrency(data.criteria.min_debt_replacement),
    },
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
