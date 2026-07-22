import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { runMatchingSafe } from "../_shared/matching-core.ts";
import { validateFinancials } from "../_shared/validate-financials.ts";
import { deriveFinancialColumns } from "../_shared/derive-financials.ts";
import { validatePublish } from "../_shared/validate-publish.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NumericLike = number | null;

interface CreateExchangePayload {
  clientId: string;
  activate: boolean;
  isDemo?: boolean;
  property: Record<string, unknown>;
  financials: Record<string, NumericLike | string | boolean | null>;
  criteria: Record<string, NumericLike | string | string[] | boolean | null>;
  images?: Array<{
    storage_path: string;
    file_name?: string | null;
    sort_order?: number;
  }>;
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
    // Roles live in user_roles (the profiles.role column was dropped in
    // 20260522172727). Selecting profiles.role here errored on every call and
    // 403'd every agent, blocking all listing creation.
    const { data: roleRow } = await db
      .from("user_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "agent")
      .maybeSingle();
    if (!roleRow) return response({ error: "Agent role required" }, 403);

    const payload = (await req.json()) as CreateExchangePayload;
    if (!payload.clientId) return response({ error: "clientId is required" }, 400);

    const financialErrors = validateFinancials(payload.financials as Record<string, unknown>, "create");
    if (financialErrors.length > 0) {
      return response({ error: "Invalid financials", details: financialErrors }, 400);
    }

    // Publishing (activate) requires a complete listing — mirror the client's
    // validatePublish so we don't push an incomplete listing into the network.
    if (payload.activate) {
      const publishErrors = validatePublish(payload.property, payload.financials as Record<string, unknown>);
      if (publishErrors.length > 0) {
        return response({ error: "Cannot publish: missing required fields", details: publishErrors }, 400);
      }
    }

    // Ensure client belongs to this agent.
    const { data: clientCheck } = await db
      .from("agent_clients")
      .select("id, is_demo")
      .eq("id", payload.clientId)
      .eq("agent_id", user.id)
      .maybeSingle();
    if (!clientCheck) return response({ error: "Client not found for this agent" }, 400);

    // Workspace integrity: the client's workspace (demo sandbox vs live) must
    // match the workspace this exchange is being created in. Otherwise a Live
    // exchange could reference a Demo client, and a demo reset would
    // CASCADE-delete the linked Live exchange.
    const requestedIsDemo = payload.isDemo === true;
    if (clientCheck.is_demo !== requestedIsDemo) {
      return response(
        { error: "Client workspace mismatch: the selected client belongs to a different workspace" },
        400,
      );
    }

    // Storage IDOR guard: every client-supplied image path must either be an
    // external http(s):// URL (demo/legacy references — harmless) or live under
    // the caller's own folder (`${user.id}/`). A relative path under another
    // user's folder is rejected: an attacker could otherwise insert a victim's
    // path — or force a rollback — to delete the victim's files.
    if (Array.isArray(payload.images)) {
      const foreign = payload.images.find((img) => !isAllowedImagePath(img?.storage_path, user.id));
      if (foreign) {
        return response({ error: "Image storage_path must belong to the current user" }, 400);
      }
    }

    let propertyId: string | null = null;
    let exchangeId: string | null = null;
    let criteriaId: string | null = null;

    try {
      const propertyInsert = {
        agent_id: user.id,
        property_name: stringOrNull(payload.property.property_name),
        // The full street address is stored, but only exposed to other agents
        // when address_is_public is true (the listing agent + admins always see it).
        address: stringOrNull(payload.property.address),
        address_is_public: boolOrFalse(payload.property.address_is_public),
        city: stringOrNull(payload.property.city),
        state: stringOrNull(payload.property.state),
        asset_type: valueOrNull(payload.property.asset_type),
        year_built: null,
        units: null,
        building_square_footage: null,
        description: stringOrNull(payload.property.description),
        // Compliance: agent attests they have authorization to market the property.
        owner_authorization_confirmed: boolOrFalse(payload.property.owner_authorization_confirmed),
        // Workspace stamp: demo sandbox vs live.
        is_demo: payload.isDemo === true,
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

      if (Array.isArray(payload.images) && payload.images.length > 0) {
        const imageRows = payload.images.map((img, i) => ({
          property_id: propertyId!,
          storage_path: String(img.storage_path),
          file_name: img.file_name ? String(img.file_name) : null,
          sort_order: typeof img.sort_order === "number" ? img.sort_order : i,
        }));
        const { error: imageError } = await db.from("property_images").insert(imageRows);
        if (imageError) throw imageError;
      }

      const derived = deriveFinancialColumns(payload.financials);
      // Server-authoritative equity/proceeds: derive from the validated asking
      // price and loan balance rather than trusting client-sent values.
      // estimated_equity = RAW equity (asking − loan), NOT clamped — the wizard
      // displays raw (negative-capable) equity, so the stored value must match.
      // (exchange_proceeds stays clamped >= 0 below.)
      const estimatedEquity =
        derived.asking_price != null && derived.loan_balance != null
          ? derived.asking_price - derived.loan_balance
          : null;
      // exchange_proceeds = equity NET of estimated seller closing costs (~5% of
      // asking price). This mirrors the figure the wizard shows/sends. Prefer a
      // valid client-sent value (validated against the server formula); else
      // replicate the formula here.
      const exchangeProceeds = resolveExchangeProceeds(
        payload.financials.exchange_proceeds,
        derived.asking_price,
        derived.loan_balance,
      );

      const financialInsert = {
        property_id: propertyId,
        ...derived,
      };

      const { error: financialError } = await db.from("property_financials").insert(financialInsert);
      if (financialError) throw financialError;

      const { data: exchangeRow, error: exchangeError } = await db
        .from("exchanges")
        .insert({
          agent_id: user.id,
          client_id: payload.clientId,
          relinquished_property_id: propertyId,
          exchange_proceeds: exchangeProceeds,
          estimated_equity: estimatedEquity,
          is_demo: payload.isDemo === true,
          status: payload.activate ? "active" : "draft",
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
          target_metros: arrayOrNull(payload.criteria.target_metros),
          target_year_built_min: numberOrNull(payload.criteria.target_year_built_min),
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
        await runMatchingSafe(db, user.id, exchangeId, propertyId, payload.isDemo === true, "create:activate");
      }

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
        await db.from("property_images").delete().eq("property_id", propertyId);
        await db.from("property_financials").delete().eq("property_id", propertyId);
        await db.from("pledged_properties").delete().eq("id", propertyId);
      }
      // Don't leave just-uploaded photos orphaned in storage on rollback — but
      // only ever remove paths owned by the caller, never arbitrary paths.
      if (Array.isArray(payload.images) && payload.images.length > 0) {
        const ownedPaths = payload.images
          .map((img) => String(img.storage_path))
          .filter((path) => isOwnedPath(path, user.id));
        if (ownedPaths.length > 0) {
          await db.storage.from("property-images").remove(ownedPaths).catch(() => {});
        }
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

function boolOrFalse(value: unknown): boolean {
  return value === true;
}

// Whether a storage path targets the caller's own bucket folder. The uploader
// writes to `${user.id}/<uuid>.<ext>`, so a freshly-uploaded path always starts
// with `${userId}/`. Used to scope the reconcile storage.remove so it only ever
// deletes the caller's own files.
function isOwnedPath(path: unknown, userId: string): boolean {
  return typeof path === "string" && path.startsWith(`${userId}/`);
}

// Absolute http(s):// URLs (e.g. demo/legacy Unsplash listings store the full
// image URL as storage_path) are external references, not bucket folder paths —
// they cannot target another user's storage, so they are exempt from the IDOR
// guard. The reconcile storage.remove already filters to owned `${userId}/`
// paths, so an external URL is never passed to storage.remove either.
function isHttpUrl(path: unknown): boolean {
  return typeof path === "string" && /^https?:\/\//i.test(path);
}

// The IDOR guard rejects ONLY a path that is neither an external http(s) URL nor
// under the caller's own folder — i.e. a relative bucket path pointing at someone
// else's folder.
function isAllowedImagePath(path: unknown, userId: string): boolean {
  return isHttpUrl(path) || isOwnedPath(path, userId);
}

// Must match calculateEstimatedExchangeProceeds in src/lib/exchangeWizardTypes.ts:
// proceeds = max((asking − loan) − asking × 5%, 0).
const SELLER_COST_ESTIMATE_RATE = 0.05;

function computeExchangeProceeds(
  askingPrice: number | null,
  loanBalance: number | null,
): number | null {
  if (askingPrice == null || loanBalance == null) return null;
  const equity = askingPrice - loanBalance;
  const sellerCosts = askingPrice * SELLER_COST_ESTIMATE_RATE;
  return Math.max(equity - sellerCosts, 0);
}

// Prefer a client-sent exchange_proceeds when it matches the server formula
// (within a small rounding tolerance); otherwise fall back to the server-
// computed value. This keeps the stored figure authoritative while honoring the
// exact value the wizard displayed to the agent.
function resolveExchangeProceeds(
  clientValue: unknown,
  askingPrice: number | null,
  loanBalance: number | null,
): number | null {
  const computed = computeExchangeProceeds(askingPrice, loanBalance);
  const sent = numberOrNull(clientValue);
  if (sent != null && computed != null && Math.abs(sent - computed) <= 1) {
    return sent;
  }
  return computed;
}
