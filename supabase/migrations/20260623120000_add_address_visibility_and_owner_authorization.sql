-- Listings now capture the property's street address again, but it is only
-- exposed to other agents when address_is_public is true (the listing agent and
-- admins always see it). owner_authorization_confirmed records the compliance
-- attestation that the agent has a listing/representation agreement or written
-- authorization from the owner to market the property. Both default to false.
ALTER TABLE public.pledged_properties
  ADD COLUMN IF NOT EXISTS address_is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_authorization_confirmed boolean NOT NULL DEFAULT false;
