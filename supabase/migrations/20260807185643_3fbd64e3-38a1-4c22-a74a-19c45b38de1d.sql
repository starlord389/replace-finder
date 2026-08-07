REVOKE EXECUTE ON FUNCTION public.prepare_representation_invite_delivery(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_representation_invite(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_representation_invite_email(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.assign_agent_to_exchange(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.unassign_agent_from_exchange(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_default_representation(uuid, boolean) FROM anon;