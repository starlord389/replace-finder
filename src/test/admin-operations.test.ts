import { describe, expect, it } from "vitest";
import {
  getAdminHealthIssueCount,
  normalizeAdminSystemHealth,
} from "@/features/admin/hooks/useAdminOperations";

describe("admin operations", () => {
  it("normalizes the system-health RPC response", () => {
    const health = normalizeAdminSystemHealth({
      checked_at: "2026-07-24T12:00:00Z",
      matching: {
        pending: 3,
        processing: 1,
        failed: 2,
        oldest_pending_at: "2026-07-24T11:00:00Z",
      },
      outbox: {
        pending: 4,
        failed: 1,
        oldest_pending_at: "2026-07-24T10:00:00Z",
      },
      email: {
        pending: 5,
        failed: 2,
        bounced: 1,
        complained: 1,
        dlq: 1,
        sent_last_24h: 22,
        last_issue_at: "2026-07-24T09:00:00Z",
      },
    });

    expect(health.matching).toEqual({
      pending: 3,
      processing: 1,
      failed: 2,
      oldestPendingAt: "2026-07-24T11:00:00Z",
    });
    expect(health.email.sentLast24h).toBe(22);
    expect(getAdminHealthIssueCount(health)).toBe(8);
  });

  it("uses safe zero values when optional health fields are absent", () => {
    const health = normalizeAdminSystemHealth({
      checked_at: "2026-07-24T12:00:00Z",
    });

    expect(health.matching.failed).toBe(0);
    expect(health.outbox.pending).toBe(0);
    expect(health.email.sentLast24h).toBe(0);
    expect(getAdminHealthIssueCount(health)).toBe(0);
  });
});
