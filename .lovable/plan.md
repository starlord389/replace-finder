Sync, migrate, and redeploy.

**1. Code sync from GitHub** — Lovable's GitHub integration is bidirectional and real-time, so your push to `main` is already in the workspace. I'll confirm the two migration files are present (they are: `20260623120000_add_address_visibility_and_owner_authorization.sql` and `20260623130000_grant_owner_admin_role.sql`).

**2. Apply the two migrations** via the migration tool (both are idempotent — safe to re-run):
- Add `address_is_public` and `owner_authorization_confirmed` columns to `pledged_properties` (both default `false`).
- Grant the `admin` role to the user matching the email in the migration.

Current DB state:
- The two columns were already added last turn — re-running is a no-op.
- `starlord389@gmail.com` already has both `agent` and `admin` roles (granted earlier this session).
- ⚠️ The grant migration in the repo targets `eamon.t.mckenna123@gmail.com`, **not** `starlord389@gmail.com`. No account exists for that email, so the `INSERT ... SELECT` will match zero rows and do nothing. If you actually want this migration to apply to `starlord389@gmail.com`, say so and I'll edit the SQL before running it.

**3. Redeploy edge functions:** `create-exchange`, `update-exchange`, `run-auto-matching`, `seed-counterparty-agents`.

**4. Confirm** — I'll verify the columns exist, list the roles on both emails, and report deploy success per function.