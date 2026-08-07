ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'new_match','match_score_update','connection_request','connection_accepted','connection_declined',
  'connection_milestone','connection_failed','deadline_warning','deadline_critical','exchange_status_change',
  'new_referral','property_status_change','system','investor_inquiry','investor_inquiry_response',
  'agent_accepted_referral','agent_recommendation','client_contact_request','client_recommendation_response',
  'contact_request_declined','exchange_assigned','exchange_assignment_removed','exchange_reassigned',
  'representation_active','representation_assignment','representation_declined','representation_ended',
  'representation_invite','representation_invite_cancelled','representation_referral','representation_required',
  'client_agent_message'
]));