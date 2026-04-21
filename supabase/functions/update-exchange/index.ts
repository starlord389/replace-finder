import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    // Verify ownership
    const { data: exchange, error: exErr } = await db
      .from("exchanges")
      .select("id, agent_id, status, relinquished_property_id, criteria_id")
      .eq("id", payload.exchangeId)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!exchange) return response({ error: "Exchange not found" }, 404);
    if (exchange.agent_id !== user.id) return response({ error: "Not your exchange" }, 403);

    const propertyId = exchange.relinquished_property_id;
    const criteriaId = exchange.criteria_id;

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
      await db.from("match_job_queue").delete().eq("exchange_id", exchange.id);
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
      return await handleStatusChange(db, exchange, propertyId, payload.intent, user.id);
    }

    // ── WIZARD SAVE (with optional status change) ──
    if (payload.property && propertyId) {
      const propUpdate = {
        property_name: stringOrNull(payload.property.property_name),
        address: stringOrNull(payload.property.address),
        city: stringOrNull(payload.property.city),
        state: stringOrNull(payload.property.state),
        zip: stringOrNull(payload.property.zip),
        asset_type: valueOrNull(payload.property.asset_type),
        year_built: numberOrNull(payload.property.year_built),
        units: numberOrNull(payload.property.units),
        building_square_footage: numberOrNull(payload.property.building_square_footage),
        description: stringOrNull(payload.property.description),
      };
      const { error } = await db.from("pledged_properties").update(propUpdate).eq("id", propertyId);
      if (error) throw error;
    }

    if (payload.financials && propertyId) {
      const finUpdate = {
        asking_price: numberOrNull(payload.financials.asking_price),
        noi: numberOrNull(payload.financials.noi),
        occupancy_rate: numberOrNull(payload.financials.occupancy_rate),
        cap_rate: numberOrNull(payload.financials.cap_rate),
        loan_balance: numberOrNull(payload.financials.loan_balance),
      };
      const { error } = await db.from("property_financials").update(finUpdate).eq("property_id", propertyId);
      if (error) throw error;

      // Update exchange-level econ
      await db.from("exchanges").update({
        exchange_proceeds: numberOrNull(payload.financials.exchange_proceeds),
        estimated_equity: numberOrNull(payload.financials.estimated_equity),
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
        await db.storage.from("property-images").remove(toDelete.map((i) => i.storage_path));
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
      await handleStatusChange(db, exchange, propertyId, payload.intent, user.id, /* fromWizard */ true);
    } else {
      // Plain save — timeline event
      await db.from("exchange_timeline").insert({
        exchange_id: exchange.id,
        event_type: "exchange_updated",
        description: "Exchange details updated",
        actor_id: user.id,
      });
      await db.from("event_outbox").insert({
        event_type: "exchange.updated",
        aggregate_type: "exchange",
        aggregate_id: exchange.id,
        payload: { exchange_id: exchange.id, initiated_by: user.id },
      });
      // If published & criteria/financials changed, re-queue matching
      if (exchange.status !== "draft" && (payload.criteria || payload.financials) && propertyId) {
        await db.from("match_job_queue").insert({
          exchange_id: exchange.id,
          property_id: propertyId,
          enqueued_reason: "update-exchange:rescore",
          requested_by: user.id,
        });
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
      await db.from("match_job_queue").insert({
        exchange_id: exchange.id,
        property_id: propertyId,
        enqueued_reason: fromWizard ? "update-exchange:publish" : "update-exchange:inline-publish",
        requested_by: userId,
      });
    }
    await db.from("exchange_timeline").insert({
      exchange_id: exchange.id,
      event_type: "exchange_published",
      description: "Exchange published — matching queued",
      actor_id: userId,
    });
    await db.from("event_outbox").insert({
      event_type: "exchange.published",
      aggregate_type: "exchange",
      aggregate_id: exchange.id,
      payload: { exchange_id: exchange.id, initiated_by: userId },
    });
  } else {
    // move_to_draft — guard: no accepted/completed connections
    const { count } = await db
      .from("exchange_connections")
      .select("id", { count: "exact", head: true })
      .eq("buyer_exchange_id", exchange.id)
      .in("status", ["accepted", "completed"]);
    if ((count ?? 0) > 0) {
      throw new Error("Cannot move to draft: exchange has accepted or completed connections");
    }
    await db.from("exchanges").update({ status: "draft" }).eq("id", exchange.id);
    if (propertyId) {
      await db.from("pledged_properties").update({ status: "draft" }).eq("id", propertyId);
    }
    await db.from("exchange_timeline").insert({
      exchange_id: exchange.id,
      event_type: "exchange_moved_to_draft",
      description: "Exchange moved to draft — matching paused",
      actor_id: userId,
    });
    await db.from("event_outbox").insert({
      event_type: "exchange.updated",
      aggregate_type: "exchange",
      aggregate_id: exchange.id,
      payload: { exchange_id: exchange.id, status: "draft", initiated_by: userId },
    });
  }
  return response({ exchange_id: exchange.id, status: intent === "publish" ? "active" : "draft" });
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
