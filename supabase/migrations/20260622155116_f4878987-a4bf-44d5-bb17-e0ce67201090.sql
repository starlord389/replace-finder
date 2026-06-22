
-- Add scheduling fields to demo_requests
ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- Create article_feedback table
CREATE TABLE IF NOT EXISTS public.article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id text NOT NULL,
  article_type text NOT NULL,
  article_title text NOT NULL,
  helpful boolean NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.article_feedback TO authenticated;
GRANT ALL ON public.article_feedback TO service_role;

ALTER TABLE public.article_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own feedback"
  ON public.article_feedback FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all feedback"
  ON public.article_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_article_feedback_updated_at
  BEFORE UPDATE ON public.article_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
