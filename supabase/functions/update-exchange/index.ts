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

type Intent = "save_draft" | "publish" | "save_active" | "move_to_draft" | "delete_draft";

interface UpdatePayload {
  exchangeId: string;
  intent: Intent;
  property?: Record<string, unknown>;
  financials?: Record<string, unknown>;
  criteria?: Record<string, unknown>;
  images?: Array<{ storage_path: string; file_name?: string | null; sort_order?: number }>;
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
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return response({ error: "Unauthorized" }, 401);

    const db = createClient(supabaseUrl, serviceRoleKey);
    const payload = (await req.json()) as UpdatePayload;
    if (!payload.exchangeId) return response({ error: "exchangeId is required" }, 400);

    if (payload.financials) {
      const financialErrors = validateFinancials(payload.financials as Record<string, unknown>, "update");
      if (financialErrors.length > 0) {
        return response({ error: "Invalid financials", details: financialErrors }, 400);
      }
    }

    // Verify ownership
    const { data: exchange, error: exErr } = await db
      .from("exchanges")
      .select("id, agent_id, status, relinquished_property_id, criteria_id, is_demo")
      .eq("id", payload.exchangeId)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!exchange) return response({ error: "Exchange not found" }, 404);
    if (exchange.agent_id !== user.id) return response({ error: "Not your exchange" }, 403);

    const propertyId = exchange.relinquished_property_id;
    const criteriaId = exchange.criteria_id;

    // Storage IDOR guard: every client-supplied image path must live under the
    // caller's own folder (`${user.id}/`). Otherwise an attacker could insert a
    // victim's path into this listing, or — via the reconcile delete below —
    // remove a victim's files from the public bucket.
    if (Array.isArray(payload.images)) {
      const foreign = payload.images.find((img) => !isOwnedPath(img?.storage_path, user.id));
      if (foreign) {
        return response({ error: "Image storage_path must belong to the current user" }, 400);
      }
    }

    // ── MOVE TO DRAFT: fail fast BEFORE any mutation ──
    // The accepted/completed-connection guard must run before we touch any
    // property/financials/criteria/image data (the wizard path applies those —
    // including irreversible storage deletes — before flipping status). Running
    // it first means a rejected unpublish leaves all listing data and storage
    // untouched instead of 500-ing after the writes already landed.
    if (payload.intent === "move_to_draft") {
      const blocked = await assertNoAcceptedConnections(db, exchange.id);
      if (blocked) return blocked;
    }

    // ── DELETE DRAFT ──
    if (payload.intent === "delete_draft") {
      if (exchange.status !== "draft") return response({ error: "Only drafts can be deleted" }, 400);

      const { count: matchCount } = await db
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("buyer_exchange_id", exchange.id);
      const { count: connCount } = await db
        .from("exchange_connections")
        .select("id", { count: "exact", head: true })
        .eq("buyer_exchange_id", exchange.id);
      if ((matchCount ?? 0) > 0 || (connCount ?? 0) > 0) {
        return response({ error: "Cannot delete: exchange has matches or connections" }, 400);
      }

      await db.from("exchange_timeline").delete().eq("exchange_id", exchange.id);
      
      if (criteriaId) {
        await db.from("exchanges").update({ criteria_id: null }).eq("id", exchange.id);
        await db.from("replacement_criteria").delete().eq("id", criteriaId);
      }
      await db.from("exchanges").delete().eq("id", exchange.id);
      if (propertyId) {
        await db.from("property_images").delete().eq("property_id", propertyId);
        await db.from("property_financials").delete().eq("property_id", propertyId);
        await db.from("pledged_properties").delete().eq("id", propertyId);
      }
      return response({ deleted: true });
    }

    // ── STATUS-ONLY CHANGES (publish / move_to_draft, no wizard data) ──
    const isStatusOnly = !payload.property && !payload.financials && !payload.criteria && !payload.images;

    if (isStatusOnly && (payload.intent === "publish" || payload.intent === "move_to_draft")) {
      if (payload.intent === "publish") {
        const publishError = await assertPublishable(db, propertyId);
        if (publishError) return publishError;
      }
      return await handleStatusChange(db, exchange, propertyId, payload.intent, user.id);
    }

    // ── WIZARD SAVE (with optional status change) ──
    if (payload.property && propertyId) {
      const propUpdate = {
        property_name: stringOrNull(payload.property.property_name),
        // Full street address is stored; address_is_public controls whether other
        // agents can see it. ZIP is still not collected.
        address: stringOrNull(payload.property.address),
        address_is_public: boolOrFalse(payload.property.address_is_public),
        city: stringOrNull(payload.property.city),
        state: stringOrNull(payload.property.state),
        zip: null,
        asset_type: valueOrNull(payload.property.asset_type),
        year_built: numberOrNull(payload.property.year_built),
        units: numberOrNull(payload.property.units),
        building_square_footage: numberOrNull(payload.property.building_square_footage),
        description: stringOrNull(payload.property.description),
        owner_authorization_confirmed: boolOrFalse(payload.property.owner_authorization_confirmed),
      };
      const { error } = await db.from("pledged_properties").update(propUpdate).eq("id", propertyId);
      if (error) throw error;
    }

    if (payload.financials && propertyId) {
      const fin = payload.financials;

      // The UI always sends the full input set (a CLEARED field arrives as an
      // empty/null value under a PRESENT key), but a direct authenticated API
      // call may OMIT keys entirely. deriveFinancialColumns(payload) alone
      // collapses every absent input to null, so an unconditional .update() would
      // wipe NOI/cap_rate/rent/opex/loan for any omitted field — dropping the
      // listing out of matching. Instead, merge only the keys the caller actually
      // included over the stored row — keyed on PRESENCE, not value, so the UI
      // can still clear a field to null while a partial API call leaves omitted
      // fields untouched — then re-derive noi/cap_rate/occupancy from the merge.
      const inputKeys = [
        "asking_price",
        "gross_rent_roll",
        "total_operating_expenses",
        "annual_debt_service",
        "loan_balance",
      ] as const;
      const providedKeys = inputKeys.filter((k) => k in fin);

      const { data: storedFin, error: readErr } = await db
        .from("property_financials")
        .select("asking_price, gross_rent_roll, total_operating_expenses, annual_debt_service, loan_balance")
        .eq("property_id", propertyId)
        .maybeSingle();
      if (readErr) throw readErr;

      // Effective inputs: provided value wins, else the stored value.
      const mergedInputs: Record<string, unknown> = {
        asking_price: storedFin?.asking_price,
        gross_rent_roll: storedFin?.gross_rent_roll,
        total_operating_expenses: storedFin?.total_operating_expenses,
        annual_debt_service: storedFin?.annual_debt_service,
        loan_balance: storedFin?.loan_balance,
      };
      for (const k of providedKeys) mergedInputs[k] = fin[k];

      const derived = deriveFinancialColumns(mergedInputs);
      const { error } = await db.from("property_financials").update(derived).eq("property_id", propertyId);
      if (error) throw error;

      // Server-authoritative equity/proceeds from the (merged) asking price and
      // loan balance, rather than trusting client-sent values.
      // estimated_equity = raw equity (asking − loan).
      const estimatedEquity =
        derived.asking_price != null && derived.loan_balance != null
          ? Math.max(0, derived.asking_price - derived.loan_balance)
          : null;
      // exchange_proceeds = equity NET of estimated seller closing costs (~5% of
      // asking price), mirroring the wizard. Prefer a valid client-sent value.
      const exchangeProceeds = resolveExchangeProceeds(
        payload.financials.exchange_proceeds,
        derived.asking_price,
        derived.loan_balance,
      );
      await db.from("exchanges").update({
        exchange_proceeds: exchangeProceeds,
        estimated_equity: estimatedEquity,
      }).eq("id", exchange.id);
    }

    if (payload.criteria && criteriaId) {
      const critUpdate = {
        target_asset_types: arrayOrDefault(payload.criteria.target_asset_types, []),
        target_states: arrayOrDefault(payload.criteria.target_states, []),
        target_price_min: numberOrZero(payload.criteria.target_price_min),
        target_price_max: numberOrZero(payload.criteria.target_price_max),
        target_metros: arrayOrNull(payload.criteria.target_metros),
        target_year_built_min: numberOrNull(payload.criteria.target_year_built_min),
      };
      const { error } = await db.from("replacement_criteria").update(critUpdate).eq("id", criteriaId);
      if (error) throw error;
    }

    // Reconcile images: delete existing not in new list, insert new ones
    if (payload.images && propertyId) {
      const newPaths = new Set(payload.images.map((i) => i.storage_path));
      const { data: existingImgs } = await db
        .from("property_images")
        .select("id, storage_path")
        .eq("property_id", propertyId);

      const toDelete = (existingImgs ?? []).filter((img) => !newPaths.has(img.storage_path));
      if (toDelete.length > 0) {
        await db.from("property_images").delete().in("id", toDelete.map((i) => i.id));
        // Only remove caller-owned paths from storage; never touch foreign paths
        // even if a legacy DB row holds one.
        const ownedPaths = toDelete
          .map((i) => i.storage_path)
          .filter((path) => isOwnedPath(path, user.id));
        if (ownedPaths.length > 0) {
          await db.storage.from("property-images").remove(ownedPaths);
        }
      }

      const existingPaths = new Set((existingImgs ?? []).map((i) => i.storage_path));
      const toInsert = payload.images
        .filter((img) => !existingPaths.has(img.storage_path))
        .map((img, i) => ({
          property_id: propertyId,
          storage_path: img.storage_path,
          file_name: img.file_name ?? null,
          sort_order: typeof img.sort_order === "number" ? img.sort_order : i,
        }));
      if (toInsert.length > 0) {
        const { error } = await db.from("property_images").insert(toInsert);
        if (error) throw error;
      }

      // Update sort_order for kept images
      for (let i = 0; i < payload.images.length; i++) {
        const img = payload.images[i];
        if (existingPaths.has(img.storage_path)) {
          await db.from("property_images")
            .update({ sort_order: i })
            .eq("property_id", propertyId)
            .eq("storage_path", img.storage_path);
        }
      }
    }

    // Optional status flip from wizard
    if (payload.intent === "publish" || payload.intent === "move_to_draft") {
      if (payload.intent === "publish") {
        // Wizard data has just been persisted above, so the DB reflects the
        // values being published; validate against it.
        const publishError = await assertPublishable(db, propertyId);
        if (publishError) return publishError;
      }
      await handleStatusChange(db, exchange, propertyId, payload.intent, user.id, /* fromWizard */ true);
    } else {
      // Plain save — timeline event
      await db.from("exchange_timeline").insert({
        exchange_id: exchange.id,
        event_type: "exchange_updated",
        description: "Exchange details updated",
        actor_id: user.id,
      });
      // If published & criteria/financials changed, re-run matching inline
      if (exchange.status !== "draft" && (payload.criteria || payload.financials) && propertyId) {
        await runMatchingSafe(db, user.id, exchange.id, propertyId, !!exchange.is_demo, "update:rescore");
      }
    }

    return response({ exchange_id: exchange.id, updated: true });
  } catch (error) {
    console.error("update-exchange error", error);
    return response({ error: (error as Error).message }, 500);
  }
});

