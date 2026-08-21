import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("admin CRM live/demo boundary", () => {
  const scope = read("src/features/admin-crm/layout/AdminCrmScope.tsx");
  const shell = read("src/features/admin-crm/layout/AdminCrmShell.tsx");
  const header = read("src/features/admin-crm/layout/AdminCrmHeader.tsx");
  const users = read("src/features/admin-crm/pages/CrmUsersIndex.tsx");
  const workspace = read("src/features/admin-crm/pages/CrmUserWorkspace.tsx");
  const workspaceNavigator = read("src/features/admin-crm/workspace/WorkspaceNavigator.tsx");
  const workspaceDetail = read("src/features/admin-crm/workspace/WorkspaceRecordDetail.tsx");
  const communications = read("src/features/admin-crm/components/CommunicationsCenter.tsx");
  const communicationHook = read("src/features/admin-crm/data/useAdminCommunications.ts");
  const opportunities = read("src/pages/admin/AdminDeals.tsx");
  const canonicalRecord = read("src/features/admin-crm/pages/AdminCanonicalRecord.tsx");
  const exchangeDetail = read("src/pages/admin/AdminExchangeDetail.tsx");
  const connectionDetail = read("src/pages/admin/AdminConnectionDetail.tsx");
  const commandCenter = read("src/features/admin/hooks/useAdminCommandCenter.ts");
  const directory = read("src/features/admin-crm/data/useAdminCrmDirectory.ts");
  const routeScope = read("src/features/admin-crm/layout/adminRouteScope.ts");
  const support = read("src/pages/admin/SupportTickets.tsx");
  const user360 = read("src/features/admin/hooks/useAdminUser360.ts");
  const migration = read("supabase/migrations/20260821180000_admin_live_demo_boundary.sql");
  const matchingCore = read("supabase/functions/_shared/matching-core.ts");
  const demoSeeder = read("supabase/functions/demo-data/index.ts");

  it("provides one persistent workspace mode with a safe Live default", () => {
    expect(scope).toContain('export type AdminCrmScope = "live" | "demo"');
    expect(scope).toContain('const STORAGE_KEY = "exchangeup.admin-crm.scope"');
    expect(scope).toContain('return value === "demo" || value === "live" ? value : null');
    expect(scope).toContain('return window.sessionStorage.getItem(STORAGE_KEY) === "demo" ? "demo" : "live"');
    expect(shell).toContain("AdminCrmScopeProvider");
    expect(shell).toContain("Demo workspace · Sample records are isolated from live platform activity.");
    expect(header).toContain('onClick={() => setScope("live")}');
    expect(header).toContain('onClick={() => setScope("demo")}');
    expect(header).toContain("useAdminCommandCenter(effectiveScope)");
    expect(header).toContain('routeMode === "platform"');
    expect(routeScope).toContain('return "live-only"');
  });

  it("removes mixed mode from every primary CRM surface", () => {
    expect(users).toContain("const dataScope = scope as CrmUserDataScope");
    expect(users).not.toContain("Live + demo");
    expect(workspace).toContain("useAdminCrmScope");
    expect(workspace).toContain("<WorkspaceNavigator data={data} view={view}");
    expect(workspace).not.toContain("ScopeSwitch");
    expect(workspaceNavigator).toContain("view.connections.length");
    expect(workspaceNavigator).toContain("view.exchanges.length");
    expect(workspaceNavigator).toContain("view.notifications.length");
    expect(workspaceDetail).toContain("view.supportTickets");
    expect(workspaceDetail).toContain("view.notifications.forEach");
    expect(communications).toContain('dataScope: "live" | "demo"');
    expect(communications).not.toContain('value="all"');
    expect(communicationHook).toContain('dataScope: "live" | "demo"');
    expect(communicationHook).toContain("p_data_scope: filters.dataScope");
    expect(opportunities).toContain("dataScope: scope");
    expect(directory).toContain("p_data_scope: dataScope");
    expect(commandCenter).toContain('queryKey: ["admin-command-center", scope]');
    expect(commandCenter).toContain("p_data_scope: scope");
    expect(routeScope).toContain('return "platform"');
    expect(routeScope).toContain('return "live-only"');
    expect(support).toContain('.eq("is_demo", isDemo)');
  });

  it("blocks deep links from opening records in the wrong workspace", () => {
    expect(canonicalRecord).toContain("property.is_demo !== isDemo");
    expect(canonicalRecord).toContain("exchange.is_demo !== isDemo");
    expect(exchangeDetail).toContain("ex.is_demo !== isDemo");
    expect(connectionDetail).toContain("exchange.is_demo !== isDemo");
    expect(user360).toContain("Match ${match.id} links Live and Demo records and was hidden from scoped views.");
    expect(user360).toContain("const matches = data.matches.filter((row) => recordMatchesScope(row, scope))");
  });

  it("adds canonical communication classification and database integrity guards", () => {
    for (const table of ["notifications", "admin_messages", "email_send_log", "sms_messages", "support_tickets"]) {
      expect(migration).toContain(`ALTER TABLE public.${table} ALTER COLUMN is_demo SET DEFAULT false`);
      expect(migration).toContain(`ALTER TABLE public.${table} ALTER COLUMN is_demo SET NOT NULL`);
    }
    expect(migration).toContain("normalize_communication_data_scope");
    expect(migration).toContain("data scope must be live or demo");
    expect(migration).toContain("guard_match_data_scope");
    expect(migration).toContain("live and demo records cannot be matched");
    expect(migration).toContain("guard_connection_data_scope");
    expect(migration).toContain("existing cross-workspace matches must be resolved");
    expect(migration).toContain("existing cross-workspace connections must be resolved");
    expect(matchingCore).toContain("is_demo: isDemo");
    expect(demoSeeder).toContain("is_demo: true");
  });
});
