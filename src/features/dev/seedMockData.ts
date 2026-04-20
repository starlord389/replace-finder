import { supabase } from "@/integrations/supabase/client";

const MOCK_TAG = "__mock__";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function seedAgentMockData(userId: string) {
  // 1) Counter-party agents via edge function
  const { data: cpData, error: cpErr } = await supabase.functions.invoke(
    "seed-counterparty-agents"
  );
  if (cpErr) throw cpErr;
  const counterparties: Array<{ agent_id: string; property_id: string }> =
    cpData?.counterparties ?? [];
  if (counterparties.length < 2) {
    throw new Error("Counter-party seeding failed");
  }
  const [cpA, cpB] = counterparties;

  // 2) Clients
  const clientPayload = [
    { client_name: "Sarah Chen", client_email: "sarah.chen@example.com", client_phone: "555-0101" },
    { client_name: "Marcus Rodriguez LLC", client_company: "Rodriguez Holdings LLC", client_email: "marcus@rodriguezllc.example" },
    { client_name: "Patel Family Trust", client_company: "Patel Family Trust", client_email: "trustee@patelfamily.example" },
    { client_name: "James Wilson", client_email: "jwilson@example.com", client_phone: "555-0144" },
    { client_name: "Aurora Holdings", client_company: "Aurora Holdings Inc.", client_email: "ops@auroraholdings.example" },
  ].map((c) => ({ ...c, agent_id: userId, status: "active", notes: MOCK_TAG }));

  const { data: clients, error: clientErr } = await supabase
    .from("agent_clients")
    .insert(clientPayload)
    .select("id, client_name");
  if (clientErr) throw clientErr;

  // 3) Pledged properties (your listings)
  const propertyPayload = [
    {
      property_name: "Heights Multifamily 24",
      address: "2400 Heights Blvd", city: "Houston", state: "TX", zip: "77008",
      asset_type: "multifamily" as const, strategy_type: "core_plus" as const,
      units: 24, year_built: 2005, building_square_footage: 22800, property_class: "B",
    },
    {
      property_name: "Coral Way Retail Center",
      address: "5200 Coral Way", city: "Miami", state: "FL", zip: "33145",
      asset_type: "retail" as const, strategy_type: "core" as const,
      units: 8, year_built: 2010, building_square_footage: 18500, property_class: "A",
    },
    {
      property_name: "Desert Ridge Industrial",
      address: "9100 N Desert Ridge Dr", city: "Phoenix", state: "AZ", zip: "85054",
      asset_type: "industrial" as const, strategy_type: "value_add" as const,
      units: 1, year_built: 2001, building_square_footage: 65000, property_class: "B",
    },
    {
      property_name: "Triangle Office Park",
      address: "120 Research Triangle Pkwy", city: "Raleigh", state: "NC", zip: "27709",
      asset_type: "office" as const, strategy_type: "core" as const,
      units: 1, year_built: 2015, building_square_footage: 48000, property_class: "A",
    },
  ].map((p) => ({
    ...p,
    agent_id: userId,
    status: "listed" as const,
    description: `${MOCK_TAG} ${p.property_name} — seeded demo property`,
    listed_at: new Date().toISOString(),
  }));

  const { data: properties, error: propErr } = await supabase
    .from("pledged_properties")
    .insert(propertyPayload)
    .select("id, property_name");
  if (propErr) throw propErr;

  // 4) Exchanges across statuses
  const exchangesPayload = [
    {
      client_id: clients![0].id, status: "draft" as const,
    },
    {
      client_id: clients![1].id, status: "active" as const,
      exchange_proceeds: 1_250_000, sale_close_date: isoDaysAgo(20).slice(0, 10),
      identification_deadline: daysFromNow(25), closing_deadline: daysFromNow(160),
      relinquished_property_id: properties![0].id,
    },
    {
      client_id: clients![2].id, status: "active" as const,
      exchange_proceeds: 2_400_000, sale_close_date: isoDaysAgo(10).slice(0, 10),
      identification_deadline: daysFromNow(35), closing_deadline: daysFromNow(170),
      relinquished_property_id: properties![1].id,
    },
    {
      client_id: clients![3].id, status: "in_identification" as const,
      exchange_proceeds: 3_100_000, sale_close_date: isoDaysAgo(36).slice(0, 10),
      identification_deadline: daysFromNow(9), closing_deadline: daysFromNow(144),
      relinquished_property_id: properties![2].id,
    },
    {
      client_id: clients![4].id, status: "in_closing" as const,
      exchange_proceeds: 4_750_000, sale_close_date: isoDaysAgo(60).slice(0, 10),
      identification_deadline: daysFromNow(-15), closing_deadline: daysFromNow(12),
      relinquished_property_id: properties![3].id,
    },
    {
      client_id: clients![0].id, status: "completed" as const,
      exchange_proceeds: 1_900_000, sale_close_date: isoDaysAgo(180).slice(0, 10),
      identification_deadline: isoDaysAgo(135).slice(0, 10),
      closing_deadline: isoDaysAgo(8).slice(0, 10),
      actual_close_date: isoDaysAgo(8).slice(0, 10),
    },
  ].map((e) => ({ ...e, agent_id: userId }));

  const { data: exchanges, error: exErr } = await supabase
    .from("exchanges")
    .insert(exchangesPayload)
    .select("id, status");
  if (exErr) throw exErr;

  // 5) Matches — buyer side (your active exchanges → counter-party properties)
  const buyerExchanges = exchanges!.filter((e) =>
    ["active", "in_identification"].includes(e.status as string)
  );
  const matchesPayload: Array<Record<string, unknown>> = [];
  buyerExchanges.forEach((ex, i) => {
    const cp = i % 2 === 0 ? cpA : cpB;
    matchesPayload.push({
      buyer_exchange_id: ex.id,
      seller_property_id: cp.property_id,
      total_score: 78 + i * 4,
      price_score: 80, geo_score: 75, asset_score: 85,
      strategy_score: 70, financial_score: 72, timing_score: 78,
      scale_fit_score: 80, debt_fit_score: 70,
      buyer_agent_viewed: false,
      status: "active",
    });
  });
  // Seller side — counter-party buyer exchange targeting one of YOUR pledged properties
  // We need a buyer_exchange owned by the counter-party. Skipping — requires seeding their exchanges.
  // Instead, mark one of your own listed props as having an inbound match by reusing an existing buyer exchange.
  // (Already covered above — pipeline + attention only need buyer-side matches.)

  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, buyer_exchange_id, seller_property_id");
  if (matchErr) throw matchErr;

  // 6) Exchange connections — 1 pending (inbound from cpA), 1 accepted (cpB)
  const firstMatch = matches![0];
  const secondMatch = matches![1] ?? firstMatch;

  const connectionsPayload = [
    {
      match_id: firstMatch.id,
      buyer_agent_id: userId,
      seller_agent_id: cpA.agent_id,
      buyer_exchange_id: firstMatch.buyer_exchange_id,
      seller_exchange_id: null,
      status: "pending",
      initiated_by: "seller",
    },
    {
      match_id: secondMatch.id,
      buyer_agent_id: userId,
      seller_agent_id: cpB.agent_id,
      buyer_exchange_id: secondMatch.buyer_exchange_id,
      seller_exchange_id: null,
      status: "accepted",
      initiated_by: "buyer",
      accepted_at: isoDaysAgo(2),
    },
  ];

  const { data: connections, error: connErr } = await supabase
    .from("exchange_connections")
    .insert(connectionsPayload)
    .select("id, status");
  if (connErr) throw connErr;

  // 7) Messages on the accepted connection
  const acceptedConn = connections!.find((c) => c.status === "accepted");
  if (acceptedConn) {
    const messagesPayload = [
      { connection_id: acceptedConn.id, sender_id: cpB.agent_id, content: "Thanks for connecting — happy to share the OM." },
      { connection_id: acceptedConn.id, sender_id: userId, content: "Appreciate it. Can you send T-12 financials as well?" },
      { connection_id: acceptedConn.id, sender_id: cpB.agent_id, content: "Sending now. Let me know if your client wants a tour next week." },
      { connection_id: acceptedConn.id, sender_id: userId, content: "Will do — circling back today after our 3pm." },
    ];
    const { error: msgErr } = await supabase.from("messages").insert(messagesPayload);
    if (msgErr) throw msgErr;
  }

  // 8) Notifications
  const notifPayload = [
    { user_id: userId, type: "match", title: "New match available", message: "Sunrise Apartments matched your active exchange.", link_to: "/agent/matches", read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "connection", title: "Connection request", message: "Jordan Alvarez requested to connect on Sunrise Apartments.", link_to: "/agent/connections", read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "deadline", title: "Closing deadline approaching", message: "Aurora Holdings exchange closes in 12 days.", link_to: "/agent/exchanges", read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "message", title: "New message", message: "Priya Mehta sent you a message.", link_to: "/agent/messages", read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "deadline", title: "Identification deadline approaching", message: "James Wilson exchange identification due in 9 days.", link_to: "/agent/exchanges", read: false, metadata: { tag: MOCK_TAG } },
  ];
  const { error: notifErr } = await supabase.from("notifications").insert(notifPayload);
  if (notifErr) throw notifErr;

  return {
    clients: clients!.length,
    properties: properties!.length,
    exchanges: exchanges!.length,
    matches: matches!.length,
    connections: connections!.length,
  };
}