async function handleStatusChange(
  db: ReturnType<typeof createClient>,
  exchange: { id: string; status: string },
  propertyId: string | null,
  intent: "publish" | "move_to_draft",
  userId: string,
  fromWizard = false,
) {
  if (intent === "publish") {
    await db.from("exchanges").update({ status: "active" }).eq("id", exchange.id);
    if (propertyId) {
      await db.from("pledged_properties").update({
        status: "active",
        listed_at: new Date().toISOString(),
      }).eq("id", propertyId);
    }
    await db.from("exchange_timeline").insert({
      exchange_id: exchange.id,
      event_type: "exchange_published",
      description: "Exchange published — matching ran",
      actor_id: userId,
    });
    if (propertyId) {
      await runMatchingSafe(db, userId, exchange.id, propertyId, !!exchange.is_demo, fromWizard ? "update:publish-wizard" : "update:publish-inline");
    }
  } else {
    // move_to_draft. The accepted/completed-connection guard already ran before
    // any mutation (assertNoAcceptedConnections in the request handler); re-check
    // here as a defensive safety net so this helper is correct even if a future
    // caller forgets the up-front guard.
    const blocked = await assertNoAcceptedConnections(db, exchange.id);
    if (blocked) return blocked;

    await db.from("exchanges").update({ status: "draft" }).eq("id", exchange.id);
    if (propertyId) {
      await db.from("pledged_properties").update({ status: "draft" }).eq("id", propertyId);
    }

    // Pausing matching (the property is no longer 'active') stops NEW matches from
    // being computed, but any matches scored while the listing was live remain in
    // the table with status 'active' and stay visible to the counterparty — so a
    // withdrawn listing can still surface as a live match. Remove this listing's
    // own open matches in BOTH directions:
    //   • buyer side  → matches where this exchange is the buyer (buyer_exchange_id)
    //   • seller side → matches where this exchange's relinquished property is the
    //                   listed property (seller_property_id = propertyId)
    // Never delete a match that already has an accepted/completed connection: that
    // is a live deal between two agents and must survive an unpublish. (The guard
    // above already blocks unpublishing when THIS exchange is the buyer on such a
    // connection, but the seller-side property can carry a connection driven by a
    // different exchange, so filter those out explicitly.)
    await removeOpenMatchesForListing(db, exchange.id, propertyId);

    await db.from("exchange_timeline").insert({
      exchange_id: exchange.id,
      event_type: "exchange_moved_to_draft",
      description: "Exchange moved to draft — matching paused",
      actor_id: userId,
    });
  }
  return response({ exchange_id: exchange.id, status: intent === "publish" ? "active" : "draft" });
}

