-- Event registrations (1031 Exchange Summit monthly series + future events).
-- Run via Lovable (migrations in this repo do not auto-apply).

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  role text not null check (role in ('agent', 'investor')),
  event text not null default '1031-exchange-summit'
);

-- One registration per email per event (the form upserts with ignoreDuplicates,
-- which relies on this unique index for ON CONFLICT DO NOTHING).
create unique index event_registrations_email_event_key
  on public.event_registrations (email, event);

alter table public.event_registrations enable row level security;

-- Public visitors may register; the client can never read the list back
-- (no select policy — admins view registrations in the Supabase dashboard).
create policy "Anyone can register for events"
  on public.event_registrations
  for insert
  to anon, authenticated
  with check (true);
