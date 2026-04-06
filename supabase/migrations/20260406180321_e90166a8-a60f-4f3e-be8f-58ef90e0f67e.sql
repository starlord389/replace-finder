
CREATE TABLE public.property_financials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL UNIQUE REFERENCES public.pledged_properties(id) ON DELETE CASCADE,
  asking_price numeric,
  appraised_value numeric,
  gross_scheduled_income numeric,
  vacancy_rate numeric,
  effective_gross_income numeric,
  other_income numeric,
  noi numeric,
  annual_revenue numeric,
  annual_expenses numeric,
  real_estate_taxes numeric,
  insurance numeric,
  utilities numeric,
  management_fee numeric,
  maintenance_repairs numeric,
  capex_reserves numeric,
  other_expenses numeric,
  cap_rate numeric,
  cash_on_cash numeric,
  occupancy_rate numeric,
  average_rent_per_unit numeric,
  loan_balance numeric,
  loan_rate numeric,
  loan_type text,
  loan_maturity_date date,
  annual_debt_service numeric,
  has_prepayment_penalty boolean DEFAULT false,
  prepayment_penalty_details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_financials ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_property_financials_property_id ON public.property_financials(property_id);
