import { describe, expect, it } from "vitest";
import {
  buildAdminReportSnapshot,
  type AdminReportData,
} from "@/features/admin/hooks/useAdminReports";
import { buildCsv, escapeCsvValue } from "@/features/admin/lib/csvExport";

function row<T extends keyof AdminReportData>(value: unknown) {
  return value as AdminReportData[T][number];
}

function emptyData(): AdminReportData {
  return {
    profiles: [],
    roles: [],
    clients: [],
    exchanges: [],
    properties: [],
    connections: [],
    contacts: [],
    referrals: [],
    demos: [],
    events: [],
    tickets: [],
  };
}

describe("admin reports", () => {
  it("filters snapshot activity to the selected reporting period", () => {
    const data = emptyData();
    data.profiles = [
      row<"profiles">({ id: "new-agent", created_at: "2026-07-20T12:00:00Z" }),
      row<"profiles">({ id: "new-investor", created_at: "2026-07-21T12:00:00Z" }),
      row<"profiles">({ id: "old-agent", created_at: "2026-05-01T12:00:00Z" }),
    ];
    data.roles = [
      row<"roles">({ user_id: "new-agent", role: "agent" }),
      row<"roles">({ user_id: "new-investor", role: "investor" }),
      row<"roles">({ user_id: "old-agent", role: "agent" }),
    ];
    data.exchanges = [
      row<"exchanges">({ id: "exchange-1", status: "active", created_at: "2026-07-22T12:00:00Z" }),
    ];
    data.contacts = [
      row<"contacts">({ id: "contact-1", created_at: "2026-07-23T12:00:00Z" }),
    ];
    data.demos = [
      row<"demos">({ id: "demo-1", created_at: "2026-06-01T12:00:00Z" }),
    ];
    data.tickets = [
      row<"tickets">({ id: "ticket-1", status: "open", created_at: "2026-07-23T12:00:00Z" }),
      row<"tickets">({ id: "ticket-2", status: "closed", created_at: "2026-07-22T12:00:00Z" }),
    ];

    const snapshot = buildAdminReportSnapshot(data, 7, new Date("2026-07-24T12:00:00Z").getTime());

    expect(snapshot.users).toBe(2);
    expect(snapshot.agents).toBe(1);
    expect(snapshot.investors).toBe(1);
    expect(snapshot.accountTypes).toEqual({
      Agents: 1,
      "Investors / Property Owners": 1,
    });
    expect(snapshot.exchanges).toBe(1);
    expect(snapshot.activeExchanges).toBe(1);
    expect(snapshot.leads).toBe(1);
    expect(snapshot.unresolvedTickets).toBe(1);
  });

  it("neutralizes spreadsheet formulas and escapes CSV content", () => {
    expect(escapeCsvValue("=HYPERLINK(\"https://example.com\")")).toBe(
      "\"'=HYPERLINK(\"\"https://example.com\"\")\"",
    );
    expect(buildCsv(["Name", "Notes"], [["Jamie", "Line one,\nline two"]])).toBe(
      "\"Name\",\"Notes\"\r\n\"Jamie\",\"Line one,\nline two\"",
    );
  });
});
