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
  const canonicalRecord = read("src/features/admin-crm/pages/AdminCanonicalRecord.tsx");
  const sidebar = read("src/features/admin-crm/layout/AdminCrmSidebar.tsx");
  const opportunities = read("src/pages/admin/AdminDeals.tsx");
  const conversation = read("src/pages/admin/AdminConnectionDetail.tsx");
  const representations = read("src/pages/admin/AdminRepresentations.tsx");

  it("uses the CRM shell and CRM-owned pages as the primary admin routes", () => {
    expect(app).toContain('import AdminCrmShell from "@/features/admin-crm/layout/AdminCrmShell"');
    expect(app).toContain('<Route element={<AdminCrmShell />}>');
    expect(app).toContain('<Route path="/admin/users" element={<CrmUsersIndex />} />');
    expect(app).toContain('<Route path="/admin/users/:userId" element={<CrmUserWorkspace />} />');
    expect(app).toContain('<Route path="/admin/properties/:id" element={<AdminCanonicalRecord recordType="property" />} />');
    expect(app).toContain('<Route path="/admin/opportunities/matches/:id" element={<AdminCanonicalRecord recordType="match" />} />');
    expect(app).toContain('<Route path="/admin/representation-requests" element={<AdminRepresentations />} />');
    expect(app).not.toContain('import AdminLayout from "@/components/layout/AdminLayout"');
    expect(shell).toContain("AdminCrmSidebar");
  });

  it("treats users as CRM contacts that open a relationship-aware workspace", () => {
    expect(directory).toContain("A contacts-style directory for every registered account");
    expect(directory).toContain('to={`/admin/users/${user.id}`}');
    expect(directory).toContain("const USER_DIRECTORY_GRID");
    expect(directory).toContain('<tr className={`grid ${USER_DIRECTORY_GRID}`}>');
    expect(directory).toContain('className={`grid ${USER_DIRECTORY_GRID} items-center`}');
    expect(workspace).toContain("WorkspaceNavigator");
    expect(workspace).toContain("WorkspaceRecordDetail");
    expect(workspace).toContain("buildAdminWorkspaceGraph");
    expect(workspace).toContain("scopeCrmUserWorkspace");
    expect(navigator).toContain("Account relationships");
    expect(navigator).toContain("Listing inventory");
    expect(detail).toContain("Client portfolio");
    expect(detail).toContain("Matched replacement properties");
    expect(detail).toContain("Detailed financials");
    expect(detail).toContain('TabsTrigger value="properties"');
    expect(detail).toContain('TabsTrigger value="matches"');
    expect(detail).toContain("ClientMatchGroup");
    expect(navigator).toContain("Agent conversations");
    expect(navigator).toContain("Listings & drafts");
    expect(navigator).toContain("Launchpad progress");
    expect(detail).toContain("Draft workspaces");
    expect(detail).toContain("Launchpad timestamps");
    expect(detail).toContain("Full timestamped history");
    expect(detail).toContain("Account created");
    expect(detail).toContain("Pending invitations");
    expect(detail).toContain("CrmAccountControls");
  });

  it("keeps relationship context in Users and sends canonical records to their own sections", () => {
    expect(sidebar).toContain('{ label: "Properties", href: "/admin/properties"');
    expect(sidebar).toContain('{ label: "Opportunities", href: "/admin/opportunities"');
    expect(sidebar).toContain('{ label: "Representation Requests", href: "/admin/representation-requests"');
    expect(sidebar).not.toContain('{ label: "Relationships"');
    expect(workspace).toContain('navigate(`/admin/properties/${next.id}`)');
    expect(workspace).toContain('navigate(`/admin/opportunities/matches/${next.id}`)');
    expect(workspace).toContain('navigate(`/admin/opportunities/exchanges/${next.id}`)');
    expect(canonicalRecord).toContain("WorkspaceRecordDetail");
    expect(canonicalRecord).toContain('data-testid={`admin-canonical-${recordType}`}');
  });

  it("keeps opportunity context attached to conversations and representation work", () => {
    expect(opportunities).toContain("Latest message");
    expect(opportunities).toContain("Property opportunity");
    expect(opportunities).toContain('from("messages")');
    expect(conversation).toContain("Agent conversation");
    expect(conversation).toContain("Client’s current property");
    expect(conversation).toContain("Matched replacement property");
    expect(conversation).toContain("Conversation history");
    expect(representations).toContain("Needs action");
    expect(representations).toContain("Requested exchange");
    expect(representations).not.toContain("Run multi-account test");
  });
});
