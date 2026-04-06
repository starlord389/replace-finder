
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name text NOT NULL,
  owner_email text NOT NULL,
  owner_phone text,
  property_location text,
  estimated_value numeric,
  property_type text,
  assigned_agent_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending',
  assigned_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_status_check CHECK (status IN ('pending', 'assigned', 'converted', 'declined'))
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_referrals_assigned_agent ON public.referrals(assigned_agent_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
