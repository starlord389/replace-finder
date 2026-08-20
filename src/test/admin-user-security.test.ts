import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260820120000_admin_user_360.sql");
const directory = read("src/pages/admin/AdminUsers.tsx");

describe("admin account-control security contract", () => {
  it("routes browser mutations through guarded RPCs", () => {
    expect(directory).toContain('rpc("admin_set_user_role"');
    expect(directory).toContain('rpc("admin_set_agent_verification_status"');
    expect(directory).toContain('rpc("admin_set_user_account_status"');
    expect(directory).not.toMatch(/from\("user_roles"\)\.(?:insert|delete|update)/);
    expect(directory).not.toMatch(/from\("profiles"\)\.update\(\{\s*verification_status/);
  });

  it("never downloads representation invitation bearer tokens into admin pages", () => {
    const commandCenter = read("src/features/admin/hooks/useAdminCommandCenter.ts");
    const user360 = read("src/features/admin/hooks/useAdminUser360.ts");
    expect(commandCenter).toContain(
      'select("id, delivery_status, status, email, delivery_error_code, updated_at, representation_id", { count: "exact" })',
    );
    expect(commandCenter).not.toContain('from("representation_invites").select("*")');
    expect(user360).not.toContain('from("representation_invites").select("*")');
  });

  it("protects the current and final administrator atomically", () => {
    expect(migration).toContain("LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE");
    expect(migration).toContain("you cannot remove your own administrator role");
    expect(migration).toContain("the final administrator role cannot be removed");
    expect(migration).toContain("roles cannot be changed for a deleted account");
    expect(migration).toContain("verification cannot be changed for a deleted account");
    expect(migration).toContain("INSERT INTO public.admin_audit_log");
    expect(migration).toContain("REVOKE INSERT, DELETE ON public.user_roles FROM authenticated");
  });

  it("requires an audited reason and database-enforces suspension", () => {
    expect(migration).toContain("a suspension reason is required");
    expect(migration).toContain("you cannot suspend your own account");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.is_account_active");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.enforce_active_account_request");
    expect(migration).toContain("ALTER ROLE authenticator SET pgrst.db_pre_request");
    expect(migration).toContain("TO anon, authenticated, service_role");
    expect(migration).toContain("AS RESTRICTIVE FOR SELECT TO authenticated");
    expect(migration).toContain('ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated');
    expect(migration).toContain('ON public.profiles AS RESTRICTIVE FOR SELECT TO authenticated');
    expect(migration).toContain('ON public.user_roles AS RESTRICTIVE FOR SELECT TO authenticated');
    expect(migration).toContain("suspension changes must use admin_set_user_account_status");
    expect(migration).toContain("CREATE TRIGGER trg_profiles_guard_verification");
    expect(migration).toContain("v_has_profile := FOUND");
    expect(directory).not.toContain("No workspace access");
  });

  it("does not mutate Supabase-managed auth records from SQL", () => {
    expect(migration).not.toMatch(/UPDATE\s+auth\.users/i);
    expect(migration).not.toMatch(/DELETE\s+FROM\s+auth\.users/i);
  });

  it("repairs the historical match-agent schema drift before indexing it", () => {
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS buyer_agent_id uuid");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS seller_agent_id uuid");
    expect(migration.indexOf("ADD COLUMN IF NOT EXISTS buyer_agent_id uuid")).toBeLessThan(
      migration.indexOf("idx_matches_buyer_agent_created"),
    );
  });

  it("blocks suspended callers before service-role Edge Function writes", () => {
    for (const name of ["create-exchange", "update-exchange", "run-auto-matching", "demo-data"]) {
      const source = read(`supabase/functions/${name}/index.ts`);
      expect(source, name).toContain('rpc("is_account_active", { p_user_id:');
      expect(source, name).toContain("Account access is suspended or unavailable");
    }
    expect(existsSync(resolve(process.cwd(), "supabase/functions/admin-notify-test/index.ts"))).toBe(false);
  });
});
