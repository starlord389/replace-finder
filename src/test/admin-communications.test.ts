import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const migration = read("supabase/migrations/20260821120000_admin_communications_center.sql");
const repairMigration = read("supabase/migrations/20260821160000_admin_communications_type_fix.sql");
const app = read("src/App.tsx");
const sidebar = read("src/features/admin-crm/layout/AdminCrmSidebar.tsx");
const workspaceGraph = read("src/features/admin-crm/workspace/workspaceGraph.ts");
const workspaceNavigator = read("src/features/admin-crm/workspace/WorkspaceNavigator.tsx");
const workspaceDetail = read("src/features/admin-crm/workspace/WorkspaceRecordDetail.tsx");
const hook = read("src/features/admin-crm/data/useAdminCommunications.ts");
const center = read("src/features/admin-crm/components/CommunicationsCenter.tsx");

describe("admin communications center", () => {
  it("provides one global center and embeds the same center in user workspaces", () => {
    expect(app).toContain('<Route path="/admin/communications" element={<CrmCommunications />} />');
    expect(sidebar).toContain('{ label: "Inbox", href: "/admin/communications"');
    expect(workspaceGraph).toContain('| "communications"');
    expect(workspaceNavigator).toContain('title="Inbox"');
    expect(workspaceDetail).toContain("<CommunicationsCenter userId={data.profile.id}");
    expect(center).toContain('data-testid="admin-communications-center"');
  });

  it("covers every Phase 1 communication channel without write controls", () => {
    for (const channel of ["agent_agent", "client_agent", "notification", "email", "sms", "invitation", "support"]) {
      expect(center).toContain(`value: "${channel}"`);
    }
    expect(center).toContain("Messages cannot be changed or sent from this view.");
    expect(center).not.toMatch(/\.insert\(|\.update\(|\.delete\(/);
  });

  it("loads paginated previews separately from audited full content", () => {
    expect(hook).toContain('rpc("admin_list_communications"');
    expect(hook).toContain('rpc("admin_get_communication_items"');
    expect(migration).toContain("LIMIT p_limit");
    expect(migration).toContain("OFFSET p_offset");
    expect(migration).toContain("left(latest.content, 280)");
    expect(migration).toContain("'communications.viewed'");
    expect(migration).toContain("INSERT INTO public.admin_audit_log");
    expect(migration.indexOf("INSERT INTO public.admin_audit_log")).toBeLessThan(migration.indexOf("IF v_type = 'agent_conversation'"));
    expect(center).toContain("const selected = rows.find");
    expect(center).not.toContain("?? rows[0]");
  });

  it("requires an active administrator for both RPCs", () => {
    expect(migration.match(/public\.has_role\(v_uid, 'admin'::public\.app_role\)/g)).toHaveLength(2);
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.admin_list_communications");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.admin_get_communication_items");
    expect(migration).toContain("TO authenticated;");
  });

  it("never selects invitation bearer tokens", () => {
    expect(migration).not.toMatch(/SELECT[\s\S]{0,120}\b(?:ri|ci)\.token\b/i);
    expect(hook).not.toContain('from("representation_invites").select("*")');
    expect(hook).not.toContain('from("client_invites").select("*")');
    expect(hook).not.toContain("token");
  });

  it("keeps pre-deployment fallback honest and temporary", () => {
    expect(hook).toContain("The communications migration has not been applied yet");
    expect(hook).toContain('source: "legacy"');
    expect(center).toContain("Audit logging activates after deployment");
  });

  it("repairs the deployed recipient join without rewriting migration history", () => {
    expect(repairMigration).toContain("rp.id::text = am.recipient_id");
    expect(repairMigration).toContain("rp.id = am.recipient_id");
    expect(repairMigration).toContain("pg_get_functiondef");
    expect(repairMigration).toContain("to_regprocedure");
    expect(repairMigration).toContain("SET search_path = public");
    expect(repairMigration).not.toContain("DROP FUNCTION");
  });
});
