// Demo-data seeding for 1031 Exchange Up.
//
// Actions (POST body { "action": ... }):
//   "counterparties-only" (default) - ensure mock counterparty agents exist
//     with fully enriched properties (details, financials, photo galleries).
//   "seed-all"  - full demo dataset for the CALLING agent: clients, own
//     listings (enriched), exchanges, criteria, matches, connections,
//     messages, notifications. Runs with service role because matches/
//     notifications/messages have service-only insert policies (by design).
//   "clear-all" - remove ALL of the calling agent's workspace data
//     (clients, listings, exchanges + dependents, notifications). Dev tool.
//
// seed-all / clear-all derive the target agent from the caller's JWT - a
// user can only ever seed or clear their own workspace.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SEED_VERSION = 4;
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
  prepay?: string | null;
}) {
  const noi = Math.round((opts.ask * opts.capRate) / 100);
  const otherIncome = opts.otherIncome ?? 0;
  const egi = Math.round((opts.gsi * opts.occupancy) / 100 + otherIncome);
  const expenses = Math.max(egi - noi, Math.round(egi * 0.18));
  const split = (pct: number) => Math.round(expenses * pct);
  const r = opts.loanRate / 100 / 12;
  const n = 360;
  const monthly = opts.loanBalance > 0
    ? (opts.loanBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
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
    cash_on_cash: equity > 0 ? Math.round(((noi - ads) / equity) * 1000) / 10 : null,
  };
}

function clampScore(n: number) {
  return Math.max(20, Math.min(100, Math.round(n)));
}

