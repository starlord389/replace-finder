## Referral submission fix

### Confirmed failure
- The live request returns `PGRST204: Could not find the 'notes' column of 'referrals' in the schema cache`.
- `Signup.tsx` submits a `notes` value, but the live `public.referrals` table does not contain that column.
- The live privilege check also shows no effective Data API grants on `referrals`, so the prior grants must be reapplied and verified.

### Implementation
1. Apply a database migration that:
   - Adds nullable `notes text` to `public.referrals`.
   - Grants `INSERT` to `anon`.
   - Grants the operations required by existing authenticated/admin/agent policies to `authenticated`.
   - Grants `ALL` to `service_role`.
   - Preserves the existing RLS policies.
2. Refresh the generated database types so the signup payload matches the live schema without unsafe typing.
3. Keep both existing referral entry points aligned with the same table schema.

### Verification
1. Submit the `/signup` referral form as a signed-out visitor and confirm a successful request plus a persisted row containing the notes value.
2. Submit through the landlord referral form and confirm it also persists successfully.
3. Verify the signed-in path when an injected auth session is available; otherwise report it separately as unverified.
4. Recheck table grants, RLS policies, and the final stored rows without exposing private form data.