

## Fix Contact Form Submission

**Root cause:** The form on the homepage tries to `insert` into `public.contact_submissions`, but that table doesn't exist in the database. This also causes the TS build error `Argument of type '"contact_submissions"' is not assignable to parameter of type 'never'`.

## Plan

### 1. Create `contact_submissions` table (migration)
Columns:
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `email text not null`
- `message text not null`
- `created_at timestamptz not null default now()`
- `status text not null default 'new'` (for admin triage)

### 2. Enable RLS with these policies
- **Anyone can submit** (INSERT): `to anon, authenticated with check (true)` — homepage contact form is public, no login required.
- **Admins can view all** (SELECT): `using (has_role(auth.uid(),'admin'))`
- **Admins can update** (UPDATE): for marking submissions as handled.
- No DELETE policy (preserve history).

Add light validation via a CHECK constraint on length (name ≤120, email ≤320, message ≤5000) matching the client-side limits, to prevent abuse.

### 3. After the migration runs
The Supabase generated types will automatically include `contact_submissions`, which:
- Resolves the TS build error at `Index.tsx:2670`
- Makes `supabase.from("contact_submissions").insert(...)` succeed
- Form will display "Thanks. Your message was sent successfully."

### Files affected
- New migration: creates table + RLS policies
- No code changes needed in `Index.tsx` — the existing submit handler is correct, it just needs the table to exist.

### Note on other build errors
The build errors about `launchpad_completed_at`, `demo_requests`, and `profiles` columns are **separate issues** unrelated to the contact form. Want me to also fix those in the same pass? (I'll wait for your call before bundling them in.)

