// Demo fixture data for the Massachusetts-only demo workspace.
//
// Everything here is pure data + pure helpers so the same definitions can be
// validated by unit tests (node/vitest) and consumed by the Deno edge function.
//
// Rules enforced by this module:
//  - every seeded property is in MA, has a ZIP, and is priced $500K-$8M;
//  - property labels are retired: `property_name` is always null and fixtures
//    are addressed by a stable internal key (e.g. "worcester_multifamily");
//  - clients are individual people, never trusts/funds/holding companies.

export const MIN_ASKING_PRICE = 500_000;
export const MAX_ASKING_PRICE = 8_000_000;

export const IMG = {
  mf: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=75&auto=format&fit=crop",
  retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=75&auto=format&fit=crop",
  industrial: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=75&auto=format&fit=crop",
  medical: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=75&auto=format&fit=crop",
  office: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=75&auto=format&fit=crop",
};

export interface DemoFinancials {
  asking_price: number;
  cap_rate: number;
  noi: number;
  gross_rent_roll: number;
  total_operating_expenses: number;
  annual_revenue: number;
  annual_expenses: number;
  occupancy_rate: number;
  loan_balance: number;
  loan_rate: number;
  loan_type: string;
  loan_maturity_date: string;
  annual_debt_service: number;
}

/**
 * Coherent financials for the current listing form:
 *   noi = gross_rent_roll - total_operating_expenses
 *   cap_rate = noi / asking_price * 100
 *   annual_debt_service = 12 x a real 30-year amortized monthly payment.
 */
export function fin(o: {
  ask: number;
  cap: number;
  gross: number;
  occ: number;
  loan: number;
  rate: number;
  maturity: string;
}): DemoFinancials {
  const noi = Math.round(o.ask * o.cap / 100);
  const expenses = Math.max(o.gross - noi, 0);
  const r = o.rate / 100 / 12;
  const monthly = o.loan > 0 ? (o.loan * r * Math.pow(1 + r, 360)) / (Math.pow(1 + r, 360) - 1) : 0;
  return {
    asking_price: o.ask,
    cap_rate: o.cap,
    noi,
    gross_rent_roll: o.gross,
    total_operating_expenses: expenses,
    annual_revenue: o.gross,
    annual_expenses: expenses,
    occupancy_rate: o.occ,
    loan_balance: o.loan,
    loan_rate: o.rate,
    loan_type: o.loan > 0 ? "Fixed-rate" : "Free & clear",
    loan_maturity_date: o.maturity,
    annual_debt_service: Math.round(monthly * 12),
  };
}

export interface DemoProperty {
  key: string;
  address: string;
  address_is_public: boolean;
  city: string;
  state: string;
  zip: string;
  county: string;
  unit_suite?: string | null;
  asset_type: string;
  asset_subtype: string;
  strategy_type: string;
  property_class: string;
  property_condition: string;
  year_built: number;
  units: number;
  sf: number;
  land_area_acres: number;
  num_buildings: number;
  num_stories: number;
  parking_spaces: number;
  parking_type: string;
  construction_type: string;
  roof_type: string;
  hvac_type: string;
  zoning: string;
  amenities: string[];
  description: string;
  recent_renovations: string;
  f: DemoFinancials;
  img: string;
}

/** Throws before any insert if a fixture violates the MA-only / price rules. */
export function assertValidDemoProperty(p: DemoProperty): void {
  if (p.state !== "MA") throw new Error(`Demo property ${p.key} is not in MA (state=${p.state})`);
  if (!p.zip || !/^\d{5}$/.test(p.zip)) throw new Error(`Demo property ${p.key} is missing a valid ZIP`);
  if (!p.city) throw new Error(`Demo property ${p.key} is missing a city`);
  if (!p.address) throw new Error(`Demo property ${p.key} is missing a street address`);
  const price = p.f?.asking_price;
  if (typeof price !== "number" || price < MIN_ASKING_PRICE || price > MAX_ASKING_PRICE) {
    throw new Error(
      `Demo property ${p.key} asking price ${price} is outside $${MIN_ASKING_PRICE}-$${MAX_ASKING_PRICE}`,
    );
  }
  const derivedNoi = p.f.gross_rent_roll - p.f.total_operating_expenses;
  if (derivedNoi !== p.f.noi) throw new Error(`Demo property ${p.key} income statement does not reconcile`);
}

/** Listing text: exact street address when public, otherwise "City, MA ZIP". */
export function displayLocation(p: DemoProperty): string {
  return p.address_is_public
    ? `${p.address}, ${p.city}, ${p.state} ${p.zip}`
    : `${p.city}, ${p.state} ${p.zip}`;
}

