import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NumericLike = number | null;

interface CreateExchangePayload {
  clientId: string;
  activate: boolean;
  property: Record<string, unknown>;
  financials: Record<string, NumericLike | string | boolean | null>;
  criteria: Record<string, NumericLike | string | string[] | boolean | null>;
  clientName?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return response({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) return response({ error: "Unauthorized" }, 401);

    const db = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "agent") return response({ error: "Agent role required" }, 403);

    const payload = (await req.json()) as CreateExchangePayload;
    if (!payload.clientId) return response({ error: "clientId is required" }, 400);

    // Ensure client belongs to this agent.
    const { data: clientCheck } = await db
      .from("agent_clients")
      .select("id")
      .eq("id", payload.clientId)
      .eq("agent_id", user.id)
      .maybeSingle();
    if (!clientCheck) return response({ error: "Client not found for this agent" }, 400);

    let propertyId: string | null = null;
    let exchangeId: string | null = null;
    let criteriaId: string | null = null;

    try {
      const propertyInsert = {
        agent_id: user.id,
        property_name: stringOrNull(payload.property.property_name),
        address: stringOrNull(payload.property.address),
        unit_suite: stringOrNull(payload.property.unit_suite),
        city: stringOrNull(payload.property.city),
        state: stringOrNull(payload.property.state),
        zip: stringOrNull(payload.property.zip),
        county: stringOrNull(payload.property.county),
        asset_type: valueOrNull(payload.property.asset_type),
        asset_subtype: stringOrNull(payload.property.asset_subtype),
        strategy_type: valueOrNull(payload.property.strategy_type),
        property_class: stringOrNull(payload.property.property_class),
        year_built: numberOrNull(payload.property.year_built),
        units: numberOrNull(payload.property.units),
        building_square_footage: numberOrNull(payload.property.building_square_footage),
        land_area_acres: numberOrNull(payload.property.land_area_acres),
        num_buildings: numberOrNull(payload.property.num_buildings),
        num_stories: numberOrNull(payload.property.num_stories),
        parking_spaces: numberOrNull(payload.property.parking_spaces),
        parking_type: stringOrNull(payload.property.parking_type),
        construction_type: stringOrNull(payload.property.construction_type),
        roof_type: stringOrNull(payload.property.roof_type),
        hvac_type: stringOrNull(payload.property.hvac_type),
        property_condition: stringOrNull(payload.property.property_condition),
        zoning: stringOrNull(payload.property.zoning),
        amenities: arrayOrNull(payload.property.amenities),
        recent_renovations: stringOrNull(payload.property.recent_renovations),
        description: stringOrNull(payload.property.description),
        status: payload.activate ? "active" : "draft",
        source: "agent_pledge",
        listed_at: payload.activate ? new Date().toISOString() : null,
      };

      const { data: propertyRow, error: propertyError } = await db
        .from("pledged_properties")
        .insert(propertyInsert)
        .select("id")
        .single();
      if (propertyError || !propertyRow) throw propertyError || new Error("Unable to create property");
      propertyId = propertyRow.id;

      const financialInsert = {
        property_id: propertyId,
        asking_price: numberOrNull(payload.financials.asking_price),
        noi: numberOrNull(payload.financials.noi),
        occupancy_rate: numberOrNull(payload.financials.occupancy_rate),
        cap_rate: numberOrNull(payload.financials.cap_rate),
        gross_scheduled_income: numberOrNull(payload.financials.gross_scheduled_income),
        effective_gross_income: numberOrNull(payload.financials.effective_gross_income),
        vacancy_rate: numberOrNull(payload.financials.vacancy_rate),
        annual_revenue: numberOrNull(payload.financials.annual_revenue),
        annual_expenses: numberOrNull(payload.financials.annual_expenses),
        real_estate_taxes: numberOrNull(payload.financials.real_estate_taxes),
        insurance: numberOrNull(payload.financials.insurance),
        utilities: numberOrNull(payload.financials.utilities),
        management_fee: numberOrNull(payload.financials.management_fee),
        maintenance_repairs: numberOrNull(payload.financials.maintenance_repairs),
        capex_reserves: numberOrNull(payload.financials.capex_reserves),
        other_expenses: numberOrNull(payload.financials.other_expenses),
        average_rent_per_unit: numberOrNull(payload.financials.average_rent_per_unit),
        loan_balance: numberOrNull(payload.financials.loan_balance),
        loan_rate: numberOrNull(payload.financials.loan_rate),
        loan_type: stringOrNull(payload.financials.loan_type),
        loan_maturity_date: stringOrNull(payload.financials.loan_maturity_date),
        annual_debt_service: numberOrNull(payload.financials.annual_debt_service),
        has_prepayment_penalty: boolOrDefault(payload.financials.has_prepayment_penalty, false),
        prepayment_penalty_details: stringOrNull(payload.financials.prepayment_penalty_details),
      };

      const { error: financialError } = await db.from("property_financials").insert(financialInsert);
      if (financialError) throw financialError;

      const { data: exchangeRow, error: exchangeError } = await db
        .from("exchanges")
        .insert({
          agent_id: user.id,
          client_id: payload.clientId,
          relinquished_property_id: propertyId,
          exchange_proceeds: numberOrNull(payload.financials.exchange_proceeds),
          estimated_equity: numberOrNull(payload.financials.estimated_equity),
          estimated_basis: numberOrNull(payload.financials.estimated_basis),
          estimated_gain: numberOrNull(payload.financials.estimated_gain),
          estimated_tax_liability: numberOrNull(payload.financials.estimated_tax_liability),
          sale_close_date: stringOrNull(payload.financials.sale_close_date),
          status: "draft",
        })
        .select("id")
        .single();
      if (exchangeError || !exchangeRow) throw exchangeError || new Error("Unable to create exchange");
      exchangeId = exchangeRow.id;

      const { data: criteriaRow, error: criteriaError } = await db
        .from("replacement_criteria")
        .insert({
          exchange_id: exchangeId,
          target_asset_types: arrayOrDefault(payload.criteria.target_asset_types, []),
          target_states: arrayOrDefault(payload.criteria.target_states, []),
          target_price_min: numberOrZero(payload.criteria.target_price_min),
          target_price_max: numberOrZero(payload.criteria.target_price_max),
          urgency: stringOrNull(payload.criteria.urgency),
          target_metros: arrayOrNull(payload.criteria.target_metros),
          target_strategies: arrayOrNull(payload.criteria.target_strategies),
          target_property_classes: arrayOrNull(payload.criteria.target_property_classes),
          target_cap_rate_min: numberOrNull(payload.criteria.target_cap_rate_min),
          target_cap_rate_max: numberOrNull(payload.criteria.target_cap_rate_max),
          target_occupancy_min: numberOrNull(payload.criteria.target_occupancy_min),
          target_year_built_min: numberOrNull(payload.criteria.target_year_built_min),
          target_units_min: numberOrNull(payload.criteria.target_units_min),
          target_units_max: numberOrNull(payload.criteria.target_units_max),
          target_sf_min: numberOrNull(payload.criteria.target_sf_min),
          target_sf_max: numberOrNull(payload.criteria.target_sf_max),
          open_to_dsts: boolOrDefault(payload.criteria.open_to_dsts, false),
          open_to_tics: boolOrDefault(payload.criteria.open_to_tics, false),
          must_replace_debt: boolOrDefault(payload.criteria.must_replace_debt, true),
          min_debt_replacement: numberOrNull(payload.criteria.min_debt_replacement),
          additional_notes: stringOrNull(payload.criteria.additional_notes),
        })
        .select("id")
        .single();
      if (criteriaError || !criteriaRow) throw criteriaError || new Error("Unable to create criteria");
      criteriaId = criteriaRow.id;

      const [exchangeUpdate, propertyUpdate] = await Promise.all([
        db.from("exchanges").update({ criteria_id: criteriaId }).eq("id", exchangeId),
        db.from("pledged_properties").update({ exchange_id: exchangeId }).eq("id", propertyId),
      ]);
      if (exchangeUpdate.error) throw exchangeUpdate.error;
      if (propertyUpdate.error) throw propertyUpdate.error;

      const timelineRows = [
        {
          exchange_id: exchangeId,
          event_type: "created",
          description: `Exchange created${payload.clientName ? ` for ${payload.clientName}` : ""}`,
          actor_id: user.id,
        },
        ...(payload.activate
          ? [{
            exchange_id: exchangeId,
            event_type: "property_pledged",
            description: "Property pledged to network and matching queued",
            actor_id: user.id,
          }]
          : []),
      ];
      await db.from("exchange_timeline").insert(timelineRows);

      if (payload.activate) {
        await db.from("match_job_queue").insert({
          exchange_id: exchangeId,
          property_id: propertyId,
          enqueued_reason: "create-exchange:activate",
          requested_by: user.id,
        });
      }

      await db.from("event_outbox").insert({
        event_type: "exchange.created",
        aggregate_type: "exchange",
        aggregate_id: exchangeId,
        payload: {
          exchange_id: exchangeId,
          property_id: propertyId,
          activated: payload.activate,
          initiated_by: user.id,
        },
      });

      return response({
        exchange_id: exchangeId,
        property_id: propertyId,
        criteria_id: criteriaId,
        matching_queued: payload.activate,
      });
    } catch (innerError) {
      if (criteriaId) await db.from("replacement_criteria").delete().eq("id", criteriaId);
      if (exchangeId) await db.from("exchanges").delete().eq("id", exchangeId);
      if (propertyId) {
        await db.from("property_financials").delete().eq("property_id", propertyId);
        await db.from("pledged_properties").delete().eq("id", propertyId);
      }
      throw innerError;
    }
  } catch (error) {
    console.error("create-exchange error", error);
    return response({ error: (error as Error).message }, 500);
  }
});

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function numberOrZero(value: unknown): number {
  return numberOrNull(value) ?? 0;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function valueOrNull(value: unknown): unknown | null {
  return value ?? null;
}

function arrayOrNull(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value.map((item) => String(item).trim()).filter(Boolean);
  return normalized.length ? normalized : null;
}

function arrayOrDefault(value: unknown, fallback: string[]): string[] {
  return arrayOrNull(value) ?? fallback;
}

function boolOrDefault(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}
