
CREATE TABLE public.agent_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  client_company text,
  status text NOT NULL DEFAULT 'active',
  referred_by_platform boolean NOT NULL DEFAULT false,
  referral_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_clients_status_check CHECK (status IN ('active', 'inactive'))
);

ALTER TABLE public.agent_clients ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_agent_clients_agent_id ON public.agent_clients(agent_id);
CREATE INDEX idx_agent_clients_client_user_id ON public.agent_clients(client_user_id);