// Guard move_to_draft against an in-flight deal. Returns a 400 Response when the
// exchange (as buyer) has an accepted, in-progress, or completed connection — unpublishing
// would orphan a live deal — or null when it is safe to move to draft. Returning
// a Response (rather than throwing) lets the handler fail fast with a clean 400
// before any data/storage is mutated, instead of a post-mutation 500.
async function assertNoAcceptedConnections(
  db: ReturnType<typeof createClient>,
  exchangeId: string,
): Promise<Response | null> {
  const { count, error } = await db
    .from("exchange_connections")
    .select("id", { count: "exact", head: true })
    .eq("buyer_exchange_id", exchangeId)
    // 'in_progress' (under contract) is a live deal too — migration
    // 20260625140000 added it between accepted and completed, and the app treats
    // ['accepted','in_progress','completed'] as active everywhere.
    .in("status", ["accepted", "in_progress", "completed"]);
  if (error) throw error;
  if ((count ?? 0) > 0) {
    return response(
      { error: "Cannot move to draft: exchange has an in-flight (accepted, under-contract, or completed) connection" },
      400,
    );
  }
  return null;
}

// When a listing is withdrawn (moved to draft), remove its own *untouched*
// matches so they stop surfacing to counterparties. Covers both match directions
// for this listing: the exchange as buyer (buyer_exchange_id), and its
// relinquished property as the listed seller property (seller_property_id).
//
// We delete ONLY matches that no agent has acted on — i.e. matches with no row
// in exchange_connections and none in identification_list. This is both the
// least-surprising action and the only safe one: those two tables FK to
// matches(id) with NO ON DELETE CASCADE, so deleting a referenced match would
// raise a foreign-key violation. Any match carrying a connection (pending,
// accepted, completed, declined or cancelled) or an identification entry holds
// real agent history / a live deal and must survive an unpublish; the accepted/
// completed guard already blocks the buyer-side live-deal case up front.
//
// Errors are surfaced. Matching is paused regardless of this cleanup, so this
// only governs whether STALE open rows linger.
async function removeOpenMatchesForListing(
  db: ReturnType<typeof createClient>,
  exchangeId: string,
  propertyId: string | null,
) {
  // Candidate match ids for this listing, both directions.
  const buyerSide = await db.from("matches").select("id").eq("buyer_exchange_id", exchangeId);
  if (buyerSide.error) throw buyerSide.error;
  const sellerSide = propertyId
    ? await db.from("matches").select("id").eq("seller_property_id", propertyId)
    : { data: [] as Array<{ id: string }>, error: null };
  if (sellerSide.error) throw sellerSide.error;

  const matchIds = [
    ...new Set(
      [...(buyerSide.data ?? []), ...(sellerSide.data ?? [])].map((m) => m.id),
    ),
  ];
  if (matchIds.length === 0) return;

  // Any match referenced by a connection (any status) or an identification entry
  // is off-limits: it has agent history/a deal, and its FK has no cascade.
  const [connsRes, identsRes] = await Promise.all([
    db.from("exchange_connections").select("match_id").in("match_id", matchIds),
    db.from("identification_list").select("match_id").in("match_id", matchIds),
  ]);
  if (connsRes.error) throw connsRes.error;
  if (identsRes.error) throw identsRes.error;

  const referenced = new Set<string>();
  for (const row of connsRes.data ?? []) if (row.match_id) referenced.add(row.match_id);
  for (const row of identsRes.data ?? []) if (row.match_id) referenced.add(row.match_id);

  const deletable = matchIds.filter((id) => !referenced.has(id));
  if (deletable.length === 0) return;

  const { error: delErr } = await db.from("matches").delete().in("id", deletable);
  if (delErr) throw delErr;
}

