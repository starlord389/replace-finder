import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("retired exchange deadline tracking", () => {
  it("removes deadline alerts from both command-center paths", () => {
    const hook = read("src/features/admin/hooks/useAdminCommandCenter.ts");
    const migration = read("supabase/migrations/20260821235500_retire_exchange_deadline_tracking.sql");

    expect(hook).not.toContain('category: "deadline"');
    expect(hook).not.toContain("Identification deadline");
    expect(hook).not.toContain("Closing deadline");
    expect(migration).not.toContain("overdueDeadlineCount");
    expect(migration).not.toContain("e.identification_deadline");
    expect(migration).not.toContain("e.closing_deadline");
  });

  it("stops automatic deadline calculation without deleting legacy columns", () => {
    const migration = read("supabase/migrations/20260821235500_retire_exchange_deadline_tracking.sql");

    expect(migration).toContain("DROP TRIGGER IF EXISTS trigger_auto_deadlines");
    expect(migration).toContain("DROP TRIGGER IF EXISTS trg_exchanges_auto_deadlines");
    expect(migration).toContain("DROP FUNCTION IF EXISTS public.auto_calculate_deadlines()");
    expect(migration).not.toMatch(/DROP\s+COLUMN/i);
  });

  it("removes deadline reminders and deadline fields from active product surfaces", () => {
    const preferences = read("src/features/notifications/components/NotificationPreferencesCard.tsx");
    const preferenceHook = read("src/features/notifications/hooks/useNotificationPrefs.ts");
    const exchangeDetail = read("src/pages/admin/AdminExchangeDetail.tsx");
    const workspaceDetail = read("src/features/admin-crm/workspace/WorkspaceRecordDetail.tsx");

    expect(preferences).not.toContain("Deadline reminders");
    expect(preferenceHook).not.toContain("notify_deadline_reminder");
    expect(exchangeDetail).not.toContain("Identification deadline");
    expect(workspaceDetail).not.toContain("Identification deadline");
  });
});
