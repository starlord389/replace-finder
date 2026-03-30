import type { Enums } from "@/integrations/supabase/types";

export interface RequestFormData {
  // Step 1: Location
  property_name: string;
  relinquished_address: string;
  unit_suite: string;
  relinquished_city: string;
  relinquished_state: string;
  relinquished_zip: string;
  county: string;
  // Step 2: Classification
  relinquished_asset_type: Enums<"asset_type"> | "";
  asset_subtype: string;
  target_strategy: Enums<"strategy_type"> | "";
  property_class: string;
  // Step 3: Physical
  units: string;
  building_square_footage: string;
  year_built: string;
  land_area_acres: string;
  num_buildings: string;
  num_stories: string;
  parking_spaces: string;
  parking_type: string;
  zoning: string;
  construction_type: string;
  roof_type: string;
  hvac_type: string;
  property_condition: string;
  recent_renovations: string;
  amenities: string[];
  relinquished_description: string;
  // Step 4: Financials
  relinquished_estimated_value: string;
  current_noi: string;
  current_occupancy_rate: string;
  gross_scheduled_income: string;
  effective_gross_income: string;
  real_estate_taxes: string;
  insurance: string;
  utilities: string;
  management_fee: string;
  maintenance_repairs: string;
  capex_reserves: string;
  other_expenses: string;
  current_cap_rate: string;
  average_rent_per_unit: string;
  // Step 5: Debt & Equity
  exchange_proceeds: string;
  estimated_equity: string;
  estimated_debt: string;
  estimated_basis: string;
  current_loan_balance: string;
  current_interest_rate: string;
  loan_type: string;
  loan_maturity_date: string;
  annual_debt_service: string;
  has_prepayment_penalty: boolean;
  prepayment_penalty_details: string;
  // Step 6: Criteria
  target_asset_types: Enums<"asset_type">[];
  target_states: string[];
  target_price_min: string;
  target_price_max: string;
  target_metros: string;
  target_strategies: Enums<"strategy_type">[];
  target_cap_rate_min: string;
  target_cap_rate_max: string;
  target_occupancy_min: string;
  target_year_built_min: string;
  target_property_classes: string[];
  identification_deadline: string;
  close_deadline: string;
  open_to_dsts: boolean;
  open_to_tics: boolean;
  urgency: string;
  additional_notes: string;
  // Step 7: Photos — handled separately via uploads
  // Step 8: Review — no additional fields
}

export const INITIAL_FORM: RequestFormData = {
  property_name: "",
  relinquished_address: "",
  unit_suite: "",
  relinquished_city: "",
  relinquished_state: "",
  relinquished_zip: "",
  county: "",
  relinquished_asset_type: "",
  asset_subtype: "",
  target_strategy: "",
  property_class: "",
  units: "",
  building_square_footage: "",
  year_built: "",
  land_area_acres: "",
  num_buildings: "",
  num_stories: "",
  parking_spaces: "",
  parking_type: "",
  zoning: "",
  construction_type: "",
  roof_type: "",
  hvac_type: "",
  property_condition: "",
  recent_renovations: "",
  amenities: [],
  relinquished_description: "",
  relinquished_estimated_value: "",
  current_noi: "",
  current_occupancy_rate: "",
  gross_scheduled_income: "",
  effective_gross_income: "",
  real_estate_taxes: "",
  insurance: "",
  utilities: "",
  management_fee: "",
  maintenance_repairs: "",
  capex_reserves: "",
  other_expenses: "",
  current_cap_rate: "",
  average_rent_per_unit: "",
  exchange_proceeds: "",
  estimated_equity: "",
  estimated_debt: "",
  estimated_basis: "",
  current_loan_balance: "",
  current_interest_rate: "",
  loan_type: "",
  loan_maturity_date: "",
  annual_debt_service: "",
  has_prepayment_penalty: false,
  prepayment_penalty_details: "",
  target_asset_types: [],
  target_states: [],
  target_price_min: "",
  target_price_max: "",
  target_metros: "",
  target_strategies: [],
  target_cap_rate_min: "",
  target_cap_rate_max: "",
  target_occupancy_min: "",
  target_year_built_min: "",
  target_property_classes: [],
  identification_deadline: "",
  close_deadline: "",
  open_to_dsts: false,
  open_to_tics: false,
  urgency: "",
  additional_notes: "",
};
