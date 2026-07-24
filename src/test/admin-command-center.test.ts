import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAdminAttentionItems,
  buildAdminSearchItems,
  type CommandCenterSource,
} from "@/features/admin/hooks/useAdminCommandCenter";

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
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("admin command center", () => {
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
          href: "/admin/users?q=jamie%40example.com",
        }),
        expect.objectContaining({
          type: "Exchange",
          title: "Main Street Partners exchange",
          href: "/admin/deals/exchanges/exchange-1",
        }),
        expect.objectContaining({
          type: "Event",
          title: "Taylor Investor",
        }),
      ]),
    );
  });
});
