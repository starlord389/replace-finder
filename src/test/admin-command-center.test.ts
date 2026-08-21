import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertAdminCommandCenterRowsComplete,
  buildAdminAttentionItems,
  buildAdminSearchItems,
  formatAdminRelativeTime,
  mapAdminAccountSummary,
  type CommandCenterSource,
} from "@/features/admin/hooks/useAdminCommandCenter";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

function row<T extends keyof CommandCenterSource>(value: unknown) {
  return value as CommandCenterSource[T][number];
}

function baseSource(): CommandCenterSource {
  return {
    profiles: [],
    roles: [],
    exchanges: [],
    properties: [],
    matches: [],
    connections: [],
    clients: [],
    tickets: [],
    demos: [],
    contacts: [],
    referrals: [],
    eventRegistrations: [],
    timeline: [],
    representations: [],
    representationInvites: [],
    assignments: [],
    contactRequests: [],
    connectionIntents: [],
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("admin command center", () => {
  it("maps account summaries and derives workspace-scoped command-center KPIs", () => {
    expect(mapAdminAccountSummary({
      total_accounts: 42,
      agent_accounts: 12,
      investor_accounts: 27,
      new_accounts_7d: 5,
    })).toEqual({
      totalAccounts: 42,
      agentAccounts: 12,
      investorAccounts: 27,
      newAccounts7d: 5,
    });

    const source = read("src/features/admin/hooks/useAdminCommandCenter.ts");
    expect(source).toContain('export function useAdminCommandCenter(scope: "live" | "demo" = "live")');
    expect(source).toContain('queryKey: ["admin-command-center", scope]');
    expect(source).toContain('.eq("is_demo", isDemo)');
    expect(source).not.toContain('supabase.rpc("admin_get_account_summary")');
    expect(source).toContain("users: accountSummary.totalAccounts");
    expect(source).toContain("users: accountSummary.newAccounts7d");
  });

  it("rejects capped or unverifiable table reads instead of showing partial totals", () => {
    expect(() => assertAdminCommandCenterRowsComplete("profile", 10, 10)).not.toThrow();
    expect(() => assertAdminCommandCenterRowsComplete("profile", 1_000, 1_001))
      .toThrow("loaded 1000 of 1001 profile records");
    expect(() => assertAdminCommandCenterRowsComplete("profile", 10, null))
      .toThrow("could not verify the profile row count");

    const source = read("src/features/admin/hooks/useAdminCommandCenter.ts");
    expect(source).toContain('.select("*", { count: "exact" })');
    expect(source).toContain(
      "assertAdminCommandCenterRowsComplete(label, result.data?.length ?? 0, result.count)",
    );
  });

  it("keeps auth-only accounts discoverable and exposes command-center retry states", () => {
    const search = read("src/features/admin/components/AdminGlobalSearch.tsx");
    const header = read("src/components/layout/AdminHeader.tsx");

    expect(search).toContain("Search all Users &amp; Accounts");
    expect(search).toContain("including auth-only accounts");
    expect(search).toContain("`/admin/users?q=${encodeURIComponent(query.trim())}`");
    expect(search).toContain("Retry live search");
    expect(header).toContain("Live attention data is unavailable");
    expect(header).toContain("Admin attention data unavailable");
  });

  it("describes future deadlines as upcoming instead of just now", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T12:00:00Z"));
    expect(formatAdminRelativeTime("2026-08-20T14:00:00Z")).toBe("in 2h");
    expect(formatAdminRelativeTime("2026-08-22T12:00:00Z")).toBe("in 2d");
  });

  it("prioritizes imminent exchange deadlines and unresolved support", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T12:00:00Z"));

    const source = baseSource();
    source.clients = [
      row<"clients">({ id: "client-1", client_name: "Acme Holdings" }),
    ];
    source.profiles = [
      row<"profiles">({ id: "agent-1", full_name: "Alex Agent", email: "alex@example.com" }),
    ];
    source.exchanges = [
      row<"exchanges">({
        id: "exchange-1",
        agent_id: "agent-1",
        client_id: "client-1",
        status: "in_identification",
        identification_deadline: "2026-07-25T12:00:00Z",
        closing_deadline: null,
      }),
    ];
    source.tickets = [
      row<"tickets">({
        id: "ticket-1",
        subject: "Cannot publish listing",
        category: "technical",
        status: "open",
        created_at: "2026-07-20T12:00:00Z",
      }),
    ];

    const items = buildAdminAttentionItems(source);

    expect(items).toHaveLength(2);
    expect(items.every((item) => item.priority === "critical")).toBe(true);
    expect(items.some((item) => item.title === "Identification deadline in 1 day")).toBe(true);
    expect(items.some((item) => item.href === "/admin/support?ticket=ticket-1")).toBe(true);
  });

  it("builds searchable links for core business records", () => {
    const source = baseSource();
    source.profiles = [
      row<"profiles">({
        id: "user-1",
        full_name: "Jamie Broker",
        email: "jamie@example.com",
        brokerage_name: "Northstar Realty",
      }),
    ];
    source.clients = [
      row<"clients">({ id: "client-1", client_name: "Main Street Partners" }),
    ];
    source.exchanges = [
      row<"exchanges">({
        id: "exchange-1",
        agent_id: "user-1",
        client_id: "client-1",
        status: "active",
      }),
    ];
    source.eventRegistrations = [
      row<"eventRegistrations">({
        id: "event-1",
        full_name: "Taylor Investor",
        email: "taylor@example.com",
        role: "investor",
        event: "1031-exchange-summit",
      }),
    ];

    const items = buildAdminSearchItems(source);

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "User",
          title: "Jamie Broker",
          href: "/admin/users/user-1",
        }),
        expect.objectContaining({
          type: "Exchange",
          title: "Main Street Partners exchange",
          href: "/admin/opportunities/exchanges/exchange-1",
        }),
        expect.objectContaining({
          type: "Event",
          title: "Taylor Investor",
        }),
      ]),
    );
  });

  it("labels self-managed investor/property-owner records without inventing a client", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-24T12:00:00Z"));

    const source = baseSource();
    source.profiles = [
      row<"profiles">({ id: "owner-1", full_name: "Taylor Owner", email: "taylor@example.com" }),
    ];
    source.roles = [
      row<"roles">({ user_id: "owner-1", role: "investor" }),
    ];
    source.exchanges = [
      row<"exchanges">({
        id: "exchange-owner-1",
        agent_id: "owner-1",
        client_id: null,
        owner_type: "investor",
        status: "active",
        identification_deadline: "2026-07-25T12:00:00Z",
        closing_deadline: null,
      }),
    ];

    const attention = buildAdminAttentionItems(source);
    const search = buildAdminSearchItems(source);

    expect(attention[0].detail).toBe("Taylor Owner · Investor / Property Owner · Self-managed");
    expect(search).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: "User",
        title: "Taylor Owner",
        subtitle: expect.stringContaining("Investor / Property Owner"),
      }),
      expect.objectContaining({
        type: "Exchange",
        title: "Taylor Owner exchange",
        subtitle: expect.stringContaining("Investor / Property Owner"),
      }),
    ]));
  });

  it("surfaces current representation handoffs that need an administrator", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T12:00:00Z"));
    const source = baseSource();
    source.profiles = [
      row<"profiles">({ id: "owner-1", full_name: "Taylor Owner", email: "taylor@example.com" }),
    ];
    source.representations = [
      row<"representations">({
        id: "rep-1",
        investor_id: "owner-1",
        investor_email: "taylor@example.com",
        agent_email: "",
        status: "awaiting_agent",
        updated_at: "2026-08-17T12:00:00Z",
      }),
    ];
    source.connectionIntents = [
      row<"connectionIntents">({
        id: "intent-1",
        waiting_owner_id: "owner-1",
        waiting_on_side: "seller",
        status: "awaiting_representation",
        updated_at: "2026-08-20T11:00:00Z",
      }),
    ];

    const items = buildAdminAttentionItems(source);

    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "representation-rep-1",
        category: "representation",
        priority: "high",
        href: "/admin/representation-requests?q=taylor%40example.com",
      }),
      expect.objectContaining({
        id: "connection-intent-intent-1",
        title: "Listing interest is waiting on representation",
        href: "/admin/representation-requests?q=Taylor%20Owner",
      }),
    ]));
  });
});