// ── Shared counterparty network: MA agents + their active candidate listings ──
export const COUNTERPARTIES: Array<{
  email: string;
  full_name: string;
  brokerage_name: string;
  properties: DemoProperty[];
}> = [
  {
    email: "demo.agent.alvarez@replacefinder.test",
    full_name: "Jordan Alvarez",
    brokerage_name: "Alvarez Commercial Group",
    properties: [
      {
        key: "worcester_multifamily",
        address: "145 Russell St", address_is_public: true, city: "Worcester", state: "MA", zip: "01609", county: "Worcester",
        asset_type: "multifamily", asset_subtype: "Triple-decker portfolio", strategy_type: "value_add",
        property_class: "C", property_condition: "Good", year_built: 1920, units: 12, sf: 11400,
        land_area_acres: 0.62, num_buildings: 4, num_stories: 3, parking_spaces: 14, parking_type: "Surface lot",
        construction_type: "Wood frame", roof_type: "Rubber membrane", hvac_type: "Gas forced hot air (separate units)",
        zoning: "RG-5",
        amenities: ["Separate utilities", "On-site laundry", "Off-street parking", "Front and rear porches"],
        description: "Four classic Worcester triple-deckers sold as one package, 12 total units near Elm Park and Clark University. Eight units turned 2021-2024; the remaining four sit roughly $250/mo under market. Separate gas heat, tenants pay heat and electric.",
        recent_renovations: "New rubber roofs on two buildings (2023), eight unit turns with kitchens and baths (2021-2024), rear porch rebuild (2022).",
        f: fin({ ask: 1_650_000, cap: 7.6, gross: 195_000, occ: 95, loan: 900_000, rate: 6.25, maturity: "2031-03-01" }),
        img: IMG.mf,
      },
      {
        key: "worcester_retail",
        address: "310 Shrewsbury St", address_is_public: true, city: "Worcester", state: "MA", zip: "01604", county: "Worcester",
        asset_type: "retail", asset_subtype: "Neighborhood strip", strategy_type: "core",
        property_class: "B", property_condition: "Good", year_built: 1985, units: 5, sf: 7800,
        land_area_acres: 0.48, num_buildings: 1, num_stories: 1, parking_spaces: 22, parking_type: "Striped surface lot",
        construction_type: "Masonry block", roof_type: "EPDM", hvac_type: "Rooftop package units",
        zoning: "BG-3",
        amenities: ["Pylon signage", "Rear service access", "Grease trap (restaurant suite)"],
        description: "Five-tenant neighborhood retail strip on Worcester's restaurant row. Long-standing local tenants on staggered leases, all reimbursing taxes and insurance.",
        recent_renovations: "Roof replaced 2021, parking lot sealed and restriped 2023, two storefront systems replaced 2022.",
        f: fin({ ask: 1_250_000, cap: 7.0, gross: 128_000, occ: 92, loan: 680_000, rate: 5.9, maturity: "2029-09-01" }),
        img: IMG.retail,
      },
    ],
  },
  {
    email: "demo.agent.mehta@replacefinder.test",
    full_name: "Priya Mehta",
    brokerage_name: "Mehta Investment Realty",
    properties: [
      {
        key: "lowell_multifamily",
        address: "88 Market St", address_is_public: false, city: "Lowell", state: "MA", zip: "01852", county: "Middlesex",
        asset_type: "multifamily", asset_subtype: "Mill conversion", strategy_type: "core_plus",
        property_class: "B", property_condition: "Excellent", year_built: 1998, units: 42, sf: 41000,
        land_area_acres: 1.15, num_buildings: 1, num_stories: 5, parking_spaces: 48, parking_type: "Gated surface lot",
        construction_type: "Brick and heavy timber", roof_type: "Modified bitumen", hvac_type: "Individual heat pumps",
        zoning: "DMU",
        amenities: ["Elevator", "In-unit laundry", "Secured entry", "Bike storage", "Package room"],
        description: "42-unit converted mill building in downtown Lowell, 96% occupied with a steady renter base from UMass Lowell and the medical corridor. Elevator served with on-site parking.",
        recent_renovations: "Boiler plant replaced 2022, common corridors refreshed 2023, roof section repaired 2021.",
        f: fin({ ask: 4_950_000, cap: 6.5, gross: 545_000, occ: 96, loan: 2_700_000, rate: 5.75, maturity: "2033-01-01" }),
        img: IMG.mf,
      },
      {
        key: "chelmsford_industrial",
        address: "12 Katrina Rd", address_is_public: true, city: "Chelmsford", state: "MA", zip: "01824", county: "Middlesex",
        unit_suite: "Units A-C",
        asset_type: "industrial", asset_subtype: "Flex / light industrial", strategy_type: "core_plus",
        property_class: "B", property_condition: "Excellent", year_built: 2004, units: 3, sf: 21000,
        land_area_acres: 2.1, num_buildings: 1, num_stories: 1, parking_spaces: 34, parking_type: "Surface lot with trailer apron",
        construction_type: "Pre-engineered steel", roof_type: "Standing seam metal", hvac_type: "Gas unit heaters + split office AC",
        zoning: "IA",
        amenities: ["18' clear height", "Three drive-in doors", "Fenced yard", "Office build-outs", "Three-phase power"],
        description: "Three-tenant flex/light industrial building off Route 3, fully leased to established local contractors on staggered NNN leases.",
        recent_renovations: "LED retrofit 2023, two office suites rebuilt 2022, yard repaved 2024.",
        f: fin({ ask: 1_850_000, cap: 8.9, gross: 214_000, occ: 100, loan: 1_000_000, rate: 5.4, maturity: "2032-06-01" }),
        img: IMG.industrial,
      },
    ],
  },
  {
    email: "demo.agent.brooks@replacefinder.test",
    full_name: "Daniel Brooks",
    brokerage_name: "Brooks & Lane CRE",
    properties: [
      {
        key: "springfield_multifamily",
        address: "45 Sumner Ave", address_is_public: false, city: "Springfield", state: "MA", zip: "01108", county: "Hampden",
        asset_type: "multifamily", asset_subtype: "Six-family", strategy_type: "value_add",
        property_class: "C", property_condition: "Fair", year_built: 1925, units: 6, sf: 6800,
        land_area_acres: 0.21, num_buildings: 1, num_stories: 3, parking_spaces: 6, parking_type: "Rear surface parking",
        construction_type: "Wood frame", roof_type: "Asphalt shingle", hvac_type: "Gas steam boiler",
        zoning: "R3",
        amenities: ["Basement storage", "Coin laundry", "Hardwood floors"],
        description: "Six-family in Springfield's Forest Park neighborhood - a straightforward first step up for a small landlord. Two units renovated 2023, four original, rents roughly 15% under market.",
        recent_renovations: "Two full unit renovations 2023, electrical service upgraded 2022, roof replaced 2021.",
        f: fin({ ask: 725_000, cap: 8.0, gross: 104_000, occ: 90, loan: 400_000, rate: 6.5, maturity: "2030-04-01" }),
        img: IMG.mf,
      },
      {
        key: "taunton_multifamily",
        address: "120 Winthrop St", address_is_public: true, city: "Taunton", state: "MA", zip: "02780", county: "Bristol",
        asset_type: "multifamily", asset_subtype: "Garden apartments", strategy_type: "value_add",
        property_class: "B", property_condition: "Good", year_built: 1986, units: 26, sf: 24500,
        land_area_acres: 1.8, num_buildings: 3, num_stories: 2, parking_spaces: 40, parking_type: "Surface lot",
        construction_type: "Wood frame with vinyl siding", roof_type: "Architectural shingle", hvac_type: "Electric baseboard + individual AC",
        zoning: "RA",
        amenities: ["On-site laundry", "Playground", "Storage lockers", "Ample parking"],
        description: "26-unit garden apartment community off Route 44 in Taunton with steady demand from the Route 24 commuter corridor. Fourteen units renovated on turnover; the balance offers straightforward upside.",
        recent_renovations: "Two roofs replaced 2023, parking lot repaved 2022, laundry equipment replaced 2024.",
        f: fin({ ask: 3_200_000, cap: 8.0, gross: 372_000, occ: 94, loan: 1_750_000, rate: 6.1, maturity: "2032-10-01" }),
        img: IMG.mf,
      },
    ],
  },
  {
    email: "demo.agent.vasquez@replacefinder.test",
    full_name: "Elena Vasquez",
    brokerage_name: "Vasquez Realty Partners",
    properties: [
      {
        key: "quincy_multifamily",
        address: "42 Beale St", address_is_public: true, city: "Quincy", state: "MA", zip: "02170", county: "Norfolk",
        asset_type: "multifamily", asset_subtype: "Brick walk-up", strategy_type: "core_plus",
        property_class: "B", property_condition: "Good", year_built: 1972, units: 24, sf: 22800,
        land_area_acres: 0.74, num_buildings: 1, num_stories: 3, parking_spaces: 28, parking_type: "Surface lot",
        construction_type: "Brick and block", roof_type: "Rubber membrane", hvac_type: "Central gas boiler with baseboard",
        zoning: "RES C",
        amenities: ["Common laundry", "Elevator", "Storage lockers", "Two blocks to Red Line"],
        description: "24-unit brick walk-up two blocks from the Wollaston Red Line stop, 95% occupied year-round with fourteen units updated since 2021.",
        recent_renovations: "Windows replaced 2020, fourteen unit updates 2021-2024, boiler serviced and re-piped 2023.",
        f: fin({ ask: 3_600_000, cap: 6.9, gross: 355_000, occ: 95, loan: 1_980_000, rate: 5.95, maturity: "2033-08-01" }),
        img: IMG.mf,
      },
      {
        key: "brockton_mixed_use",
        address: "780 Main St", address_is_public: false, city: "Brockton", state: "MA", zip: "02301", county: "Plymouth",
        asset_type: "mixed_use", asset_subtype: "Retail over apartments", strategy_type: "value_add",
        property_class: "C", property_condition: "Good", year_built: 1930, units: 9, sf: 12400,
        land_area_acres: 0.32, num_buildings: 1, num_stories: 3, parking_spaces: 12, parking_type: "Rear lot",
        construction_type: "Masonry", roof_type: "Rubber membrane", hvac_type: "Gas furnaces (commercial) + baseboard (residential)",
        zoning: "C-3",
        amenities: ["Downtown frontage", "Rear parking", "Basement storage", "Commuter rail within walking distance"],
        description: "Three ground-floor storefronts over six apartments in downtown Brockton. Residential fully leased; one commercial suite is vacant and ready for lease-up.",
        recent_renovations: "Facade and storefront glass redone 2022, two apartment renovations 2023, roof recoated 2021.",
        f: fin({ ask: 1_400_000, cap: 8.6, gross: 176_000, occ: 88, loan: 760_000, rate: 6.8, maturity: "2031-11-01" }),
        img: IMG.retail,
      },
      {
        key: "brookline_medical_office",
        address: "1180 Beacon St", address_is_public: true, city: "Brookline", state: "MA", zip: "02446", county: "Norfolk",
        unit_suite: "Suites 100-410",
        asset_type: "medical_office", asset_subtype: "Multi-tenant medical office", strategy_type: "core",
        property_class: "A", property_condition: "Excellent", year_built: 2006, units: 11, sf: 38000,
        land_area_acres: 0.9, num_buildings: 1, num_stories: 4, parking_spaces: 96, parking_type: "Structured garage",
        construction_type: "Steel and glass curtain wall", roof_type: "TPO", hvac_type: "VAV with rooftop air handlers",
        zoning: "M-1.0",
        amenities: ["Structured parking", "Two elevators", "Backup generator", "ADA-compliant suites", "Green Line access"],
        description: "Institutional-quality Boston-area medical office building leased to orthopedic, dental, and imaging practices on long-term NNN leases with annual escalators.",
        recent_renovations: "Lobby and elevator cab modernization 2023, chiller replacement 2022, garage waterproofing 2024.",
        f: fin({ ask: 7_800_000, cap: 6.4, gross: 742_000, occ: 97, loan: 4_200_000, rate: 5.65, maturity: "2034-02-01" }),
        img: IMG.medical,
      },
    ],
  },
];

