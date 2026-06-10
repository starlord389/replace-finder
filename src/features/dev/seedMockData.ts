import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AssetType = Database["public"]["Enums"]["asset_type"];
type StrategyType = Database["public"]["Enums"]["strategy_type"];

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

const IMG = {
  multifamily: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=75&auto=format&fit=crop",
  ],
  office: [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&q=75&auto=format&fit=crop",
  ],
  industrial: [
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553413077-190dd305871c?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=1600&q=75&auto=format&fit=crop",
  ],
  retail: [
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=75&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605902711622-cfb43c4437b5?w=1600&q=75&auto=format&fit=crop",
  ],
};

/** Coherent financials: NOI derives from ask x cap; expenses reconcile to EGI - NOI. */
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
}) {
  const noi = Math.round((opts.ask * opts.capRate) / 100);
  const otherIncome = opts.otherIncome ?? 0;
  const egi = Math.round((opts.gsi * opts.occupancy) / 100 + otherIncome);
  const expenses = Math.max(egi - noi, Math.round(egi * 0.18));
  const split = (pct: number) => Math.round(expenses * pct);
  const r = opts.loanRate / 100 / 12;
  const monthly = opts.loanBalance > 0
    ? (opts.loanBalance * r * Math.pow(1 + r, 360)) / (Math.pow(1 + r, 360) - 1)
    : 0;
  const ads = Math.round(monthly * 12);
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
    real_estate_taxes: split(0.3),
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
    has_prepayment_penalty: false,
    prepayment_penalty_details: null,
    cash_on_cash: equity > 0 ? Math.round(((noi - ads) / equity) * 1000) / 10 : null,
  };
}

function clamp(n: number) {
  return Math.max(20, Math.min(100, Math.round(n)));
}

/** Factor scores clustered around the total, with explicit overrides. */
function factors(total: number, overrides: Partial<Record<
  "price" | "geo" | "asset" | "strategy" | "financial" | "timing" | "scale" | "debt",
  number
>> = {}) {
  return {
    price_score: clamp(overrides.price ?? total + 4),
    geo_score: clamp(overrides.geo ?? total - 6),
    asset_score: clamp(overrides.asset ?? total + 6),
    strategy_score: clamp(overrides.strategy ?? total - 3),
    financial_score: clamp(overrides.financial ?? total + 1),
    timing_score: clamp(overrides.timing ?? total + 3),
    scale_fit_score: clamp(overrides.scale ?? total - 2),
    debt_fit_score: clamp(overrides.debt ?? total - 4),
  };
}

type CounterpartyAgent = {
  agent_id: string;
  email: string;
  full_name: string;
  properties: Array<{ id: string; name: string }>;
};

