
-- Request status enum
CREATE TYPE public.request_status AS ENUM ('submitted', 'under_review', 'active', 'closed');

-- Asset type enum
CREATE TYPE public.asset_type AS ENUM (
  'multifamily', 'office', 'retail', 'industrial', 'medical_office',
  'self_storage', 'hospitality', 'mixed_use', 'land', 'net_lease', 'other'
);

-- Strategy type enum
CREATE TYPE public.strategy_type AS ENUM (
  'core', 'core_plus', 'value_add', 'opportunistic', 'development', 'nnn', 'other'
);

-- Exchange requests
CREATE TABLE public.exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'submitted',

  -- Relinquished property
  relinquished_address TEXT,
  relinquished_city TEXT,
  relinquished_state TEXT,
  relinquished_zip TEXT,
  relinquished_asset_type asset_type,
  relinquished_estimated_value NUMERIC,
  relinquished_description TEXT,

  -- Economics
  estimated_equity NUMERIC,
  estimated_debt NUMERIC,
  exchange_proceeds NUMERIC,
  estimated_basis NUMERIC,

  -- Timing
  sale_timeline TEXT,
  identification_deadline DATE,
  close_deadline DATE,
  urgency TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.exchange_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON public.exchange_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON public.exchange_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
  ON public.exchange_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all requests"
  ON public.exchange_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_exchange_requests_updated_at
  BEFORE UPDATE ON public.exchange_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Exchange request preferences (replacement goals)
CREATE TABLE public.exchange_request_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,

  target_price_min NUMERIC,
  target_price_max NUMERIC,
  target_asset_types asset_type[] DEFAULT '{}',
  target_strategies strategy_type[] DEFAULT '{}',
  target_states TEXT[] DEFAULT '{}',
  target_metros TEXT[] DEFAULT '{}',
  target_cap_rate_min NUMERIC,
  target_cap_rate_max NUMERIC,
  additional_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exchange_request_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage preferences for their own requests
CREATE POLICY "Users can view own preferences"
  ON public.exchange_request_preferences FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exchange_requests er
    WHERE er.id = request_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own preferences"
  ON public.exchange_request_preferences FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.exchange_requests er
    WHERE er.id = request_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own preferences"
  ON public.exchange_request_preferences FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exchange_requests er
    WHERE er.id = request_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all preferences"
  ON public.exchange_request_preferences FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all preferences"
  ON public.exchange_request_preferences FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON public.exchange_request_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Status history
CREATE TABLE public.exchange_request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  old_status request_status,
  new_status request_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exchange_request_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own status history"
  ON public.exchange_request_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.exchange_requests er
    WHERE er.id = request_id AND er.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all status history"
  ON public.exchange_request_status_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert status history"
  ON public.exchange_request_status_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin notes
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all notes"
  ON public.admin_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert notes"
  ON public.admin_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_exchange_requests_user_id ON public.exchange_requests(user_id);
CREATE INDEX idx_exchange_requests_status ON public.exchange_requests(status);
CREATE INDEX idx_preferences_request_id ON public.exchange_request_preferences(request_id);
CREATE INDEX idx_status_history_request_id ON public.exchange_request_status_history(request_id);
CREATE INDEX idx_admin_notes_request_id ON public.admin_notes(request_id);