// ── The caller's own clients + relinquished-property listings ────────────────
const TODAY = new Date();
export const dFrom = (n: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export interface DemoOwnRecord {
  key: string;
  client: Record<string, unknown> & { client_name: string };
  property: DemoProperty;
  exchange: Record<string, unknown> & { status: string };
  criteria: Record<string, unknown>;
}

export const OWN: DemoOwnRecord[] = [
  {
    key: "sarah_chen",
    client: {
      client_name: "Sarah Chen", client_company: null, client_email: "sarah.chen@example.com", client_phone: "(781) 555-0101",
      notes: "Longtime Medford landlord with two duplexes. Wants to trade up into a single 8-12 unit building closer to the Orange Line. Pre-approved with a local credit union.",
      status: "active",
    },
    property: {
      key: "medford_duplexes",
      address: "214 Highland Ave", address_is_public: false, city: "Medford", state: "MA", zip: "02155", county: "Middlesex",
      asset_type: "multifamily", asset_subtype: "Side-by-side duplexes", strategy_type: "core_plus",
      property_class: "C", property_condition: "Good", year_built: 1955, units: 4, sf: 4600,
      land_area_acres: 0.24, num_buildings: 2, num_stories: 2, parking_spaces: 6, parking_type: "Driveway",
      construction_type: "Wood frame", roof_type: "Asphalt shingle", hvac_type: "Gas forced hot water",
      zoning: "GR",
      amenities: ["Separate utilities", "Basement storage", "Fenced yards"],
      description: "DRAFT - gathering rent roll and last year's operating statements. Two side-by-side duplexes in Medford, fully occupied, tenants pay all utilities.",
      recent_renovations: "One heating system replaced 2023; kitchens original.",
      f: fin({ ask: 1_350_000, cap: 5.2, gross: 118_000, occ: 100, loan: 560_000, rate: 4.6, maturity: "2030-05-01" }),
      img: IMG.mf,
    },
    exchange: { status: "draft" },
    criteria: {
      target_asset_types: ["multifamily"], target_states: ["MA"], target_metros: ["Medford", "Malden", "Somerville"],
      target_price_min: 1_350_000, target_price_max: 2_600_000, target_year_built_min: 1900,
      additional_cash_available: 60_000, max_ltv: 0.70, min_projected_roe: 5, preferred_monthly_cash_flow: 2_500,
      require_location_match: false, require_asset_type_match: true,
    },
  },
  {
    key: "marcus_rodriguez",
    client: {
      client_name: "Marcus Rodriguez", client_company: null, client_email: "marcus.rodriguez@example.com", client_phone: "(617) 555-0127",
      notes: "Second exchange. Owns a Dorchester three-family and is tired of self-managing. Wants a larger Massachusetts multifamily or mixed-use with professional management in place.",
      status: "active",
    },
    property: {
      key: "boston_three_family",
      address: "1420 Dorchester Ave", address_is_public: true, city: "Boston", state: "MA", zip: "02122", county: "Suffolk",
      asset_type: "multifamily", asset_subtype: "Three-decker", strategy_type: "core_plus",
      property_class: "C", property_condition: "Good", year_built: 1910, units: 3, sf: 3900,
      land_area_acres: 0.11, num_buildings: 1, num_stories: 3, parking_spaces: 3, parking_type: "Rear driveway",
      construction_type: "Wood frame", roof_type: "Rubber membrane", hvac_type: "Individual gas furnaces",
      zoning: "3F-4000",
      amenities: ["Separate utilities", "Off-street parking", "Porches", "Basement storage"],
      description: "Classic Dorchester three-decker near Fields Corner, fully occupied with long-term tenants. Two units updated in 2022 with separate utilities throughout.",
      recent_renovations: "Two unit renovations 2022, roof replaced 2020, new gas furnaces 2021.",
      f: fin({ ask: 1_250_000, cap: 5.0, gross: 108_000, occ: 100, loan: 500_000, rate: 4.9, maturity: "2031-07-01" }),
      img: IMG.mf,
    },
    exchange: {
      status: "active", exchange_proceeds: 750_000, estimated_equity: 750_000, estimated_basis: 420_000,
      estimated_gain: 330_000, estimated_tax_liability: 82_500,
      sale_close_date: dFrom(-20), identification_deadline: dFrom(25), closing_deadline: dFrom(160),
    },
    criteria: {
      target_asset_types: ["multifamily", "mixed_use"], target_states: ["MA"], target_metros: ["Boston", "Brockton", "Worcester"],
      target_price_min: 1_250_000, target_price_max: 2_500_000, target_year_built_min: 1900,
      additional_cash_available: 50_000, max_ltv: 0.70, min_projected_roe: 5, preferred_monthly_cash_flow: 2_500,
      require_location_match: true, require_asset_type_match: true,
    },
  },
  {
    key: "anita_patel",
    client: {
      client_name: "Anita Patel", client_company: null, client_email: "anita.patel@example.com", client_phone: "(978) 555-0163",
      notes: "Wants passive, low-maintenance Massachusetts income. Open to small retail, flex, or mixed-use with reliable local tenants. No heavy value-add.",
      status: "active",
    },
    property: {
      key: "beverly_retail",
      address: "210 Rantoul St", address_is_public: true, city: "Beverly", state: "MA", zip: "01915", county: "Essex",
      asset_type: "retail", asset_subtype: "Neighborhood strip", strategy_type: "core",
      property_class: "B", property_condition: "Good", year_built: 1988, units: 4, sf: 6200,
      land_area_acres: 0.38, num_buildings: 1, num_stories: 1, parking_spaces: 18, parking_type: "Surface lot",
      construction_type: "Masonry block", roof_type: "EPDM", hvac_type: "Rooftop package units",
      zoning: "CC",
      amenities: ["Pylon signage", "Corner visibility", "Rear loading"],
      description: "Four-tenant retail strip on Rantoul Street with a pharmacy, salon, and two service tenants. All leases reimburse real estate taxes.",
      recent_renovations: "New roof 2022, lot repaved 2023, exterior painted 2024.",
      f: fin({ ask: 1_100_000, cap: 6.0, gross: 96_000, occ: 100, loan: 420_000, rate: 5.1, maturity: "2030-02-01" }),
      img: IMG.retail,
    },
    exchange: {
      status: "active", exchange_proceeds: 680_000, estimated_equity: 680_000, estimated_basis: 390_000,
      estimated_gain: 290_000, estimated_tax_liability: 72_500,
      sale_close_date: dFrom(-10), identification_deadline: dFrom(35), closing_deadline: dFrom(170),
    },
    criteria: {
      target_asset_types: ["industrial", "mixed_use", "retail"], target_states: ["MA"], target_metros: ["Chelmsford", "Brockton", "Lowell"],
      target_price_min: 1_100_000, target_price_max: 2_000_000, target_year_built_min: 1900,
      additional_cash_available: 40_000, max_ltv: 0.65, min_projected_roe: 6, preferred_monthly_cash_flow: 3_000,
      require_location_match: true, require_asset_type_match: true,
    },
  },
  {
    key: "james_wilson",
    client: {
      client_name: "James Wilson", client_company: null, client_email: "james.wilson@example.com", client_phone: "(978) 555-0144",
      notes: "Selling a Haverhill warehouse he has owned since the 90s. Wants small flex or multifamily within an hour of home. ID window closing fast - only actionable Massachusetts deals.",
      status: "active",
    },
    property: {
      key: "haverhill_warehouse",
      address: "55 Locke St", address_is_public: false, city: "Haverhill", state: "MA", zip: "01830", county: "Essex",
      asset_type: "industrial", asset_subtype: "Single-tenant warehouse", strategy_type: "value_add",
      property_class: "C", property_condition: "Fair", year_built: 1978, units: 1, sf: 18000,
      land_area_acres: 1.4, num_buildings: 1, num_stories: 1, parking_spaces: 20, parking_type: "Fenced yard parking",
      construction_type: "Concrete block", roof_type: "Built-up", hvac_type: "Gas unit heaters",
      zoning: "IG",
      amenities: ["18' clear height", "Three dock doors", "Fenced yard", "I-495 access"],
      description: "Single-tenant warehouse near I-495; the tenant's lease expiration is driving the exchange timeline. Office remodeled in 2022 with a mid-life roof.",
      recent_renovations: "Office remodel 2022, dock levelers replaced 2021.",
      f: fin({ ask: 1_500_000, cap: 6.5, gross: 132_000, occ: 100, loan: 700_000, rate: 5.6, maturity: "2028-11-01" }),
      img: IMG.industrial,
    },
    exchange: {
      status: "in_identification", exchange_proceeds: 800_000, estimated_equity: 800_000, estimated_basis: 430_000,
      estimated_gain: 370_000, estimated_tax_liability: 92_500,
      sale_close_date: dFrom(-36), identification_deadline: dFrom(9), closing_deadline: dFrom(144),
    },
    criteria: {
      target_asset_types: ["industrial", "multifamily"], target_states: ["MA"], target_metros: ["Chelmsford", "Lowell", "Haverhill"],
      target_price_min: 1_500_000, target_price_max: 2_600_000, target_year_built_min: 1970,
      additional_cash_available: 75_000, max_ltv: 0.70, min_projected_roe: 7, preferred_monthly_cash_flow: 4_000,
      require_location_match: true, require_asset_type_match: true,
    },
  },
  {
    key: "olivia_bennett",
    client: {
      client_name: "Olivia Bennett", client_company: null, client_email: "olivia.bennett@example.com", client_phone: "(508) 555-0188",
      notes: "Closing on a Framingham office disposition. Replacement identified; coordinating the qualified intermediary and a local lender. Needs clean execution.",
      status: "active",
    },
    property: {
      key: "framingham_office",
      address: "945 Concord St", address_is_public: true, city: "Framingham", state: "MA", zip: "01701", county: "Middlesex",
      asset_type: "office", asset_subtype: "Suburban professional building", strategy_type: "core",
      property_class: "B", property_condition: "Good", year_built: 1999, units: 6, sf: 14000,
      land_area_acres: 1.1, num_buildings: 1, num_stories: 2, parking_spaces: 52, parking_type: "Surface lot",
      construction_type: "Steel frame with brick veneer", roof_type: "TPO", hvac_type: "Rooftop package units",
      zoning: "B-2",
      amenities: ["Elevator", "Conference room", "Ample surface parking", "Route 126 frontage"],
      description: "Two-story suburban professional building on Route 126, leased to accounting, insurance, and dental tenants. The replacement purchase is already in closing.",
      recent_renovations: "HVAC replacement 2023, lobby refresh 2022, parking lot sealed 2024.",
      f: fin({ ask: 1_800_000, cap: 6.2, gross: 168_000, occ: 92, loan: 900_000, rate: 5.3, maturity: "2032-05-01" }),
      img: IMG.office,
    },
    exchange: {
      status: "in_closing", exchange_proceeds: 900_000, estimated_equity: 900_000, estimated_basis: 520_000,
      estimated_gain: 380_000, estimated_tax_liability: 95_000,
      sale_close_date: dFrom(-60), identification_deadline: dFrom(-15), closing_deadline: dFrom(12),
    },
    criteria: {
      target_asset_types: ["medical_office", "office"], target_states: ["MA"], target_metros: ["Framingham", "Natick", "Brookline"],
      target_price_min: 1_800_000, target_price_max: 8_000_000, target_year_built_min: 1990,
      additional_cash_available: 150_000, max_ltv: 0.70, min_projected_roe: 6, preferred_monthly_cash_flow: 4_000,
      require_location_match: true, require_asset_type_match: true,
    },
  },
  {
    key: "brennan_stout",
    client: {
      client_name: "Brennan Stout", client_company: null, client_email: "brennan.stout@example.com", client_phone: "(413) 555-0190",
      notes: "Closed exchange from earlier this year. Kept on file for repeat business; eyeing another small multifamily disposition in Q4.",
      status: "inactive",
    },
    property: {
      key: "fall_river_storage",
      address: "500 Airport Rd", address_is_public: false, city: "Fall River", state: "MA", zip: "02720", county: "Bristol",
      asset_type: "industrial", asset_subtype: "Self storage", strategy_type: "core",
      property_class: "B", property_condition: "Good", year_built: 2010, units: 1, sf: 22000,
      land_area_acres: 1.6, num_buildings: 2, num_stories: 1, parking_spaces: 12, parking_type: "Surface",
      construction_type: "Pre-engineered steel", roof_type: "Standing seam metal", hvac_type: "Climate-controlled split systems",
      zoning: "I",
      amenities: ["Climate control", "Gated access", "Security cameras", "Drive-up units"],
      description: "Small climate-controlled self-storage facility, sold and exchanged earlier this year. Retained for reference.",
      recent_renovations: "Gate and camera system replaced 2022.",
      f: fin({ ask: 1_300_000, cap: 6.8, gross: 122_000, occ: 90, loan: 500_000, rate: 5.0, maturity: "2029-01-01" }),
      img: IMG.industrial,
    },
    exchange: {
      status: "completed", exchange_proceeds: 800_000, estimated_equity: 800_000, estimated_basis: 450_000,
      estimated_gain: 350_000, estimated_tax_liability: 87_500,
      sale_close_date: dFrom(-180), identification_deadline: dFrom(-135), closing_deadline: dFrom(-8), actual_close_date: dFrom(-8),
    },
    criteria: {
      target_asset_types: ["industrial"], target_states: ["MA"], target_metros: ["Fall River", "New Bedford"],
      target_price_min: 1_300_000, target_price_max: 2_400_000, target_year_built_min: 1980,
      additional_cash_available: 0, max_ltv: 0.70, min_projected_roe: 6, preferred_monthly_cash_flow: 2_000,
      require_location_match: false, require_asset_type_match: false,
    },
  },
];

// ── Self-managed investor demo exchange (the caller acts as their own owner) ──
export const INVESTOR_PROPERTY: DemoProperty = {
  key: "newton_investor_multifamily",
  address: "125 Watertown St", address_is_public: false, city: "Newton", state: "MA", zip: "02458", county: "Middlesex",
  asset_type: "multifamily", asset_subtype: "Courtyard walk-up", strategy_type: "core_plus",
  property_class: "B", property_condition: "Good", year_built: 1968, units: 10, sf: 9800,
  land_area_acres: 0.45, num_buildings: 1, num_stories: 3, parking_spaces: 12, parking_type: "Surface lot",
  construction_type: "Brick", roof_type: "Rubber membrane", hvac_type: "Central gas boiler with baseboard",
  zoning: "MR-2",
  amenities: ["Common laundry", "Storage lockers", "Courtyard", "Off-street parking"],
  description: "Self-managed 10-unit walk-up in Newton being relinquished to move into larger, professionally managed Massachusetts multifamily.",
  recent_renovations: "Roof replaced 2021, four unit turns 2022-2024, boiler serviced 2023.",
  f: fin({ ask: 1_400_000, cap: 4.2, gross: 152_000, occ: 93, loan: 500_000, rate: 4.5, maturity: "2031-04-01" }),
  img: IMG.mf,
};

export const INVESTOR_CRITERIA = {
  target_asset_types: ["multifamily"], target_states: ["MA"], target_metros: ["Worcester", "Taunton", "Quincy"],
  target_price_min: 1_400_000, target_price_max: 3_600_000, target_year_built_min: 1900,
  additional_cash_available: 100_000, max_ltv: 0.72, min_projected_roe: 5, preferred_monthly_cash_flow: 3_000,
  require_location_match: true, require_asset_type_match: true,
};

// ── Inbound (seller-side) counterparty exchange ──────────────────────────────
export const INBOUND_CLIENT = {
  client_name: "Natalie Foster", client_company: null, client_email: "natalie.foster@example.com",
  client_phone: "(508) 555-0210", notes: "Acquiring small Massachusetts multifamily near transit after selling her Salem six-family.",
  status: "active",
};

export const INBOUND_PROPERTY: DemoProperty = {
  key: "salem_six_family",
  address: "18 Winter St", address_is_public: false, city: "Salem", state: "MA", zip: "01970", county: "Essex",
  asset_type: "multifamily", asset_subtype: "Six-family", strategy_type: "core_plus",
  property_class: "C", property_condition: "Good", year_built: 1962, units: 6, sf: 6400,
  land_area_acres: 0.18, num_buildings: 1, num_stories: 3, parking_spaces: 6, parking_type: "Rear lot",
  construction_type: "Wood frame", roof_type: "Asphalt shingle", hvac_type: "Gas steam boiler",
  zoning: "R3",
  amenities: ["Basement storage", "Coin laundry", "Walk to downtown Salem"],
  description: "Relinquished six-family near Salem Common; the owner is exchanging into a Boston-area multifamily.",
  recent_renovations: "Two unit turns 2023, boiler replaced 2020.",
  f: fin({ ask: 1_150_000, cap: 3.2, gross: 84_000, occ: 96, loan: 450_000, rate: 4.8, maturity: "2030-09-01" }),
  img: IMG.mf,
};

export const INBOUND_CRITERIA = {
  target_asset_types: ["multifamily"], target_states: ["MA"], target_metros: ["Boston", "Quincy", "Salem"],
  target_price_min: 1_150_000, target_price_max: 2_200_000, target_year_built_min: 1900,
  additional_cash_available: 25_000, max_ltv: 0.75, min_projected_roe: 2, preferred_monthly_cash_flow: 500,
  require_location_match: true, require_asset_type_match: true,
};

/**
 * The deliberate match plan. Every pair is scored with the production
 * `scorePairExplained`; `band` is asserted so the demo always presents a
 * meaningful distribution instead of whatever the numbers happen to produce.
 */
export type MatchBand = "excellent" | "solid";
export interface PlannedMatch {
  buyer: string;          // OWN key | "investor" | "inbound"
  seller: string;         // property fixture key
  band: MatchBand;
  opts?: Record<string, unknown>;
}

export const MATCH_PLAN: PlannedMatch[] = [
  { buyer: "marcus_rodriguez", seller: "brockton_mixed_use", band: "excellent" },
  { buyer: "marcus_rodriguez", seller: "worcester_multifamily", band: "solid" },
  { buyer: "anita_patel", seller: "chelmsford_industrial", band: "excellent" },
  { buyer: "anita_patel", seller: "brockton_mixed_use", band: "solid" },
  { buyer: "james_wilson", seller: "chelmsford_industrial", band: "solid", opts: {} },
  { buyer: "investor", seller: "taunton_multifamily", band: "solid" },
  { buyer: "investor", seller: "worcester_multifamily", band: "solid" },
];

export const INBOUND_MATCH = { buyer: "inbound", seller: "boston_three_family" };

export const BAND_RANGES: Record<MatchBand, [number, number]> = {
  excellent: [85, 100],
  solid: [60, 84.999],
};

export const ALL_DEMO_PROPERTIES = (): DemoProperty[] => [
  ...COUNTERPARTIES.flatMap((c) => c.properties),
  ...OWN.map((o) => o.property),
  INVESTOR_PROPERTY,
  INBOUND_PROPERTY,
];
