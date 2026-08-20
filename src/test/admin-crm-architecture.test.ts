import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("admin CRM architecture", () => {
  const app = read("src/App.tsx");
  const shell = read("src/features/admin-crm/layout/AdminCrmShell.tsx");
  const directory = read("src/features/admin-crm/pages/CrmUsersIndex.tsx");
  const workspace = read("src/features/admin-crm/pages/CrmUserWorkspace.tsx");
  const navigator = read("src/features/admin-crm/workspace/WorkspaceNavigator.tsx");
  const detail = read("src/features/admin-crm/workspace/WorkspaceRecordDetail.tsx");

  it("uses the CRM shell and CRM-owned pages as the primary admin routes", () => {
    expect(app).toContain('import AdminCrmShell from "@/features/admin-crm/layout/AdminCrmShell"');
    expect(app).toContain('<Route element={<AdminCrmShell />}>');
    expect(app).toContain('<Route path="/admin/users" element={<CrmUsersIndex />} />');
    expect(app).toContain('<Route path="/admin/users/:userId" element={<CrmUserWorkspace />} />');
    expect(app).not.toContain('import AdminLayout from "@/components/layout/AdminLayout"');
    expect(shell).toContain("AdminCrmSidebar");
  });

  it("treats users as CRM contacts that open a relationship-aware workspace", () => {
    expect(directory).toContain("A contacts-style directory for every registered account");
    expect(directory).toContain('to={`/admin/users/${user.id}`}');
    expect(workspace).toContain("WorkspaceNavigator");
    expect(workspace).toContain("WorkspaceRecordDetail");
    expect(workspace).toContain("buildAdminWorkspaceGraph");
    expect(workspace).toContain("scopeCrmUserWorkspace");
    expect(navigator).toContain("Account relationships");
    expect(navigator).toContain("Listing inventory");
    expect(detail).toContain("Client portfolio");
    expect(detail).toContain("Matched replacement properties");
    expect(detail).toContain("Detailed financials");
    expect(detail).toContain("CrmAccountControls");
  });
});
