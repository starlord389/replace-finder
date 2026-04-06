import { Enums } from "@/integrations/supabase/types";

export interface PropertyData {
  property_name: string;
  address: string;
  unit_suite: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  asset_type: Enums<"asset_type"> | "";
  asset_subtype: string;
  strategy_type: Enums<"strategy_type"> | "";
  property_class: string;
  year_built: string;
  units: string;
  building_square_footage: string;
  land_area_acres: string;
  num_buildings: string;
  num_stories: string;
  parking_spaces: string;
  parking_type: string;
  construction_type: string;
  roof_type: string;
  hvac_type: string;
  property_condition: string;
  zoning: string;
  amenities: string[];
  recent_renovations: string;
  description: string;
}

export interface FinancialsData {
  asking_price: string;
  noi: string;
  occupancy_rate: string;
  cap_rate: string;
  gross_scheduled_income: string;
  effective_gross_income: string;
  vacancy_rate: string;
  annual_revenue: string;
  annual_expenses: string;
  real_estate_taxes: string;
  insurance: string;
  utilities: string;
  management_fee: string;
  maintenance_repairs: string;
  capex_reserves: string;
  other_expenses: string;
  average_rent_per_unit: string;
  loan_balance: string;
  loan_rate: string;
  loan_type: string;
  loan_maturity_date: string;
  annual_debt_service: string;
  has_prepayment_penalty: boolean;
  prepayment_penalty_details: string;
  exchange_proceeds: string;
  estimated_equity: string;
  estimated_basis: string;
  estimated_gain: string;
  estimated_tax_liability: string;
  sale_close_date: string;
}

export interface CriteriaData {
  target_asset_types: Enums<"asset_type">[];
  target_states: string[];
  target_price_min: string;
  target_price_max: string;
  urgency: string;
  target_metros: string[];
  target_strategies: Enums<"strategy_type">[];
  target_property_classes: string[];
  target_cap_rate_min: string;
  target_cap_rate_max: string;
  target_occupancy_min: string;
  target_year_built_min: string;
  target_units_min: string;
  target_units_max: string;
  target_sf_min: string;
  target_sf_max: string;
  open_to_dsts: boolean;
  open_to_tics: boolean;
  must_replace_debt: boolean;
  min_debt_replacement: string;
  additional_notes: string;
}

export interface WizardState {
  selectedClientId: string;
  property: PropertyData;
  financials: FinancialsData;
  criteria: CriteriaData;
}

export const initialPropertyData: PropertyData = {
  property_name: "", address: "", unit_suite: "", city: "", state: "", zip: "", county: "",
  asset_type: "", asset_subtype: "", strategy_type: "", property_class: "",
  year_built: "", units: "", building_square_footage: "", land_area_acres: "",
  num_buildings: "", num_stories: "", parking_spaces: "", parking_type: "",
  construction_type: "", roof_type: "", hvac_type: "", property_condition: "",
  zoning: "", amenities: [], recent_renovations: "", description: "",
};

export const initialFinancialsData: FinancialsData = {
  asking_price: "", noi: "", occupancy_rate: "", cap_rate: "",
  gross_scheduled_income: "", effective_gross_income: "", vacancy_rate: "",
  annual_revenue: "", annual_expenses: "", real_estate_taxes: "", insurance: "",
  utilities: "", management_fee: "", maintenance_repairs: "", capex_reserves: "",
  other_expenses: "", average_rent_per_unit: "",
  loan_balance: "", loan_rate: "", loan_type: "", loan_maturity_date: "",
  annual_debt_service: "", has_prepayment_penalty: false, prepayment_penalty_details: "",
  exchange_proceeds: "", estimated_equity: "", estimated_basis: "",
  estimated_gain: "", estimated_tax_liability: "", sale_close_date: "",
};

export const initialCriteriaData: CriteriaData = {
  target_asset_types: [], target_states: [], target_price_min: "", target_price_max: "",
  urgency: "", target_metros: [], target_strategies: [], target_property_classes: [],
  target_cap_rate_min: "", target_cap_rate_max: "", target_occupancy_min: "",
  target_year_built_min: "", target_units_min: "", target_units_max: "",
  target_sf_min: "", target_sf_max: "", open_to_dsts: false, open_to_tics: false,
  must_replace_debt: true, min_debt_replacement: "", additional_notes: "",
};

export const initialWizardState: WizardState = {
  selectedClientId: "",
  property: initialPropertyData,
  financials: initialFinancialsData,
  criteria: initialCriteriaData,
};

export function parseCurrency(val: string): number | null {
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
