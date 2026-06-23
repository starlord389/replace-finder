Plan to remove seed data entirely:

1. Wipe existing seeded/demo data
   - Run the existing backend wipe action one final time to delete all rows tagged `__mock__` across accounts.
   - Remove mock counterparty agent auth/profile/role records using the existing mock-agent email pattern.
   - Verify the database no longer has mock agent emails or `__mock__` records in seed-touched tables.

2. Remove all frontend seed tooling
   - Delete the mock-data dev panel from the agent dashboard.
   - Remove the dashboard import/render for `SeedMockDataPanel`.
   - Delete the seed/clear/validate helper files under `src/features/dev`.

3. Remove the backend seed capability
   - Delete the `seed-counterparty-agents` edge function source from the project.
   - Delete the deployed `seed-counterparty-agents` backend function so it cannot be invoked anymore.

4. Remove stale seed references
   - Remove stale seed plan notes from `.lovable/plan.md` if present.
   - Search the codebase for seed/mock-data references and clean up anything left connected to this system.

5. Final verification
   - Confirm the app builds/typechecks through the normal harness.
   - Confirm no UI entry point or backend function remains for creating, clearing, wiping, or validating seed data.

This will not create new seed data. It will preserve non-mock real records unless they are explicitly tagged as seed/mock data.