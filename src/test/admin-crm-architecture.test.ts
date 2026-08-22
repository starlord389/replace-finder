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
  const scalability = read("supabase/migrations/20260821213000_admin_crm_scalability.sql");
  const conversation = read("src/pages/admin/AdminConnectionDetail.tsx");
  const representations = read("src/pages/admin/AdminRepresentations.tsx");

  it("uses the CRM shell and CRM-owned pages as the primary admin routes", () => {
    expect(app).toContain('import AdminCrmShell from "@/features/admin-crm/layout/AdminCrmShell"');
    expect(app).toContain('<Route element={<AdminCrmShell />}>');
    expect(app).toContain('<Route path="/admin/users" element={<CrmUsersIndex />} />');
    expect(app).toContain('<Route path="/admin/users/:userId" element={<CrmUserWorkspace />} />');
    expect(app).toContain('<Route path="/admin/communications" element={<CrmCommunications />} />');
    expect(app).toContain('<Route path="/admin/properties/:id" element={<AdminCanonicalRecord recordType="property" />} />');
    expect(app).toContain('<Route path="/admin/opportunities/matches/:id" element={<AdminCanonicalRecord recordType="match" />} />');
    expect(app).toContain('<Route path="/admin/representation-requests" element={<AdminRepresentations />} />');
    expect(app).not.toContain('import AdminLayout from "@/components/layout/AdminLayout"');
    expect(shell).toContain("AdminCrmSidebar");
  });

  it("treats users as CRM contacts that open a relationship-aware workspace", () => {
    expect(directory).toContain('title="People"');
    expect(directory).toContain("Every real signup appears here");
    expect(directory).toContain("getAdminOnboardingStage");
    expect(directory).toContain("Journey stage");
    expect(directory).toContain('to={`/admin/users/${user.id}`}');
    expect(directory).toContain("const USER_DIRECTORY_GRID");
    expect(directory).toContain('<tr className={`grid ${USER_DIRECTORY_GRID}`}>');
    expect(directory).toContain('className={`grid ${USER_DIRECTORY_GRID} items-center`}');
    expect(workspace).toContain("WorkspaceNavigator");
    expect(workspace).toContain("WorkspaceRecordDetail");
    expect(workspace).toContain("buildAdminWorkspaceGraph");
    expect(workspace).toContain("scopeCrmUserWorkspace");
    expect(navigator).toContain("Account relationships");
    expect(navigator).toContain("Workspace views");
    expect(navigator).toContain('title={isAgent ? "Relationships" : "Representation"}');
    expect(navigator).toContain('title="Listings"');
    expect(navigator).toContain("CRM only");
    expect(navigator).toContain("Personal owner workspace");
    expect(detail).toContain("Workspace summary");
    expect(detail).toContain("Current work");
    expect(detail).toContain("One queue for unfinished work and incoming requests");
    expect(detail).toContain("Client access & representation");
    expect(detail).toContain("Owned by this account");
    expect(detail).toContain("No active agent");
    expect(detail).toContain("How this client is connected");
    expect(detail).toContain("Workspace invitation");
    expect(detail).toContain("Owner workspace");
    expect(detail).toContain("Self-owned");
    expect(detail).toContain("Self-owned records are explicitly tagged");
    expect(detail).toContain("Matched replacement properties");
    expect(detail).toContain("Detailed financials");
    expect(detail).toContain('TabsTrigger value="properties"');
    expect(detail).toContain('TabsTrigger value="matches"');
    expect(detail).toContain("ClientMatchGroup");
    expect(navigator).toContain('title="Inbox"');
    expect(navigator).toContain('title="Launchpad"');
    expect(navigator).toContain('title="Audit"');
    expect(detail).toContain("Draft workspaces");
    expect(detail).toContain("Launchpad timestamps");
    expect(detail).toContain("Full timestamped history");
    expect(detail).toContain("Account created");
    expect(detail).toContain("Pending invitations");
    expect(detail).toContain("CrmAccountControls");
  });

  it("keeps relationship context in People and treats global records as optional operational views", () => {
    expect(sidebar).toContain('{ label: "People", href: "/admin/users"');
    expect(sidebar).toContain('{ label: "Properties", href: "/admin/properties"');
    expect(sidebar).toContain('{ label: "Opportunities", href: "/admin/opportunities"');
    expect(sidebar).toContain('{ label: "Inbox", href: "/admin/communications"');
    expect(sidebar).toContain('{ label: "Representation", href: "/admin/representation-requests"');
    expect(sidebar).not.toContain('{ label: "Relationships"');
    expect(workspace).toContain("serializeWorkspaceSelection(next)");
    expect(workspace).not.toContain('navigate(`/admin/properties/${next.id}`)');
    expect(workspace).not.toContain('navigate(`/admin/opportunities/matches/${next.id}`)');
    expect(workspace).not.toContain('navigate(`/admin/opportunities/exchanges/${next.id}`)');
    expect(workspace).toContain('action: "Open in Properties"');
    expect(workspace).toContain('action: "Open in Opportunities"');
    expect(navigator).toContain("Matched opportunities");
    expect(navigator).toContain('onSelect({ type: "match", id: match.id })');
    expect(canonicalRecord).toContain("WorkspaceRecordDetail");
    expect(canonicalRecord).toContain("Return to workspace");
    expect(canonicalRecord).toContain('data-testid={`admin-canonical-${recordType}`}');
  });

  it("keeps opportunity context attached to conversations and representation work", () => {
    expect(opportunities).toContain("Latest message");
    expect(opportunities).toContain("Property opportunity");
    expect(opportunities).toContain("context.latest_message");
    expect(scalability).toContain("FROM public.messages msg");
    expect(conversation).toContain("Agent conversation");
    expect(conversation).toContain("Client’s current property");
    expect(conversation).toContain("Matched replacement property");
    expect(conversation).toContain("Conversation history");
    expect(representations).toContain("Needs action");
    expect(representations).toContain("Requested exchange");
    expect(representations).not.toContain("Run multi-account test");
  });
});
