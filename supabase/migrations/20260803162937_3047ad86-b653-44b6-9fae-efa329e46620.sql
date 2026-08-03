ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'new_match','match_score_update','connection_request','connection_accepted','connection_declined',
  'connection_milestone','connection_failed','deadline_warning','deadline_critical',
  'exchange_status_change','new_referral','property_status_change','system',
  'investor_inquiry','investor_inquiry_response'
]));