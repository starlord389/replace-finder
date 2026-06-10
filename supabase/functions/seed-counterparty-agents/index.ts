// Creates mock counter-party agents (auth users + profiles + fully enriched
// pledged properties: descriptive fields, financials, and photo galleries)
// so the requesting agent's seeded matches/connections demo every feature.
// Idempotent — re-running updates property details and backfills missing
// financials/images on existing rows.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SEED_VERSION = 2;

const IMG = {
  multifamilyA: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=75&auto=format&fit=crop",
  ],
  multifamilyB: [
    "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=75&auto=format&fit=crop",
  ],
  office: [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&q=75&auto=format&fit=crop",
  ],
  industrialA: [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1600&q=75&auto=format&fit=crop",
  ],
  industrialB: [
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&q=75&auto=format&fit=crop",
  ],
  retail: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1600&q=75&auto=format&fit=crop",
  ],
  medical: [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=75&auto=format&fit=crop",
  ],
};

// Builds a coherent set of financials: NOI derives from asking price and cap
// rate; expenses reconcile to (effective gross income - NOI).
function buildFinancials(opts: {
  ask: number;
  capRate: number;
  gsi: number;
  occupancy: number;
  otherIncome?: number;
  avgRent?: number | null;
  loanBalance: number;
  loanRate: number;
  loanType: string;
  loanMaturity: string;
  prepay?: string | null;
}) {
  const noi = Math.round((opts.ask * opts.capRate) / 100);
  const otherIncome = opts.otherIncome ?? 0;
  const egi = Math.round((opts.gsi * opts.occupancy) / 100 + otherIncome);
  const expenses = Math.max(egi - noi, Math.round(egi * 0.18));
  const split = (pct: number) => Math.round(expenses * pct);
  // 30-yr amortization payment approximation for annual debt service
  const r = opts.loanRate / 100 / 12;
  const n = 360;
  const monthly = opts.loanBalance > 0
    ? (opts.loanBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    : 0;
  const ads = Math.round(monthly * 12);
  const cashFlow = noi - ads;
  const equity = opts.ask - opts.loanBalance;
  return {
    asking_price: opts.ask,
    appraised_value: Math.round(opts.ask * 1.02),
    cap_rate: opts.capRate,
    noi,
    annual_revenue: egi,
    annual_expenses: expenses,
    gross_scheduled_income: opts.gsi,
    effective_gross_income: egi,
    other_income: otherIncome,
    occupancy_rate: opts.occupancy,
    vacancy_rate: Math.round((100 - opts.occupancy) * 10) / 10,
    average_rent_per_unit: opts.avgRent ?? null,
    real_estate_taxes: split(0.30),
    insurance: split(0.12),
    utilities: split(0.18),
    management_fee: split(0.11),
    maintenance_repairs: split(0.16),
    capex_reserves: split(0.07),
    other_expenses: split(0.06),
    loan_balance: opts.loanBalance,
    loan_rate: opts.loanRate,
    loan_type: opts.loanType,
    loan_maturity_date: opts.loanMaturity,
    annual_debt_service: ads,
    has_prepayment_penalty: Boolean(opts.prepay),
    prepayment_penalty_details: opts.prepay ?? null,
    cash_on_cash: equity > 0 ? Math.round((cashFlow / equity) * 1000) / 10 : null,
  };
}

type MockProperty = {
  details: Record<string, unknown>;
  financials: ReturnType<typeof buildFinancials>;
  images: string[];
};

type MockAgent = {
  email: string;
  full_name: string;
  brokerage_name: string;
  properties: MockProperty[];
};

const MOCK_AGENTS: MockAgent[] = [
  {
    email: "mock.agent.alpha@replacefinder.test",
    full_name: "Jordan Alvarez",
    brokerage_name: "Alvarez Commercial Group",
    properties: [
      {
        details: {
          property_name: "Sunrise Apartments",
          address: "1420 Mockingbird Ln", city: "Phoenix", state: "AZ",
          zip: "85008", county: "Maricopa",
          asset_type: "multifamily", asset_subtype: "Garden-style",
          strategy_type: "value_add",
          units: 48, year_built: 1998, building_square_footage: 42000,
          land_area_acres: 2.6, num_buildings: 4, num_stories: 2,
          parking_spaces: 96, parking_type: "Surface + covered",
          property_class: "B", property_condition: "Good — common areas renovated 2022",
          construction_type: "Wood frame over masonry", roof_type: "Pitched shingle (2019)",
          hvac_type: "Individual package units", zoning: "R-4",
          amenities: ["Pool", "Covered parking", "On-site laundry", "Dog park"],
          recent_renovations: "38 of 48 units renovated 2021-2023; new exterior paint and pool deck 2022.",
          description: "__mock__ Stabilized garden-style community in the Arcadia Lite corridor with proven value-add upside on 10 classic units. Strong rent growth submarket with easy access to Loop 202 and Sky Harbor.",
        },
        financials: buildFinancials({
          ask: 4_950_000, capRate: 5.9, gsi: 662_400, occupancy: 94,
          otherIncome: 18_000, avgRent: 1150,
          loanBalance: 2_700_000, loanRate: 6.25,
          loanType: "Fixed 10-yr, assumable", loanMaturity: "2031-03-01",
          prepay: "Defeasance through 2029",
        }),
        images: IMG.multifamilyA,
      },
      {
        details: {
          property_name: "Mesa Gateway Plaza",
          address: "2210 S Power Rd", city: "Mesa", state: "AZ",
          zip: "85209", county: "Maricopa",
          asset_type: "retail", asset_subtype: "Neighborhood strip center",
          strategy_type: "core",
          units: 12, year_built: 2007, building_square_footage: 18400,
          land_area_acres: 1.9, num_buildings: 2, num_stories: 1,
          parking_spaces: 84, parking_type: "Surface",
          property_class: "B", property_condition: "Very good — roof replaced 2021",
          construction_type: "Masonry / steel", roof_type: "TPO (2021)",
          hvac_type: "Rooftop package units", zoning: "C-2",
          amenities: ["Anchor tenant: national pharmacy", "Pylon signage", "Hard corner"],
          recent_renovations: "Parking lot resurfaced and LED site lighting installed 2022.",
          description: "__mock__ Fully leased neighborhood strip center at a signalized hard corner near Phoenix-Mesa Gateway Airport. 9 of 12 tenants on NNN leases with staggered expirations.",
        },
        financials: buildFinancials({
          ask: 2_450_000, capRate: 6.4, gsi: 248_000, occupancy: 92,
          otherIncome: 9_500, avgRent: null,
          loanBalance: 1_320_000, loanRate: 5.9,
          loanType: "Fixed 7-yr", loanMaturity: "2029-09-01",
        }),
        images: IMG.retail,
      },
    ],
  },
  {
    email: "mock.agent.bravo@replacefinder.test",
    full_name: "Priya Mehta",
    brokerage_name: "Mehta Investment Realty",
    properties: [
      {
        details: {
          property_name: "Crosspoint Industrial",
          address: "880 Industrial Pkwy", city: "Charlotte", state: "NC",
          zip: "28269", county: "Mecklenburg",
          asset_type: "industrial", asset_subtype: "Warehouse / distribution",
          strategy_type: "core_plus",
          units: 1, year_built: 2012, building_square_footage: 78000,
          land_area_acres: 5.4, num_buildings: 1, num_stories: 1,
          parking_spaces: 60, parking_type: "Surface + trailer parking",
          property_class: "A", property_condition: "Excellent",
          construction_type: "Tilt-up concrete", roof_type: "TPO (original, under warranty)",
          hvac_type: "Office HVAC + warehouse exhaust", zoning: "I-1",
          amenities: ["24' clear height", "8 dock-high doors", "ESFR sprinklers", "Fenced yard"],
          recent_renovations: "Office build-out refreshed 2023; LED warehouse lighting.",
          description: "__mock__ Single-tenant distribution facility leased to a regional logistics operator through 2030 with 2.5% annual escalations. I-485 access within one mile.",
        },
        financials: buildFinancials({
          ask: 3_200_000, capRate: 6.8, gsi: 268_000, occupancy: 100,
          otherIncome: 0, avgRent: null,
          loanBalance: 1_760_000, loanRate: 5.4,
          loanType: "Fixed 10-yr", loanMaturity: "2032-06-01",
        }),
        images: IMG.industrialA,
      },
      {
        details: {
          property_name: "Queen City Medical Commons",
          address: "4310 Park Rd", city: "Charlotte", state: "NC",
          zip: "28209", county: "Mecklenburg",
          asset_type: "medical_office", asset_subtype: "Multi-tenant medical office",
          strategy_type: "core",
          units: 14, year_built: 2016, building_square_footage: 26500,
          land_area_acres: 2.1, num_buildings: 1, num_stories: 2,
          parking_spaces: 120, parking_type: "Surface",
          property_class: "A", property_condition: "Excellent",
          construction_type: "Steel / glass curtain wall", roof_type: "Modified bitumen",
          hvac_type: "VAV with rooftop units", zoning: "O-2",
          amenities: ["Hospital-adjacent", "Generator backup", "ADA suites", "Covered drop-off"],
          recent_renovations: "Lobby and wayfinding refresh 2024.",
          description: "__mock__ 96% occupied medical office adjacent to Atrium Health Pineville. Weighted average lease term of 5.8 years across imaging, dental, and primary-care tenants.",
        },
        financials: buildFinancials({
          ask: 4_100_000, capRate: 6.2, gsi: 372_000, occupancy: 96,
          otherIncome: 12_000, avgRent: null,
          loanBalance: 2_250_000, loanRate: 5.75,
          loanType: "Fixed 10-yr", loanMaturity: "2033-01-01",
        }),
        images: IMG.medical,
      },
    ],
  },
  {
    email: "mock.agent.charlie@replacefinder.test",
    full_name: "Daniel Brooks",
    brokerage_name: "Brooks & Lane CRE",
    properties: [
      {
        details: {
          property_name: "Lakeline Flex Park",
          address: "11500 Lakeline Blvd", city: "Cedar Park", state: "TX",
          zip: "78613", county: "Williamson",
          asset_type: "industrial", asset_subtype: "Flex / light industrial",
          strategy_type: "value_add",
          units: 6, year_built: 2009, building_square_footage: 41200,
          land_area_acres: 3.2, num_buildings: 2, num_stories: 1,
          parking_spaces: 88, parking_type: "Surface",
          property_class: "B", property_condition: "Good — two suites in shell condition",
          construction_type: "Tilt-up concrete", roof_type: "TPO (2018)",
          hvac_type: "Split systems per suite", zoning: "LI",
          amenities: ["Grade-level doors", "14-18' clear height", "Austin MSA growth corridor"],
          recent_renovations: "Suite 4 white-boxed 2024; new monument signage.",
          description: "__mock__ Six-suite flex park in the Austin growth corridor, 88% leased with two suites ready for lease-up — in-place rents roughly 12% under market.",
        },
        financials: buildFinancials({
          ask: 2_850_000, capRate: 7.1, gsi: 284_000, occupancy: 88,
          otherIncome: 6_000, avgRent: null,
          loanBalance: 1_540_000, loanRate: 6.5,
          loanType: "Fixed 5-yr, interest-only year 1", loanMaturity: "2030-04-01",
        }),
        images: IMG.industrialB,
      },
    ],
  },
  {
    email: "mock.agent.delta@replacefinder.test",
    full_name: "Elena Vasquez",
    brokerage_name: "Vasquez Realty Partners",
    properties: [
      {
        details: {
          property_name: "Bayshore Court Apartments",
          address: "3804 W Azeele St", city: "Tampa", state: "FL",
          zip: "33609", county: "Hillsborough",
          asset_type: "multifamily", asset_subtype: "Courtyard low-rise",
          strategy_type: "core_plus",
          units: 32, year_built: 2003, building_square_footage: 28400,
          land_area_acres: 1.8, num_buildings: 3, num_stories: 2,
          parking_spaces: 52, parking_type: "Surface",
          property_class: "B", property_condition: "Very good — new roofs 2023",
          construction_type: "Concrete block", roof_type: "Pitched shingle (2023)",
          hvac_type: "Individual split systems", zoning: "RM-16",
          amenities: ["Courtyard pool", "In-unit washer/dryer", "Gated parking"],
          recent_renovations: "All roofs replaced 2023 post-storm; 12 units upgraded 2022-2024.",
          description: "__mock__ Courtyard community a mile from Bayshore Boulevard, 95% occupied with insurance-grade roof replacements complete — a clean Florida multifamily story with renovation upside on 20 units.",
        },
        financials: buildFinancials({
          ask: 4_600_000, capRate: 5.5, gsi: 564_000, occupancy: 95,
          otherIncome: 15_000, avgRent: 1470,
          loanBalance: 2_530_000, loanRate: 5.95,
          loanType: "Agency fixed 10-yr", loanMaturity: "2033-08-01",
          prepay: "Yield maintenance through 2031",
        }),
        images: IMG.multifamilyB,
      },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const counterparties: Array<{
      agent_id: string;
      email: string;
      full_name: string;
      properties: Array<{ id: string; name: string; asking_price: number | null; cap_rate: number | null; city: string; state: string; asset_type: string }>;
    }> = [];

    const { data: userList } = await admin.auth.admin.listUsers();

    for (const m of MOCK_AGENTS) {
      // Find or create auth user
      let userId: string | null =
        userList?.users.find((u) => u.email === m.email)?.id ?? null;
      if (!userId) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: m.email,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: { full_name: m.full_name, role: "agent" },
        });
        if (createErr) throw createErr;
        userId = created.user!.id;
      }

      const { error: profileErr } = await admin.from("profiles").upsert({
        id: userId,
        email: m.email,
        full_name: m.full_name,
        brokerage_name: m.brokerage_name,
        verification_status: "verified",
      });
      if (profileErr) throw profileErr;

      // The auth trigger normally grants the agent role from metadata;
      // backfill here in case it didn't run for pre-existing mock users.
      const { data: existingRole } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("user_id", userId)
        .eq("role", "agent")
        .maybeSingle();
      if (!existingRole) {
        const { error: roleErr } = await admin
          .from("user_roles")
          .insert({ user_id: userId, role: "agent" });
        if (roleErr) throw roleErr;
      }

      const agentEntry = {
        agent_id: userId,
        email: m.email,
        full_name: m.full_name,
        properties: [] as Array<{ id: string; name: string; asking_price: number | null; cap_rate: number | null; city: string; state: string; asset_type: string }>,
      };

      for (const p of m.properties) {
        const name = p.details.property_name as string;

        const { data: existingProp } = await admin
          .from("pledged_properties")
          .select("id")
          .eq("agent_id", userId)
          .eq("property_name", name)
          .maybeSingle();

        let propertyId = existingProp?.id ?? null;
        if (propertyId) {
          // Refresh details on existing rows so older sparse seeds get enriched
          await admin
            .from("pledged_properties")
            .update({ ...p.details, status: "active" })
            .eq("id", propertyId);
        } else {
          const { data: prop, error: propErr } = await admin
            .from("pledged_properties")
            .insert({
              agent_id: userId,
              ...p.details,
              source: "agent_pledge",
              status: "active",
              listed_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          if (propErr) throw propErr;
          propertyId = prop.id;
        }

        // Financials: insert or refresh
        const { data: existingFin } = await admin
          .from("property_financials")
          .select("id")
          .eq("property_id", propertyId)
          .maybeSingle();
        if (existingFin?.id) {
          await admin
            .from("property_financials")
            .update(p.financials)
            .eq("id", existingFin.id);
        } else {
          const { error: finErr } = await admin
            .from("property_financials")
            .insert({ property_id: propertyId, ...p.financials });
          if (finErr) throw finErr;
        }

        // Images: backfill when none exist
        const { count: imgCount } = await admin
          .from("property_images")
          .select("id", { count: "exact", head: true })
          .eq("property_id", propertyId);
        if (!imgCount) {
          const { error: imgErr } = await admin.from("property_images").insert(
            p.images.map((url, i) => ({
              property_id: propertyId,
              storage_path: url,
              file_name: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i + 1}.jpg`,
              sort_order: i,
            }))
          );
          if (imgErr) throw imgErr;
        }

        agentEntry.properties.push({
          id: propertyId!,
          name,
          asking_price: p.financials.asking_price,
          cap_rate: p.financials.cap_rate,
          city: p.details.city as string,
          state: p.details.state as string,
          asset_type: p.details.asset_type as string,
        });
      }

      counterparties.push(agentEntry);
    }

    return new Response(
      JSON.stringify({ version: SEED_VERSION, counterparties }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("seed-counterparty-agents error", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