function factors(total: number, overrides: Record<string, number> = {}) {
  return {
    price_score: clampScore(overrides.price ?? total + 4),
    geo_score: clampScore(overrides.geo ?? total - 6),
    asset_score: clampScore(overrides.asset ?? total + 6),
    strategy_score: clampScore(overrides.strategy ?? total - 3),
    financial_score: clampScore(overrides.financial ?? total + 1),
    timing_score: clampScore(overrides.timing ?? total + 3),
    scale_fit_score: clampScore(overrides.scale ?? total - 2),
    debt_fit_score: clampScore(overrides.debt ?? total - 4),
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
          property_class: "B", property_condition: "Good - common areas renovated 2022",
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
          property_class: "B", property_condition: "Very good - roof replaced 2021",
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
          property_class: "B", property_condition: "Good - two suites in shell condition",
          construction_type: "Tilt-up concrete", roof_type: "TPO (2018)",
          hvac_type: "Split systems per suite", zoning: "LI",
          amenities: ["Grade-level doors", "14-18' clear height", "Austin MSA growth corridor"],
          recent_renovations: "Suite 4 white-boxed 2024; new monument signage.",
          description: "__mock__ Six-suite flex park in the Austin growth corridor, 88% leased with two suites ready for lease-up - in-place rents roughly 12% under market.",
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
          property_class: "B", property_condition: "Very good - new roofs 2023",
          construction_type: "Concrete block", roof_type: "Pitched shingle (2023)",
          hvac_type: "Individual split systems", zoning: "RM-16",
          amenities: ["Courtyard pool", "In-unit washer/dryer", "Gated parking"],
          recent_renovations: "All roofs replaced 2023 post-storm; 12 units upgraded 2022-2024.",
          description: "__mock__ Courtyard community a mile from Bayshore Boulevard, 95% occupied with insurance-grade roof replacements complete - a clean Florida multifamily story with renovation upside on 20 units.",
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

const OWN_PROPERTIES = [
  {
    details: {
      property_name: "Heights Multifamily 24",
      address: "2400 Heights Blvd", city: "Houston", state: "TX", zip: "77008", county: "Harris",
      asset_type: "multifamily", asset_subtype: "Low-rise walk-up",
      strategy_type: "core_plus",
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
    images: IMG.multifamilyA,
  },
  {
    details: {
      property_name: "Coral Way Retail Center",
      address: "5200 Coral Way", city: "Miami", state: "FL", zip: "33145", county: "Miami-Dade",
      asset_type: "retail", asset_subtype: "Strip center",
      strategy_type: "core",
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
      asset_type: "industrial", asset_subtype: "Warehouse",
      strategy_type: "value_add",
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
    images: IMG.industrialA,
  },
  {
    details: {
      property_name: "Triangle Office Park",
      address: "120 Research Triangle Pkwy", city: "Raleigh", state: "NC", zip: "27709", county: "Wake",
      asset_type: "office", asset_subtype: "Suburban office",
      strategy_type: "core",
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

// deno-lint-ignore no-explicit-any
type Admin = any;

async function upsertPropertyChildren(admin: Admin, propertyId: string, p: MockProperty | typeof OWN_PROPERTIES[number]) {
  const { data: existingFin } = await admin
    .from("property_financials")
    .select("id")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (existingFin?.id) {
    const { error } = await admin.from("property_financials").update(p.financials).eq("id", existingFin.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("property_financials").insert({ property_id: propertyId, ...p.financials });
    if (error) throw error;
  }

  const { count: imgCount } = await admin
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);
  if (!imgCount) {
    const name = (p.details.property_name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await admin.from("property_images").insert(
      p.images.map((url: string, i: number) => ({
        property_id: propertyId,
        storage_path: url,
        file_name: `${name}-${i + 1}.jpg`,
        sort_order: i,
      }))
    );
    if (error) throw error;
  }
}

async function ensureCounterparties(admin: Admin) {
  const out: Record<string, { agentId: string; propertyId: string }> = {};
  const counterparties: Array<{
    agent_id: string;
    email: string;
    full_name: string;
    properties: Array<{ id: string; name: string }>;
  }> = [];

  const { data: userList } = await admin.auth.admin.listUsers();

  for (const m of MOCK_AGENTS) {
    let userId: string | null =
      userList?.users.find((u: { email?: string }) => u.email === m.email)?.id ?? null;
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

    const { data: existingRole } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role", "agent")
      .maybeSingle();
    if (!existingRole) {
      const { error: roleErr } = await admin.from("user_roles").insert({ user_id: userId, role: "agent" });
      if (roleErr) throw roleErr;
    }

    const entry = { agent_id: userId!, email: m.email, full_name: m.full_name, properties: [] as Array<{ id: string; name: string }> };

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
        const { error } = await admin.from("pledged_properties").update({ ...p.details, status: "active" }).eq("id", propertyId);
        if (error) throw error;
      } else {
        const { data: prop, error } = await admin
          .from("pledged_properties")
          .insert({ agent_id: userId, ...p.details, source: "agent_pledge", status: "active", listed_at: new Date().toISOString() })
          .select("id")
          .single();
        if (error) throw error;
        propertyId = prop.id;
      }

      await upsertPropertyChildren(admin, propertyId!, p);
      entry.properties.push({ id: propertyId!, name });
      out[name] = { agentId: userId!, propertyId: propertyId! };
    }
    counterparties.push(entry);
  }

  return { byName: out, counterparties };
}

async function clearAll(admin: Admin, userId: string) {
  const { data: exchanges } = await admin.from("exchanges").select("id").eq("agent_id", userId);
  const exchangeIds = (exchanges ?? []).map((e: { id: string }) => e.id);

  if (exchangeIds.length) {
    const { data: conns } = await admin.from("exchange_connections").select("id").in("buyer_exchange_id", exchangeIds);
    const connIds = (conns ?? []).map((c: { id: string }) => c.id);
    if (connIds.length) {
      await admin.from("messages").delete().in("connection_id", connIds);
      await admin.from("exchange_connections").delete().in("id", connIds);
    }
    await admin.from("matches").delete().in("buyer_exchange_id", exchangeIds);
    await admin.from("identification_list").delete().in("exchange_id", exchangeIds);
    await admin.from("exchange_timeline").delete().in("exchange_id", exchangeIds);
    await admin.from("exchanges").update({ relinquished_property_id: null, criteria_id: null }).in("id", exchangeIds);
    await admin.from("replacement_criteria").delete().in("exchange_id", exchangeIds);
    await admin.from("exchanges").delete().in("id", exchangeIds);
  }

  const { data: props } = await admin.from("pledged_properties").select("id").eq("agent_id", userId);
  const propIds = (props ?? []).map((p: { id: string }) => p.id);
  if (propIds.length) {
    await admin.from("property_financials").delete().in("property_id", propIds);
    await admin.from("property_images").delete().in("property_id", propIds);
    await admin.from("property_documents").delete().in("property_id", propIds);
    await admin.from("pledged_properties").delete().in("id", propIds);
  }

  await admin.from("agent_clients").delete().eq("agent_id", userId);
  await admin.from("notifications").delete().eq("user_id", userId);
}

async function seedAll(admin: Admin, userId: string) {
  const { byName } = await ensureCounterparties(admin);
  const sunrise = byName["Sunrise Apartments"];
  const mesa = byName["Mesa Gateway Plaza"];
  const crosspoint = byName["Crosspoint Industrial"];
  const queenCity = byName["Queen City Medical Commons"];
  const lakeline = byName["Lakeline Flex Park"];
  const bayshore = byName["Bayshore Court Apartments"];

  // Clients
  const clientPayload = [
    { client_name: "Sarah Chen", client_email: "sarah.chen@example.com", client_phone: "555-0101", notes: `${MOCK_TAG} Repeat client - sold a duplex portfolio in 2023. Prefers TX multifamily.` },
    { client_name: "Marcus Rodriguez LLC", client_company: "Rodriguez Holdings LLC", client_email: "marcus@rodriguezllc.example", client_phone: "555-0127", notes: `${MOCK_TAG} 1031 veteran; targets stabilized multifamily or retail in the Sun Belt.` },
    { client_name: "Patel Family Trust", client_company: "Patel Family Trust", client_email: "trustee@patelfamily.example", client_phone: "555-0163", notes: `${MOCK_TAG} Trust sale; trustee wants passive, credit-tenant income. Open to medical office.` },
    { client_name: "James Wilson", client_email: "jwilson@example.com", client_phone: "555-0144", notes: `${MOCK_TAG} Selling a Phoenix warehouse; wants industrial near Austin or Charlotte.` },
    { client_name: "Aurora Holdings", client_company: "Aurora Holdings Inc.", client_email: "ops@auroraholdings.example", client_phone: "555-0188", notes: `${MOCK_TAG} Family office; in closing on a Raleigh office disposition.` },
  ].map((c) => ({ ...c, agent_id: userId, status: "active" }));

  const { data: clients, error: clientErr } = await admin.from("agent_clients").insert(clientPayload).select("id, client_name");
  if (clientErr) throw clientErr;

  // Own listings
  const { data: properties, error: propErr } = await admin
    .from("pledged_properties")
    .insert(OWN_PROPERTIES.map((p) => ({ ...p.details, agent_id: userId, source: "agent_pledge", status: "active", listed_at: new Date().toISOString() })))
    .select("id, property_name");
  if (propErr) throw propErr;

  const ownByName = (name: string) => {
    const row = properties!.find((p: { property_name: string }) => p.property_name === name);
    if (!row) throw new Error(`Own property "${name}" missing after insert`);
    return row.id;
  };

  for (const p of OWN_PROPERTIES) {
    await upsertPropertyChildren(admin, ownByName(p.details.property_name as string), p);
  }

  // Exchanges
  const exchangesPayload = [
    { client_id: clients![0].id, status: "draft" },
    {
      client_id: clients![1].id, status: "active",
      exchange_proceeds: 2_000_000, estimated_basis: 1_150_000,
      estimated_gain: 850_000, estimated_tax_liability: 212_500, estimated_equity: 2_000_000,
      sale_close_date: isoDaysAgo(20).slice(0, 10),
      identification_deadline: daysFromNow(25), closing_deadline: daysFromNow(160),
      relinquished_property_id: ownByName("Heights Multifamily 24"),
    },
    {
      client_id: clients![2].id, status: "active",
      exchange_proceeds: 2_800_000, estimated_basis: 1_600_000,
      estimated_gain: 1_200_000, estimated_tax_liability: 300_000, estimated_equity: 2_800_000,
      sale_close_date: isoDaysAgo(10).slice(0, 10),
      identification_deadline: daysFromNow(35), closing_deadline: daysFromNow(170),
      relinquished_property_id: ownByName("Coral Way Retail Center"),
    },
    {
      client_id: clients![3].id, status: "in_identification",
      exchange_proceeds: 3_400_000, estimated_basis: 2_000_000,
      estimated_gain: 1_400_000, estimated_tax_liability: 350_000, estimated_equity: 3_400_000,
      sale_close_date: isoDaysAgo(36).slice(0, 10),
      identification_deadline: daysFromNow(9), closing_deadline: daysFromNow(144),
      relinquished_property_id: ownByName("Desert Ridge Industrial"),
    },
    {
      client_id: clients![4].id, status: "in_closing",
      exchange_proceeds: 4_750_000, estimated_basis: 2_700_000,
      estimated_gain: 2_050_000, estimated_tax_liability: 512_500, estimated_equity: 4_750_000,
      sale_close_date: isoDaysAgo(60).slice(0, 10),
      identification_deadline: daysFromNow(-15), closing_deadline: daysFromNow(12),
      relinquished_property_id: ownByName("Triangle Office Park"),
    },
    {
      client_id: clients![0].id, status: "completed",
      exchange_proceeds: 1_900_000, estimated_basis: 1_050_000,
      estimated_gain: 850_000, estimated_tax_liability: 212_500, estimated_equity: 1_900_000,
      sale_close_date: isoDaysAgo(180).slice(0, 10),
      identification_deadline: isoDaysAgo(135).slice(0, 10),
      closing_deadline: isoDaysAgo(8).slice(0, 10),
      actual_close_date: isoDaysAgo(8).slice(0, 10),
    },
  ].map((e) => ({ ...e, agent_id: userId }));

  const { data: exchanges, error: exErr } = await admin.from("exchanges").insert(exchangesPayload).select("id, status, client_id");
  if (exErr) throw exErr;

  const exMarcus = exchanges![1].id;
  const exPatel = exchanges![2].id;
  const exWilson = exchanges![3].id;

  // Replacement criteria
  const criteriaPayload = [
    {
      exchange_id: exMarcus,
      target_price_min: 3_500_000, target_price_max: 5_500_000,
      target_states: ["AZ", "TX", "FL"], target_metros: ["Phoenix", "Tampa", "Austin"],
      target_asset_types: ["multifamily", "retail"],
      target_strategies: ["core_plus", "value_add"],
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
      target_asset_types: ["retail", "medical_office", "net_lease"],
      target_strategies: ["core"],
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
      target_asset_types: ["industrial"],
      target_strategies: ["core_plus", "value_add"],
      target_cap_rate_min: 6.3, target_cap_rate_max: 7.5,
      target_property_classes: ["A", "B"],
      target_sf_min: 30_000, target_sf_max: 90_000,
      target_occupancy_min: 85, must_replace_debt: true, min_debt_replacement: 1_980_000,
      open_to_dsts: false, open_to_tics: false, urgency: "immediate",
      additional_notes: `${MOCK_TAG} 45-day window closing fast - only actionable deals.`,
    },
  ];

  const { data: criteria, error: critErr } = await admin.from("replacement_criteria").insert(criteriaPayload).select("id, exchange_id");
  if (critErr) throw critErr;
  for (const c of criteria ?? []) {
    await admin.from("exchanges").update({ criteria_id: c.id }).eq("id", c.exchange_id);
  }

  // Matches
  const matchesPayload = [
    {
      buyer_exchange_id: exMarcus, seller_property_id: sunrise.propertyId,
      total_score: 94, ...factors(94, { asset: 100, geo: 96, price: 95, debt: 88 }),
      boot_status: "no_boot",
      buyer_current_roe: 0.052, candidate_roe: 0.091, roe_improvement_pp: 3.9, roe_improvement_rel: 0.75,
      candidate_annual_debt_service: 199_512, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exMarcus, seller_property_id: mesa.propertyId,
      total_score: 82, ...factors(82, { asset: 90, geo: 92, price: 64, scale: 70 }),
      boot_status: "minor_boot",
      estimated_cash_boot: 0, estimated_mortgage_boot: 130_000,
      estimated_total_boot: 130_000, estimated_boot_tax: 32_500,
      buyer_current_roe: 0.052, candidate_roe: 0.078, roe_improvement_pp: 2.6, roe_improvement_rel: 0.50,
      candidate_annual_debt_service: 93_950, buyer_agent_viewed: true, buyer_agent_viewed_at: isoDaysAgo(3), status: "active",
    },
    {
      buyer_exchange_id: exMarcus, seller_property_id: bayshore.propertyId,
      total_score: 76, ...factors(76, { asset: 95, geo: 70, price: 72, financial: 64 }),
      boot_status: "no_boot",
      buyer_current_roe: 0.052, candidate_roe: 0.071, roe_improvement_pp: 1.9, roe_improvement_rel: 0.37,
      candidate_annual_debt_service: 181_018, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exMarcus, seller_property_id: lakeline.propertyId,
      total_score: 58, ...factors(58, { asset: 30, geo: 75, price: 62, strategy: 66 }),
      boot_status: "insufficient_data",
      buyer_current_roe: 5.2, candidate_roe: null, roe_improvement_pp: null, roe_improvement_rel: null,
      buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exPatel, seller_property_id: queenCity.propertyId,
      total_score: 91, ...factors(91, { asset: 98, geo: 95, strategy: 96, price: 86 }),
      boot_status: "no_boot",
      buyer_current_roe: 0.058, candidate_roe: 0.086, roe_improvement_pp: 2.8, roe_improvement_rel: 0.48,
      candidate_annual_debt_service: 157_570, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exPatel, seller_property_id: mesa.propertyId,
      total_score: 73, ...factors(73, { asset: 84, geo: 66, price: 60, financial: 78 }),
      boot_status: "minor_boot",
      estimated_cash_boot: 95_000, estimated_mortgage_boot: 0,
      estimated_total_boot: 95_000, estimated_boot_tax: 23_750,
      buyer_current_roe: 0.058, candidate_roe: 0.072, roe_improvement_pp: 1.4, roe_improvement_rel: 0.24,
      candidate_annual_debt_service: 93_950, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exPatel, seller_property_id: crosspoint.propertyId,
      total_score: 66, ...factors(66, { asset: 38, geo: 94, financial: 80, price: 70 }),
      boot_status: "no_boot",
      buyer_current_roe: 0.058, candidate_roe: 0.079, roe_improvement_pp: 2.1, roe_improvement_rel: 0.36,
      candidate_annual_debt_service: 119_369, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exWilson, seller_property_id: crosspoint.propertyId,
      total_score: 88, ...factors(88, { asset: 100, geo: 84, timing: 95, price: 90 }),
      boot_status: "no_boot",
      buyer_current_roe: 0.061, candidate_roe: 0.089, roe_improvement_pp: 2.8, roe_improvement_rel: 0.46,
      candidate_annual_debt_service: 119_369, buyer_agent_viewed: true, buyer_agent_viewed_at: isoDaysAgo(1), status: "active",
    },
    {
      buyer_exchange_id: exWilson, seller_property_id: lakeline.propertyId,
      total_score: 84, ...factors(84, { asset: 96, geo: 90, strategy: 88, financial: 72 }),
      boot_status: "minor_boot",
      estimated_cash_boot: 145_000, estimated_mortgage_boot: 0,
      estimated_total_boot: 145_000, estimated_boot_tax: 36_250,
      buyer_current_roe: 0.061, candidate_roe: 0.094, roe_improvement_pp: 3.3, roe_improvement_rel: 0.54,
      candidate_annual_debt_service: 116_793, buyer_agent_viewed: false, status: "active",
    },
    {
      buyer_exchange_id: exWilson, seller_property_id: bayshore.propertyId,
      total_score: 47, ...factors(47, { asset: 22, geo: 40, timing: 70, strategy: 55 }),
      boot_status: "insufficient_data",
      buyer_current_roe: 6.1, candidate_roe: null, roe_improvement_pp: null, roe_improvement_rel: null,
      buyer_agent_viewed: false, status: "active",
    },
  ];

  const { data: matches, error: matchErr } = await admin.from("matches").insert(matchesPayload).select("id, buyer_exchange_id, seller_property_id");
  if (matchErr) throw matchErr;

  const matchFor = (exchangeId: string, propertyId: string) =>
    matches!.find((m: { buyer_exchange_id: string; seller_property_id: string }) =>
      m.buyer_exchange_id === exchangeId && m.seller_property_id === propertyId)!;

  // Connections
  const connectionsPayload = [
    {
      match_id: matchFor(exMarcus, sunrise.propertyId).id,
      buyer_agent_id: userId,
      seller_agent_id: sunrise.agentId,
      buyer_exchange_id: exMarcus,
      seller_exchange_id: null,
      status: "pending",
      initiated_by: "seller_agent",
      facilitation_fee_agreed: false,
      facilitation_fee_status: "pending",


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
      facilitation_fee_status: "pending",
    },
  ];

  const { data: connections, error: connErr } = await admin.from("exchange_connections").insert(connectionsPayload).select("id, status");
  if (connErr) throw connErr;

  // Messages on the accepted connection
  const acceptedConn = connections!.find((c: { status: string }) => c.status === "accepted");
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
    const { error: msgErr } = await admin.from("messages").insert(messagesPayload);
    if (msgErr) throw msgErr;
  }

  // Notifications
  const notifPayload = [
    { user_id: userId, type: "new_match",           title: "Strong new match - score 94",      message: "Sunrise Apartments (Phoenix, AZ) matched Marcus Rodriguez LLC's exchange.",         link_to: "/agent/matches",  read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "new_match",           title: "Strong new match - score 91",      message: "Queen City Medical Commons matched the Patel Family Trust exchange.",               link_to: "/agent/matches",  read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "connection_request",  title: "Connection request",               message: "Jordan Alvarez (Alvarez Commercial Group) wants to connect on Sunrise Apartments.", link_to: "/agent/pipeline", read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "connection_accepted", title: "Connection accepted",               message: "Priya Mehta accepted your connection on Crosspoint Industrial.",                    link_to: "/agent/pipeline", read: true,  metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "deadline_critical",   title: "Identification deadline - 9 days", message: "James Wilson's 45-day identification window closes soon.",                          link_to: "/agent/pipeline", read: false, metadata: { tag: MOCK_TAG } },
    { user_id: userId, type: "deadline_warning",    title: "Closing deadline - 12 days",       message: "Aurora Holdings' exchange must close within 12 days.",                              link_to: "/agent/pipeline", read: false, metadata: { tag: MOCK_TAG } },
  ];
  const { error: notifErr } = await admin.from("notifications").insert(notifPayload);
  if (notifErr) throw notifErr;

  return {
    clients: clients!.length,
    properties: properties!.length,
    exchanges: exchanges!.length,
    matches: matches!.length,
    connections: connections!.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let action = "counterparties-only";
    let targetUserId: string | null = null;
    try {
      const body = await req.json();
      if (body?.action) action = body.action;
      if (body?.target_user_id) targetUserId = body.target_user_id;
    } catch {
      // empty body - default action
    }

    if (action === "seed-all" || action === "clear-all") {
      const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
      let callerId: string | null = null;
      // Decode JWT payload (no verification - gateway already verified)
      let jwtRole: string | null = null;
      try {
        const payload = jwt.split(".")[1];
        if (payload) {
          const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
          jwtRole = decoded?.role ?? null;
        }
      } catch { /* not a JWT */ }
      if (targetUserId && jwtRole === "service_role") {
        callerId = targetUserId;
      } else {


        const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
        const caller = userData?.user;
        if (userErr || !caller) {
          return new Response(JSON.stringify({ version: SEED_VERSION, error: "Not authenticated" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        callerId = caller.id;
      }

      if (action === "clear-all") {
        await clearAll(admin, callerId!);
        return new Response(JSON.stringify({ version: SEED_VERSION, cleared: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await clearAll(admin, callerId!);
      const counts = await seedAll(admin, callerId!);
      return new Response(JSON.stringify({ version: SEED_VERSION, seeded: counts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const { counterparties } = await ensureCounterparties(admin);
    return new Response(JSON.stringify({ version: SEED_VERSION, counterparties }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("seed-counterparty-agents error", err);
    // Postgres errors from supabase-js are plain objects - serialize fully
    const detail = err instanceof Error
      ? err.message
      : (() => { try { return JSON.stringify(err); } catch { return String(err); } })();
    return new Response(
      JSON.stringify({ error: detail }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
