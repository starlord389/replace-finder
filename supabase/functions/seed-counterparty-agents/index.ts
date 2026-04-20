// Creates two mock counter-party agents (auth users + profiles + a pledged property each)
// so that the requesting agent's seeded matches/connections have real foreign keys to point at.
// Idempotent — looks up existing mock agents by email before creating.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MOCK_AGENTS = [
  {
    email: "mock.agent.alpha@replacefinder.test",
    full_name: "Jordan Alvarez",
    brokerage_name: "Alvarez Commercial Group",
    property: {
      property_name: "Sunrise Apartments",
      address: "1420 Mockingbird Ln",
      city: "Phoenix",
      state: "AZ",
      zip: "85008",
      asset_type: "multifamily",
      strategy_type: "value_add",
      units: 48,
      year_built: 1998,
      building_square_footage: 42000,
      property_class: "B",
    },
  },
  {
    email: "mock.agent.bravo@replacefinder.test",
    full_name: "Priya Mehta",
    brokerage_name: "Mehta Investment Realty",
    property: {
      property_name: "Crosspoint Industrial",
      address: "880 Industrial Pkwy",
      city: "Charlotte",
      state: "NC",
      zip: "28269",
      asset_type: "industrial",
      strategy_type: "core_plus",
      units: 1,
      year_built: 2012,
      building_square_footage: 78000,
      property_class: "A",
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const result: Array<{ agent_id: string; property_id: string; email: string }> = [];

    for (const m of MOCK_AGENTS) {
      // Find or create auth user
      let userId: string | null = null;
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === m.email);
      if (existing) {
        userId = existing.id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: m.email,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: { full_name: m.full_name, role: "agent" },
        });
        if (createErr) throw createErr;
        userId = created.user!.id;
      }

      // Upsert profile
      await admin.from("profiles").upsert({
        id: userId,
        email: m.email,
        full_name: m.full_name,
        brokerage_name: m.brokerage_name,
        role: "agent",
        verification_status: "verified",
      });

      // Find or create their pledged property (mock-tagged)
      const { data: existingProp } = await admin
        .from("pledged_properties")
        .select("id")
        .eq("agent_id", userId)
        .eq("property_name", m.property.property_name)
        .maybeSingle();

      let propertyId = existingProp?.id ?? null;
      if (!propertyId) {
        const { data: prop, error: propErr } = await admin
          .from("pledged_properties")
          .insert({
            agent_id: userId,
            ...m.property,
            status: "listed",
            description: "__mock__ counter-party listing for demo matches",
            listed_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        if (propErr) throw propErr;
        propertyId = prop.id;
      }

      result.push({ agent_id: userId!, property_id: propertyId!, email: m.email });
    }

    return new Response(JSON.stringify({ counterparties: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("seed-counterparty-agents error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