export async function seedAgentMockData(userId: string) {
  // 1) Counter-party agents + enriched properties via edge function
  const { data: cpData, error: cpErr } = await supabase.functions.invoke(
    "seed-counterparty-agents"
  );
  if (cpErr) throw cpErr;
  if (cpData?.version !== 2) {
    throw new Error(
      "The seed-counterparty-agents function on the server is outdated. " +
      "Push the latest code and redeploy edge functions, then try again."
    );
  }
  const agents: CounterpartyAgent[] = cpData?.counterparties ?? [];
  const findProp = (name: string) => {
    for (const a of agents) {
      const p = a.properties.find((x) => x.name === name);
      if (p) return { agentId: a.agent_id, propertyId: p.id };
    }
    throw new Error(`Counterparty property "${name}" missing from seed response`);
  };
  const sunrise = findProp("Sunrise Apartments");
  const mesa = findProp("Mesa Gateway Plaza");
  const crosspoint = findProp("Crosspoint Industrial");
  const queenCity = findProp("Queen City Medical Commons");
  const lakeline = findProp("Lakeline Flex Park");
  const bayshore = findProp("Bayshore Court Apartments");

  // 2) Clients
  const clientPayload = [
    { client_name: "Sarah Chen", client_email: "sarah.chen@example.com", client_phone: "555-0101", notes: `${MOCK_TAG} Repeat client - sold a duplex portfolio in 2023. Prefers TX multifamily.` },
    { client_name: "Marcus Rodriguez LLC", client_company: "Rodriguez Holdings LLC", client_email: "marcus@rodriguezllc.example", client_phone: "555-0127", notes: `${MOCK_TAG} 1031 veteran; targets stabilized multifamily or retail in the Sun Belt.` },
    { client_name: "Patel Family Trust", client_company: "Patel Family Trust", client_email: "trustee@patelfamily.example", client_phone: "555-0163", notes: `${MOCK_TAG} Trust sale; trustee wants passive, credit-tenant income. Open to medical office.` },
    { client_name: "James Wilson", client_email: "jwilson@example.com", client_phone: "555-0144", notes: `${MOCK_TAG} Selling a Phoenix warehouse; wants industrial near Austin or Charlotte.` },
    { client_name: "Aurora Holdings", client_company: "Aurora Holdings Inc.", client_email: "ops@auroraholdings.example", client_phone: "555-0188", notes: `${MOCK_TAG} Family office; in closing on a Raleigh office disposition.` },
  ].map((c) => ({ ...c, agent_id: userId, status: "active" }));

  const { data: clients, error: clientErr } = await supabase
    .from("agent_clients")
    .insert(clientPayload)
    .select("id, client_name");
  if (clientErr) throw clientErr;

  // 3) Own listings - fully detailed, with financials + photos
  const ownProperties = [
    {
      details: {
        property_name: "Heights Multifamily 24",
        address: "2400 Heights Blvd", city: "Houston", state: "TX", zip: "77008", county: "Harris",
        asset_type: "multifamily" as const, asset_subtype: "Low-rise walk-up",
        strategy_type: "core_plus" as const,
        units: 24, year_built: 2005, building_square_footage: 22800,
        land_area_acres: 1.1, num_buildings: 2, num_stories: 2,
        parking_spaces: 40, parking_type: "Surface, gated",
        property_class: "B", property_condition: "Good",
        construction_type: "Wood frame", roof_type: "Pitched shingle (2020)",
        hvac_type: "Individual split systems", zoning: "MF-1",
        amenities: ["Gated parking", "On-site laundry", "Walkable Heights location"],
        recent_renovations: "14 units updated 2021-2023.",
        description: `${MOCK_TAG} 24-unit walk-up in Houston Heights pledged by Rodriguez Holdings as the relinquished asset for their exchange.`,
      },
      financials: buildFinancials({ ask: 3_450_000, capRate: 5.7, gsi: 412_000, occupancy: 95, otherIncome: 9_000, avgRent: 1430, loanBalance: 1_450_000, loanRate: 4.9, loanType: "Fixed 10-yr (2021)", loanMaturity: "2031-07-01" }),
      images: IMG.multifamily,
    },
    {
      details: {
        property_name: "Coral Way Retail Center",
        address: "5200 Coral Way", city: "Miami", state: "FL", zip: "33145", county: "Miami-Dade",
        asset_type: "retail" as const, asset_subtype: "Strip center",
        strategy_type: "core" as const,
        units: 8, year_built: 2010, building_square_footage: 18500,
        land_area_acres: 1.4, num_buildings: 1, num_stories: 1,
        parking_spaces: 62, parking_type: "Surface",
        property_class: "A", property_condition: "Excellent",
        construction_type: "CBS", roof_type: "TPO (2022)",
        hvac_type: "Rooftop package units", zoning: "C-1",
        amenities: ["Credit anchor tenant", "Hard corner", "Hurricane-rated glazing"],
        recent_renovations: "Facade refresh and TPO roof 2022.",
        description: `${MOCK_TAG} Eight-suite Coral Way strip center pledged by the Patel Family Trust as their relinquished asset.`,
      },
      financials: buildFinancials({ ask: 2_900_000, capRate: 6.1, gsi: 271_000, occupancy: 100, otherIncome: 0, avgRent: null, loanBalance: 1_220_000, loanRate: 5.1, loanType: "Fixed 7-yr", loanMaturity: "2030-02-01" }),
      images: IMG.retail,
    },
    {
      details: {
        property_name: "Desert Ridge Industrial",
        address: "9100 N Desert Ridge Dr", city: "Phoenix", state: "AZ", zip: "85054", county: "Maricopa",
        asset_type: "industrial" as const, asset_subtype: "Warehouse",
        strategy_type: "value_add" as const,
        units: 1, year_built: 2001, building_square_footage: 65000,
        land_area_acres: 4.2, num_buildings: 1, num_stories: 1,
        parking_spaces: 48, parking_type: "Surface + yard",
        property_class: "B", property_condition: "Good - roof mid-life",
        construction_type: "Tilt-up concrete", roof_type: "Built-up (2016)",
        hvac_type: "Evap-cooled warehouse, office split", zoning: "I-1",
        amenities: ["20' clear height", "6 dock doors", "Fenced yard"],
        recent_renovations: "Office area remodeled 2022.",
        description: `${MOCK_TAG} Single-tenant Phoenix warehouse pledged by James Wilson; lease expires in 14 months, driving his exchange timeline.`,
      },
      financials: buildFinancials({ ask: 3_750_000, capRate: 6.9, gsi: 312_000, occupancy: 100, otherIncome: 0, avgRent: null, loanBalance: 1_980_000, loanRate: 5.6, loanType: "Fixed 5-yr", loanMaturity: "2028-11-01" }),
      images: IMG.industrial,
    },
    {
      details: {
        property_name: "Triangle Office Park",
        address: "120 Research Triangle Pkwy", city: "Raleigh", state: "NC", zip: "27709", county: "Wake",
        asset_type: "office" as const, asset_subtype: "Suburban office",
        strategy_type: "core" as const,
        units: 1, year_built: 2015, building_square_footage: 48000,
        land_area_acres: 3.8, num_buildings: 1, num_stories: 3,
        parking_spaces: 180, parking_type: "Surface",
        property_class: "A", property_condition: "Excellent",
        construction_type: "Steel frame", roof_type: "Modified bitumen",
        hvac_type: "VAV rooftop units", zoning: "O&I-1",
        amenities: ["RTP location", "Conference center", "EV charging"],
        recent_renovations: "Lobby modernization 2023.",
        description: `${MOCK_TAG} Class A office near Research Triangle Park pledged by Aurora Holdings; their replacement purchase is in closing.`,
      },
      financials: buildFinancials({ ask: 4_400_000, capRate: 6.5, gsi: 438_000, occupancy: 92, otherIncome: 14_000, avgRent: null, loanBalance: 2_340_000, loanRate: 5.3, loanType: "Fixed 10-yr", loanMaturity: "2032-05-01" }),
      images: IMG.office,
    },
  ];

  const { data: properties, error: propErr } = await supabase
    .from("pledged_properties")
    .insert(ownProperties.map((p) => ({
      ...p.details,
      agent_id: userId,
      status: "active" as const,
      listed_at: new Date().toISOString(),
    })))
    .select("id, property_name");
  if (propErr) throw propErr;

  const ownByName = (name: string) => {
    const row = properties!.find((p) => p.property_name === name);
    if (!row) throw new Error(`Own property "${name}" missing after insert`);
    return row.id;
  };

  // Financials + images for own listings (allowed by RLS for own properties)
  const { error: ownFinErr } = await supabase.from("property_financials").insert(
    ownProperties.map((p) => ({
      property_id: ownByName(p.details.property_name),
      ...p.financials,
    }))
  );
  if (ownFinErr) throw ownFinErr;

  const { error: ownImgErr } = await supabase.from("property_images").insert(
    ownProperties.flatMap((p) =>
      p.images.map((url, i) => ({
        property_id: ownByName(p.details.property_name),
        storage_path: url,
        file_name: `${(p.details.property_name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i + 1}.jpg`,
        sort_order: i,
      }))
    )
  );
  if (ownImgErr) throw ownImgErr;

  // 4) Exchanges across the full lifecycle
  const exchangesPayload = [
    { client_id: clients![0].id, status: "draft" as const },
    {
      client_id: clients![1].id, status: "active" as const,
      exchange_proceeds: 2_000_000, estimated_basis: 1_150_000,
      estimated_gain: 850_000, estimated_tax_liability: 212_500, estimated_equity: 2_000_000,
      sale_close_date: isoDaysAgo(20).slice(0, 10),
      identification_deadline: daysFromNow(25), closing_deadline: daysFromNow(160),
      relinquished_property_id: ownByName("Heights Multifamily 24"),
    },
    {
      client_id: clients![2].id, status: "active" as const,
      exchange_proceeds: 2_800_000, estimated_basis: 1_600_000,
      estimated_gain: 1_200_000, estimated_tax_liability: 300_000, estimated_equity: 2_800_000,
      sale_close_date: isoDaysAgo(10).slice(0, 10),
      identification_deadline: daysFromNow(35), closing_deadline: daysFromNow(170),
      relinquished_property_id: ownByName("Coral Way Retail Center"),
    },
    {
      client_id: clients![3].id, status: "in_identification" as const,
      exchange_proceeds: 3_400_000, estimated_basis: 2_000_000,
      estimated_gain: 1_400_000, estimated_tax_liability: 350_000, estimated_equity: 3_400_000,
      sale_close_date: isoDaysAgo(36).slice(0, 10),
      identification_deadline: daysFromNow(9), closing_deadline: daysFromNow(144),
      relinquished_property_id: ownByName("Desert Ridge Industrial"),
    },
    {
      client_id: clients![4].id, status: "in_closing" as const,
      exchange_proceeds: 4_750_000, estimated_basis: 2_700_000,
      estimated_gain: 2_050_000, estimated_tax_liability: 512_500, estimated_equity: 4_750_000,
      sale_close_date: isoDaysAgo(60).slice(0, 10),
      identification_deadline: daysFromNow(-15), closing_deadline: daysFromNow(12),
      relinquished_property_id: ownByName("Triangle Office Park"),
    },
    {
      client_id: clients![0].id, status: "completed" as const,
      exchange_proceeds: 1_900_000, estimated_basis: 1_050_000,
      estimated_gain: 850_000, estimated_tax_liability: 212_500, estimated_equity: 1_900_000,
      sale_close_date: isoDaysAgo(180).slice(0, 10),
      identification_deadline: isoDaysAgo(135).slice(0, 10),
      closing_deadline: isoDaysAgo(8).slice(0, 10),
      actual_close_date: isoDaysAgo(8).slice(0, 10),
    },
  ].map((e) => ({ ...e, agent_id: userId }));

  const { data: exchanges, error: exErr } = await supabase
    .from("exchanges")
    .insert(exchangesPayload)
    .select("id, status, client_id");
  if (exErr) throw exErr;

  const exMarcus = exchanges![1].id;
  const exPatel = exchanges![2].id;
  const exWilson = exchanges![3].id;

  // 5) Replacement criteria for the three searching exchanges
  const criteriaPayload = [
    {
      exchange_id: exMarcus,
      target_price_min: 3_500_000, target_price_max: 5_500_000,
      target_states: ["AZ", "TX", "FL"], target_metros: ["Phoenix", "Tampa", "Austin"],
      target_asset_types: ["multifamily", "retail"] as AssetType[],
      target_strategies: ["core_plus", "value_add"] as StrategyType[],
      target_cap_rate_min: 5.5, target_cap_rate_max: 7.0,
      target_property_classes: ["A", "B"],
      target_units_min: 20, target_units_max: 80,
      target_occupancy_min: 88, must_replace_debt: true, min_debt_replacement: 1_450_000,
      open_to_dsts: false, open_to_tics: false, urgency: "standard",
      additional_notes: `${MOCK_TAG} Client wants stabilized Sun Belt assets with assumable debt if possible.`,
    },
    {
      exchange_id: exPatel,
      target_price_min: 3_000_000, target_price_max: 5_000_000,
      target_states: ["NC", "FL", "AZ"], target_metros: ["Charlotte", "Raleigh", "Miami"],
      target_asset_types: ["retail", "medical_office", "net_lease"] as AssetType[],
      target_strategies: ["core"] as StrategyType[],
      target_cap_rate_min: 5.8, target_cap_rate_max: 6.8,
      target_property_classes: ["A"],
      target_occupancy_min: 92, must_replace_debt: true, min_debt_replacement: 1_220_000,
      open_to_dsts: true, open_to_tics: false, urgency: "standard",
      additional_notes: `${MOCK_TAG} Trustee prioritizes passive, credit-tenant income.`,
    },
    {
      exchange_id: exWilson,
      target_price_min: 2_500_000, target_price_max: 4_500_000,
      target_states: ["TX", "NC", "AZ"], target_metros: ["Austin", "Charlotte"],
      target_asset_types: ["industrial"] as AssetType[],
      target_strategies: ["core_plus", "value_add"] as StrategyType[],
      target_cap_rate_min: 6.3, target_cap_rate_max: 7.5,
      target_property_classes: ["A", "B"],
      target_sf_min: 30_000, target_sf_max: 90_000,
      target_occupancy_min: 85, must_replace_debt: true, min_debt_replacement: 1_980_000,
      open_to_dsts: false, open_to_tics: false, urgency: "urgent",
      additional_notes: `${MOCK_TAG} 45-day window closing fast - only actionable deals.`,
    },
  ];

  const { data: criteria, error: critErr } = await supabase
    .from("replacement_criteria")
    .insert(criteriaPayload)
    .select("id, exchange_id");
  if (critErr) throw critErr;

  for (const c of criteria ?? []) {
    await supabase.from("exchanges").update({ criteria_id: c.id }).eq("id", c.exchange_id);
  }

  // 6) Matches - varied scores with coherent factor breakdowns and analytics
  const matchesPayload = [
    // Marcus Rodriguez LLC (multifamily/retail, AZ/TX/FL)
    {
      buyer_exchange_id: exMarcus, seller_property_id: sunrise.propertyId,
      total_score: 94, ...factors(94, { asset: 100, geo: 96, price: 95, debt: 88 }),
      boot_status: "no_boot" as const,
      buyer_current_roe: 5.2, candidate_roe: 9.1, roe_improvement_pp: 3.9, roe_improvement_rel: 75,
      candidate_annual_debt_service: 199_512, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exMarcus, seller_property_id: mesa.propertyId,
      total_score: 82, ...factors(82, { asset: 90, geo: 92, price: 64, scale: 70 }),
      boot_status: "minor_boot" as const,
      estimated_cash_boot: 0, estimated_mortgage_boot: 130_000,
      estimated_total_boot: 130_000, estimated_boot_tax: 32_500,
      buyer_current_roe: 5.2, candidate_roe: 7.8, roe_improvement_pp: 2.6, roe_improvement_rel: 50,
      candidate_annual_debt_service: 93_950, buyer_agent_viewed: true, buyer_agent_viewed_at: isoDaysAgo(3), status: "active",
    },
    {
      buyer_exchange_id: exMarcus, seller_property_id: bayshore.propertyId,
      total_score: 76, ...factors(76, { asset: 95, geo: 70, price: 72, financial: 64 }),
      boot_status: "no_boot" as const,
      buyer_current_roe: 5.2, candidate_roe: 7.1, roe_improvement_pp: 1.9, roe_improvement_rel: 37,
      candidate_annual_debt_service: 181_018, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exMarcus, seller_property_id: lakeline.propertyId,
      total_score: 58, ...factors(58, { asset: 30, geo: 75, price: 62, strategy: 66 }),
      boot_status: "insufficient_data" as const,
      buyer_current_roe: 5.2, candidate_roe: null, roe_improvement_pp: null, roe_improvement_rel: null,
      buyer_agent_viewed: false, status: "active",
    },
    // Patel Family Trust (retail/medical, NC/FL/AZ)
    {
      buyer_exchange_id: exPatel, seller_property_id: queenCity.propertyId,
      total_score: 91, ...factors(91, { asset: 98, geo: 95, strategy: 96, price: 86 }),
      boot_status: "no_boot" as const,
      buyer_current_roe: 5.8, candidate_roe: 8.6, roe_improvement_pp: 2.8, roe_improvement_rel: 48,
      candidate_annual_debt_service: 157_570, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exPatel, seller_property_id: mesa.propertyId,
      total_score: 73, ...factors(73, { asset: 84, geo: 66, price: 60, financial: 78 }),
      boot_status: "minor_boot" as const,
      estimated_cash_boot: 95_000, estimated_mortgage_boot: 0,
      estimated_total_boot: 95_000, estimated_boot_tax: 23_750,
      buyer_current_roe: 5.8, candidate_roe: 7.2, roe_improvement_pp: 1.4, roe_improvement_rel: 24,
      candidate_annual_debt_service: 93_950, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exPatel, seller_property_id: crosspoint.propertyId,
      total_score: 66, ...factors(66, { asset: 38, geo: 94, financial: 80, price: 70 }),
      boot_status: "no_boot" as const,
      buyer_current_roe: 5.8, candidate_roe: 7.9, roe_improvement_pp: 2.1, roe_improvement_rel: 36,
      candidate_annual_debt_service: 119_369, buyer_agent_viewed: false, status: "active",
    },
    // James Wilson (industrial, TX/NC/AZ - urgent)
    {
      buyer_exchange_id: exWilson, seller_property_id: crosspoint.propertyId,
      total_score: 88, ...factors(88, { asset: 100, geo: 84, timing: 95, price: 90 }),
      boot_status: "no_boot" as const,
      buyer_current_roe: 6.1, candidate_roe: 8.9, roe_improvement_pp: 2.8, roe_improvement_rel: 46,
      candidate_annual_debt_service: 119_369, buyer_agent_viewed: true, buyer_agent_viewed_at: isoDaysAgo(1), status: "active",
    },
    {
      buyer_exchange_id: exWilson, seller_property_id: lakeline.propertyId,
      total_score: 84, ...factors(84, { asset: 96, geo: 90, strategy: 88, financial: 72 }),
      boot_status: "minor_boot" as const,
      estimated_cash_boot: 145_000, estimated_mortgage_boot: 0,
      estimated_total_boot: 145_000, estimated_boot_tax: 36_250,
      buyer_current_roe: 6.1, candidate_roe: 9.4, roe_improvement_pp: 3.3, roe_improvement_rel: 54,
      candidate_annual_debt_service: 116_793, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exWilson, seller_property_id: bayshore.propertyId,
      total_score: 47, ...factors(47, { asset: 22, geo: 40, timing: 70, strategy: 55 }),
      boot_status: "insufficient_data" as const,
      buyer_current_roe: 6.1, candidate_roe: null, roe_improvement_pp: null, roe_improvement_rel: null,
      buyer_agent_viewed: false, status: "active",
    },
  ];

  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .insert(matchesPayload)
    .select("id, buyer_exchange_id, seller_property_id");
  if (matchErr) throw matchErr;

  const matchFor = (exchangeId: string, propertyId: string) =>
    matches!.find((m) => m.buyer_exchange_id === exchangeId && m.seller_property_id === propertyId)!;

  // 7) Connections - one pending inbound, one accepted with a live thread
  const connectionsPayload = [
    {
      match_id: matchFor(exMarcus, sunrise.propertyId).id,
      buyer_agent_id: userId,
      seller_agent_id: sunrise.agentId,
      buyer_exchange_id: exMarcus,
      seller_exchange_id: null,
      status: "pending",
      initiated_by: "seller_agent",
    },
    {
      match_id: matchFor(exWilson, crosspoint.propertyId).id,
      buyer_agent_id: userId,
      seller_agent_id: crosspoint.agentId,
      buyer_exchange_id: exWilson,
      seller_exchange_id: null,
      status: "accepted",
      initiated_by: "buyer_agent",
      accepted_at: isoDaysAgo(2),
      facilitation_fee_agreed: true,
      facilitation_fee_status: "acknowledged",
    },
  ];

  const { data: connections, error: connErr } = await supabase
    .from("exchange_connections")
    .insert(connectionsPayload)
    .select("id, status");
  if (connErr) throw connErr;

  // 8) Messages on the accepted connection
  const acceptedConn = connections!.find((c) => c.status === "accepted");
  if (acceptedConn) {
    const cp = crosspoint.agentId;
    const messagesPayload = [
      { connection_id: acceptedConn.id, sender_id: cp, content: "Thanks for connecting - Crosspoint is a great fit for an industrial 1031. Happy to share the OM." },
      { connection_id: acceptedConn.id, sender_id: userId, content: "Appreciate it. My client is on a 9-day identification clock, so speed matters. Can you send the T-12 and rent roll too?" },
      { connection_id: acceptedConn.id, sender_id: cp, content: "Sending all three now. Tenant has 6 years left with 2.5% bumps, and the loan is assumable at 5.4% if that helps your debt replacement." },
      { connection_id: acceptedConn.id, sender_id: userId, content: "That assumable note could seal it - his relinquished debt is $1.98M. Reviewing with him this afternoon." },
      { connection_id: acceptedConn.id, sender_id: cp, content: "Great. Seller can accommodate a 30-day close if you ID this week. Tours available Thursday or Friday." },
      { connection_id: acceptedConn.id, sender_id: userId, content: "Booking Thursday 10am. If the walkthrough goes well we'll put Crosspoint at position 1 on his ID list." },
    ];
    const { error: msgErr } = await supabase.from("messages").insert(messagesPayload);
    if (msgErr) throw msgErr;
  }

  // 9) Notifications
  const notifPayload = [
    { user_id: userId, type: "new_match",           title: "Strong new match - score 94",          message: "Sunrise Apartments (Phoenix, AZ) matched Marcus Rodriguez LLC's exchange.",      link_to: "/agent/matches",      read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "new_match",           title: "Strong new match - score 91",          message: "Queen City Medical Commons matched the Patel Family Trust exchange.",            link_to: "/agent/matches",      read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "connection_request",  title: "Connection request",                   message: "Jordan Alvarez (Alvarez Commercial Group) wants to connect on Sunrise Apartments.", link_to: "/agent/pipeline", read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "connection_accepted", title: "Connection accepted",                  message: "Priya Mehta accepted your connection on Crosspoint Industrial.",                 link_to: "/agent/pipeline",     read: true,  metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "deadline_critical",   title: "Identification deadline - 9 days",     message: "James Wilson's 45-day identification window closes soon.",                       link_to: "/agent/pipeline",     read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "deadline_warning",    title: "Closing deadline - 12 days",           message: "Aurora Holdings' exchange must close within 12 days.",                           link_to: "/agent/pipeline",     read: false, metadata: { tag: MOCK_TAG } },
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