// Guard a publish against the persisted listing state. Returns a 400 Response
// when required fields are missing (city/state/asset_type/owner-authorization/
// asking_price), or null when the listing may be published. Reads the DB so it
// works for both status-only publishes and wizard publishes (where the new
// values have already been written).
async function assertPublishable(
  db: ReturnType<typeof createClient>,
  propertyId: string | null,
): Promise<Response | null> {
  if (!propertyId) {
    return response(
      { error: "Cannot publish: missing required fields", details: [{ field: "property", message: "Property is required to publish" }] },
      400,
    );
  }
  const [{ data: property }, { data: financials }] = await Promise.all([
    db.from("pledged_properties")
      .select("city, state, asset_type, owner_authorization_confirmed")
      .eq("id", propertyId)
      .maybeSingle(),
    db.from("property_financials")
      .select("asking_price")
      .eq("property_id", propertyId)
      .maybeSingle(),
  ]);
  const publishErrors = validatePublish(
    property as Record<string, unknown> | null,
    financials as Record<string, unknown> | null,
  );
  if (publishErrors.length > 0) {
    return response({ error: "Cannot publish: missing required fields", details: publishErrors }, 400);
  }
  return null;
}

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
function numberOrZero(value: unknown): number { return numberOrNull(value) ?? 0; }
function stringOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length ? t : null;
}
function valueOrNull(value: unknown): unknown | null { return value ?? null; }
function arrayOrNull(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const n = value.map((i) => String(i).trim()).filter(Boolean);
  return n.length ? n : null;
}
function arrayOrDefault(value: unknown, fallback: string[]): string[] {
  return arrayOrNull(value) ?? fallback;
}
function boolOrFalse(value: unknown): boolean { return value === true; }

// Every storage path must live under the caller's own folder. The uploader
// writes to `${user.id}/<uuid>.<ext>`, so a legitimate path always starts with
// `${userId}/`. Reject anything else (or a non-string) to prevent IDOR.
function isOwnedPath(path: unknown, userId: string): boolean {
  return typeof path === "string" && path.startsWith(`${userId}/`);
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
// computed value.
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
