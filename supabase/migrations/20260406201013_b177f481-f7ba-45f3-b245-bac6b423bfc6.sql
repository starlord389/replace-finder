
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'new_match', 'match_score_update', 'connection_request', 'connection_accepted',
  'connection_declined', 'connection_milestone', 'connection_failed',
  'deadline_warning', 'deadline_critical',
  'exchange_status_change', 'new_referral', 'property_status_change', 'system'
));

ALTER TABLE public.exchange_timeline DROP CONSTRAINT IF EXISTS exchange_timeline_event_check;
ALTER TABLE public.exchange_timeline ADD CONSTRAINT exchange_timeline_event_check CHECK (event_type IN (
  'created', 'property_pledged', 'criteria_set', 'status_change',
  'match_found', 'connection_initiated', 'connection_accepted', 'connection_milestone',
  'identification_added', 'identification_finalized',
  'under_contract', 'closed', 'failed', 'cancelled'
));

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Users can delete own property images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'property-images');
