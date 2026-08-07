// Admin-only, self-cleaning live diagnostic for the investor/agent
// representation boundary. The function deliberately uses separate signed-in
// clients so every allow/deny assertion passes through the deployed RLS and
// SECURITY DEFINER RPCs rather than the service-role client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Check = { name: string; passed: boolean; detail?: string };
type Created = {
  userIds: string[];
  propertyIds: string[];
  exchangeIds: string[];
  matchIds: string[];
  representationIds: string[];
  connectionIds: string[];
  threadIds: string[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const checks: Check[] = [];
  const created: Created = {
    userIds: [], propertyIds: [], exchangeIds: [], matchIds: [],
    representationIds: [], connectionIds: [], threadIds: [],
  };
  const runId = crypto.randomUUID();
  const shortRunId = runId.slice(0, 8);
  let failure: string | null = null;
  let cleanup = { passed: false, users_deleted: 0, remaining_profiles: -1, errors: [] as string[] };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    await requireAdmin(req, db, supabaseUrl, anonKey, serviceRoleKey);

    const password = `E2e-${crypto.randomUUID()}-Aa1!`;
    const identities = {
      investor: await createIdentity(db, created, `representation-e2e-${shortRunId}-investor@1031exchangeup.test`, password, "investor", "E2E Investor"),
      clientInvestor: await createIdentity(db, created, `representation-e2e-${shortRunId}-client@1031exchangeup.test`, password, "investor", "E2E Invited Client"),
      primaryAgent: await createIdentity(db, created, `representation-e2e-${shortRunId}-primary@1031exchangeup.test`, password, "agent", "E2E Primary Agent"),
      alternateAgent: await createIdentity(db, created, `representation-e2e-${shortRunId}-alternate@1031exchangeup.test`, password, "agent", "E2E Alternate Agent"),
      counterpartyAgent: await createIdentity(db, created, `representation-e2e-${shortRunId}-counterparty@1031exchangeup.test`, password, "agent", "E2E Counterparty Agent"),
    };

    const investor = await signedInClient(supabaseUrl, anonKey, identities.investor.email, password);
    const clientInvestor = await signedInClient(supabaseUrl, anonKey, identities.clientInvestor.email, password);
    const primaryAgent = await signedInClient(supabaseUrl, anonKey, identities.primaryAgent.email, password);
    const alternateAgent = await signedInClient(supabaseUrl, anonKey, identities.alternateAgent.email, password);
    const counterpartyAgent = await signedInClient(supabaseUrl, anonKey, identities.counterpartyAgent.email, password);

    pass(checks, "Five isolated authenticated accounts created");
    await assertVerifiedAgent(db, identities.primaryAgent.id);
    await assertVerifiedAgent(db, identities.alternateAgent.id);
    await assertVerifiedAgent(db, identities.counterpartyAgent.id);
    pass(checks, "Agent identities are independently verified");

    const ownerPropertyId = await insertOne(db, "pledged_properties", {
      agent_id: identities.investor.id, property_name: `E2E Owner Property ${shortRunId}`,
      address: "101 Isolation Way", city: "Austin", state: "TX", zip: "78701",
      asset_type: "multifamily", status: "active", source: "agent_pledge",
      owner_authorization_confirmed: true, is_demo: true,
    });
    created.propertyIds.push(ownerPropertyId);
    await mustInsert(db, "property_financials", {
      property_id: ownerPropertyId, asking_price: 2_000_000, loan_balance: 1_000_000, noi: 100_000,
    });
    const exchangeId = await insertOne(db, "exchanges", {
      agent_id: identities.investor.id, owner_type: "investor", status: "active", is_demo: true,
      relinquished_property_id: ownerPropertyId, exchange_proceeds: 1_000_000,
    });
    created.exchangeIds.push(exchangeId);
    await mustUpdate(db, "pledged_properties", { exchange_id: exchangeId }, "id", ownerPropertyId);

    const sellerPropertyId = await insertOne(db, "pledged_properties", {
      agent_id: identities.counterpartyAgent.id, property_name: `E2E Counterparty Listing ${shortRunId}`,
      address: "202 Counterparty Lane", city: "Dallas", state: "TX", zip: "75201",
      asset_type: "multifamily", status: "active", source: "agent_pledge",
      owner_authorization_confirmed: true, is_demo: true,
    });
    created.propertyIds.push(sellerPropertyId);
    await mustInsert(db, "property_financials", {
      property_id: sellerPropertyId, asking_price: 3_000_000, noi: 240_000,
    });
    const matchId = await insertOne(db, "matches", {
      buyer_exchange_id: exchangeId, seller_property_id: sellerPropertyId,
      status: "active", total_score: 92, seller_agent_id: identities.counterpartyAgent.id,
      relinquished_property_id: ownerPropertyId,
    });
    created.matchIds.push(matchId);
    pass(checks, "Isolated investor exchange and counterparty match created");

    await expectDenied(
      "Investor cannot create a direct listing inquiry",
      investor.from("listing_inquiries").insert({
        investor_id: identities.investor.id, property_id: sellerPropertyId,
        listing_agent_id: identities.counterpartyAgent.id, initial_message: "E2E blocked inquiry", is_demo: true,
      }),
      checks,
    );
    await expectDenied(
      "Investor cannot create a counterparty connection",
      investor.from("exchange_connections").insert({
        match_id: matchId, buyer_exchange_id: exchangeId,
        buyer_agent_id: identities.investor.id, seller_agent_id: identities.counterpartyAgent.id,
        initiated_by: "buyer_agent",
      }),
      checks,
    );

    const primaryInvite = await mustRpc(investor, "invite_representing_agent", {
      p_agent_email: identities.primaryAgent.email,
      p_agent_name: "E2E Primary Agent",
      p_exchange_ids: [exchangeId],
      p_assign_future: true,
      p_is_demo: true,
    });
    const primaryInviteRow = firstRow(primaryInvite, "primary invitation");
    created.representationIds.push(primaryInviteRow.representation_id);
    await expectDenied(
      "Invitation recipient cannot cancel the sender's invitation",
      primaryAgent.rpc("cancel_representation_invite", { p_representation_id: primaryInviteRow.representation_id }),
      checks,
    );
    await mustRpc(primaryAgent, "accept_representation_invite", { p_token: primaryInviteRow.invite_token });
    await assertRepresentation(db, primaryInviteRow.representation_id, "active", identities.primaryAgent.id);
    await assertActiveAssignment(db, exchangeId, identities.primaryAgent.id);
    pass(checks, "Investor invitation accepted and selected exchange assigned");

    const reverseInvite = await mustRpc(primaryAgent, "invite_investor_client", {
      p_client_name: "E2E Invited Client",
      p_client_email: identities.clientInvestor.email,
      p_client_phone: null,
      p_notes: "Automated representation E2E",
      p_is_demo: true,
    });
    const reverseInviteRow = firstRow(reverseInvite, "agent-to-investor invitation");
    created.representationIds.push(reverseInviteRow.representation_id);
    await mustRpc(clientInvestor, "accept_representation_invite", { p_token: reverseInviteRow.invite_token });
    await assertRepresentation(db, reverseInviteRow.representation_id, "active", identities.primaryAgent.id);
    const { data: linkedClient, error: linkedClientError } = await db.from("agent_clients")
      .select("id").eq("agent_id", identities.primaryAgent.id)
      .eq("client_user_id", identities.clientInvestor.id).maybeSingle();
    must(!linkedClientError && linkedClient, linkedClientError?.message ?? "Agent client was not linked");
    pass(checks, "Agent invitation accepted and client workspace linked");

    const lifecycleInvite = await mustRpc(investor, "invite_representing_agent", {
      p_agent_email: identities.alternateAgent.email,
      p_agent_name: "E2E Alternate Agent",
      p_exchange_ids: [],
      p_assign_future: false,
      p_is_demo: true,
    });
    const lifecycleRow = firstRow(lifecycleInvite, "lifecycle invitation");
    created.representationIds.push(lifecycleRow.representation_id);
    const prepared = firstRow(await mustRpc(investor, "prepare_representation_invite_delivery", {
      p_representation_id: lifecycleRow.representation_id,
    }), "prepared invitation");
    await expectDenied(
      "Invitation resend cooldown is enforced",
      investor.rpc("prepare_representation_invite_delivery", { p_representation_id: lifecycleRow.representation_id }),
      checks,
    );
    await mustRpc(investor, "update_representation_invite_email", {
      p_representation_id: lifecycleRow.representation_id,
      p_email: identities.alternateAgent.email,
      p_name: "E2E Alternate Agent Corrected",
    });
    const { data: rotatedInvite, error: rotatedError } = await db.from("representation_invites")
      .select("token").eq("representation_id", lifecycleRow.representation_id).single();
    must(!rotatedError && rotatedInvite?.token && rotatedInvite.token !== prepared.token, "Correcting an invitation did not rotate its token");
    const publicClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: oldPreview, error: oldPreviewError } = await publicClient.rpc("get_representation_invite", { p_token: prepared.token });
    must(!oldPreviewError && (!oldPreview || oldPreview.length === 0), "The replaced invitation token still resolves");
    await mustRpc(investor, "cancel_representation_invite", { p_representation_id: lifecycleRow.representation_id });
    await expectDenied(
      "Cancelled invitation token cannot be accepted",
      alternateAgent.rpc("accept_representation_invite", { p_token: rotatedInvite.token }),
      checks,
    );
    pass(checks, "Invitation correction rotates tokens and cancellation invalidates access");

    const alternateInvite = await mustRpc(investor, "invite_representing_agent", {
      p_agent_email: identities.alternateAgent.email,
      p_agent_name: "E2E Alternate Agent",
      p_exchange_ids: [],
      p_assign_future: false,
      p_is_demo: true,
    });
    const alternateInviteRow = firstRow(alternateInvite, "alternate invitation");
    created.representationIds.push(alternateInviteRow.representation_id);
    await mustRpc(alternateAgent, "accept_representation_invite", { p_token: alternateInviteRow.invite_token });
    await assertRepresentation(db, alternateInviteRow.representation_id, "active", identities.alternateAgent.id);
    pass(checks, "Multiple active agent relationships are supported");

    await mustRpc(investor, "set_default_representation", {
      p_representation_id: primaryInviteRow.representation_id,
      p_assign_future: true,
    });
    const secondPropertyId = await insertOne(db, "pledged_properties", {
      agent_id: identities.investor.id, property_name: `E2E Second Owner Property ${shortRunId}`,
      city: "Houston", state: "TX", asset_type: "multifamily", status: "active",
      source: "agent_pledge", owner_authorization_confirmed: true, is_demo: true,
    });
    created.propertyIds.push(secondPropertyId);
    const secondExchangeId = await insertOne(db, "exchanges", {
      agent_id: identities.investor.id, owner_type: "investor", status: "active", is_demo: true,
      relinquished_property_id: secondPropertyId,
    });
    created.exchangeIds.push(secondExchangeId);
    await mustUpdate(db, "pledged_properties", { exchange_id: secondExchangeId }, "id", secondPropertyId);
    await assertActiveAssignment(db, secondExchangeId, identities.primaryAgent.id);
    pass(checks, "Default agent is automatically assigned to a new exchange");

    const contactRequestId = await mustRpc(investor, "request_agent_contact", {
      p_exchange_id: exchangeId,
      p_match_id: matchId,
      p_note: "Please review this E2E match",
    });
    await expectDenied(
      "Investor cannot invoke the agent connection RPC",
      investor.rpc("start_agent_connection", { p_match_id: matchId, p_request_id: contactRequestId }),
      checks,
    );
    const connectionId = await mustRpc(primaryAgent, "start_agent_connection", {
      p_match_id: matchId,
      p_request_id: contactRequestId,
    });
    must(typeof connectionId === "string", "Agent connection RPC did not return a connection id");
    created.connectionIds.push(connectionId);
    const acceptedAt = new Date().toISOString();
    const { data: acceptedConnection, error: acceptConnectionError } = await counterpartyAgent
      .from("exchange_connections")
      .update({
        status: "accepted",
        accepted_at: acceptedAt,
        facilitation_fee_agreed: true,
      })
      .eq("id", connectionId)
      .eq("status", "pending")
      .select("id,status,accepted_at,facilitation_fee_agreed")
      .single();
    must(
      !acceptConnectionError
        && acceptedConnection?.status === "accepted"
        && Boolean(acceptedConnection.accepted_at)
        && acceptedConnection.facilitation_fee_agreed === true,
      acceptConnectionError?.message ?? "Counterparty agent could not accept the pending connection",
    );
    pass(checks, "Counterparty agent accepted the pending connection before messaging");
    const { error: primaryMessageError } = await primaryAgent.from("messages").insert({
      connection_id: connectionId, sender_id: identities.primaryAgent.id, content: "E2E primary-agent message",
    });
    must(!primaryMessageError, primaryMessageError?.message ?? "Primary agent could not message");
    const { error: counterpartyMessageError } = await counterpartyAgent.from("messages").insert({
      connection_id: connectionId, sender_id: identities.counterpartyAgent.id, content: "E2E counterparty-agent reply",
    });
    must(!counterpartyMessageError, counterpartyMessageError?.message ?? "Counterparty agent could not reply");
    const { data: counterpartyMessages, error: counterpartyReadError } = await counterpartyAgent.from("messages")
      .select("id").eq("connection_id", connectionId);
    must(!counterpartyReadError && counterpartyMessages?.length === 2, "Counterparty agent could not read the agent conversation");
    const { data: investorMessages, error: investorReadError } = await investor.from("messages")
      .select("id").eq("connection_id", connectionId);
    must(!investorReadError && investorMessages?.length === 0, "Investor could read counterparty agent messages");
    await expectDenied(
      "Investor cannot send counterparty messages",
      investor.from("messages").insert({
        connection_id: connectionId, sender_id: identities.investor.id, content: "E2E investor message must be blocked",
      }),
      checks,
    );
    pass(checks, "Only the two verified agents can use the counterparty conversation");

    const threadId = await insertThroughClient(investor, "client_agent_threads", {
      representation_id: primaryInviteRow.representation_id,
      investor_id: identities.investor.id,
      agent_id: identities.primaryAgent.id,
      exchange_id: exchangeId,
      match_id: matchId,
    });
    created.threadIds.push(threadId);
    const { error: investorPrivateMessageError } = await investor.from("client_agent_messages").insert({
      thread_id: threadId, sender_id: identities.investor.id, content: "E2E private client note",
    });
    must(!investorPrivateMessageError, investorPrivateMessageError?.message ?? "Investor private message failed");
    const { error: agentPrivateMessageError } = await primaryAgent.from("client_agent_messages").insert({
      thread_id: threadId, sender_id: identities.primaryAgent.id, content: "E2E private agent reply",
    });
    must(!agentPrivateMessageError, agentPrivateMessageError?.message ?? "Agent private message failed");
    const { data: privateMessages, error: privateReadError } = await primaryAgent.from("client_agent_messages")
      .select("id").eq("thread_id", threadId);
    must(!privateReadError && privateMessages?.length === 2, "Representing agent could not read the private client thread");
    const { data: outsiderMessages, error: outsiderReadError } = await counterpartyAgent.from("client_agent_messages")
      .select("id").eq("thread_id", threadId);
    must(!outsiderReadError && outsiderMessages?.length === 0, "Counterparty agent could read the private client thread");
    await expectDenied(
      "Counterparty agent cannot write to the private client thread",
      counterpartyAgent.from("client_agent_messages").insert({
        thread_id: threadId, sender_id: identities.counterpartyAgent.id, content: "E2E outsider message must be blocked",
      }),
      checks,
    );
    pass(checks, "Investor-agent collaboration thread is private to its participants");

    await mustRpc(investor, "assign_agent_to_exchange", {
      p_representation_id: alternateInviteRow.representation_id,
      p_exchange_id: exchangeId,
    });
    await assertActiveAssignment(db, exchangeId, identities.alternateAgent.id);
    await assertActiveAssignment(db, secondExchangeId, identities.primaryAgent.id);
    const { data: cancelledConnection, error: cancelledConnectionError } = await db.from("exchange_connections")
      .select("status").eq("id", connectionId).single();
    must(!cancelledConnectionError && cancelledConnection?.status === "cancelled", "Reassignment did not cancel the old exchange connection");
    const { data: transferredRequest, error: transferredRequestError } = await db.from("agent_contact_requests")
      .select("representing_agent_id,status,connection_id").eq("id", contactRequestId).single();
    must(
      !transferredRequestError && transferredRequest?.representing_agent_id === identities.alternateAgent.id
        && transferredRequest.status === "requested" && transferredRequest.connection_id === null,
      "Reassignment did not safely transfer the waiting request",
    );
    const { data: formerAgentMatch, error: formerAgentMatchError } = await primaryAgent.from("matches")
      .select("id").eq("id", matchId);
    must(!formerAgentMatchError && formerAgentMatch?.length === 0, "Former agent retained live match access after reassignment");
    const { data: newAgentMatch, error: newAgentMatchError } = await alternateAgent.from("matches")
      .select("id").eq("id", matchId);
    must(!newAgentMatchError && newAgentMatch?.length === 1, "New agent did not receive match access after reassignment");
    pass(checks, "One exchange can be reassigned without changing another exchange");

    await mustRpc(investor, "set_default_representation", {
      p_representation_id: alternateInviteRow.representation_id,
      p_assign_future: true,
    });
    const thirdPropertyId = await insertOne(db, "pledged_properties", {
      agent_id: identities.investor.id, property_name: `E2E Third Owner Property ${shortRunId}`,
      city: "San Antonio", state: "TX", asset_type: "multifamily", status: "active",
      source: "agent_pledge", owner_authorization_confirmed: true, is_demo: true,
    });
    created.propertyIds.push(thirdPropertyId);
    const thirdExchangeId = await insertOne(db, "exchanges", {
      agent_id: identities.investor.id, owner_type: "investor", status: "active", is_demo: true,
      relinquished_property_id: thirdPropertyId,
    });
    created.exchangeIds.push(thirdExchangeId);
    await mustUpdate(db, "pledged_properties", { exchange_id: thirdExchangeId }, "id", thirdPropertyId);
    await assertActiveAssignment(db, thirdExchangeId, identities.alternateAgent.id);
    await mustRpc(investor, "unassign_agent_from_exchange", {
      p_exchange_id: exchangeId,
      p_reason: "E2E removal check",
    });
    const { data: activeAfterRemoval, error: activeAfterRemovalError } = await db.from("exchange_agent_assignments")
      .select("id").eq("exchange_id", exchangeId).eq("status", "active");
    must(!activeAfterRemovalError && activeAfterRemoval?.length === 0, "Exchange assignment remained active after removal");
    const { data: alternateRelationship, error: alternateRelationshipError } = await db.from("agent_representations")
      .select("status").eq("id", alternateInviteRow.representation_id).single();
    must(!alternateRelationshipError && alternateRelationship?.status === "active", "Removing exchange access ended the overall relationship");
    const { data: waitingRequest, error: waitingRequestError } = await db.from("agent_contact_requests")
      .select("status,representing_agent_id").eq("id", contactRequestId).single();
    must(!waitingRequestError && waitingRequest?.status === "waiting_for_agent" && waitingRequest.representing_agent_id === null,
      "Removing exchange access did not return its request to waiting");
    pass(checks, "Removing one exchange preserves the relationship and other assignments");
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    checks.push({ name: "Diagnostic completed", passed: false, detail: failure });
  } finally {
    cleanup = await cleanupFixtures(db, created);
  }

  const ok = failure === null && checks.every((check) => check.passed) && cleanup.passed;
  return json({ ok, run_id: runId, checks, cleanup, error: failure }, ok ? 200 : 500);
});

async function requireAdmin(req: Request, db: any, supabaseUrl: string, anonKey: string, serviceRoleKey: string) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) throw new Error("Unauthorized");
  if (authHeader.slice("Bearer ".length) === serviceRoleKey) return;
  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await caller.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data: isAdmin, error: roleError } = await db.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (roleError || !isAdmin) throw new Error("Administrator access is required");
}

async function createIdentity(
  db: any,
  created: Created,
  email: string,
  password: string,
  role: "investor" | "agent",
  fullName: string,
) {
  const { data, error } = await db.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { full_name: fullName, role },
  });
  if (error || !data.user) throw new Error(`Could not create ${role} identity: ${error?.message ?? "unknown error"}`);
  const id = data.user.id;
  created.userIds.push(id);
  await db.from("user_roles").delete().eq("user_id", id);
  await mustInsert(db, "user_roles", { user_id: id, role });
  await mustUpsert(db, "profiles", {
    id, email, full_name: fullName,
    verification_status: role === "agent" ? "verified" : "pending",
    license_number: role === "agent" ? `E2E-${id.slice(0, 8)}` : null,
    license_state: role === "agent" ? "TX" : null,
    verified_at: role === "agent" ? new Date().toISOString() : null,
  });
  return { id, email };
}

async function signedInClient(supabaseUrl: string, anonKey: string, email: string, password: string) {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`Could not sign in isolated account: ${error?.message ?? "no session"}`);
  return client;
}

async function assertVerifiedAgent(db: any, userId: string) {
  const { data, error } = await db.rpc("is_verified_agent", { p_user_id: userId });
  must(!error && data === true, error?.message ?? "Expected a verified agent");
}

async function assertRepresentation(db: any, representationId: string, status: string, agentId: string) {
  const { data, error } = await db.from("agent_representations")
    .select("status,agent_id").eq("id", representationId).single();
  must(!error && data?.status === status && data?.agent_id === agentId, error?.message ?? "Representation state mismatch");
}

async function assertActiveAssignment(db: any, exchangeId: string, agentId: string) {
  const { data, error } = await db.from("exchange_agent_assignments")
    .select("agent_id").eq("exchange_id", exchangeId).eq("status", "active").eq("is_primary", true).single();
  must(!error && data?.agent_id === agentId, error?.message ?? `Active assignment mismatch for ${exchangeId}`);
}

async function expectDenied(name: string, operation: PromiseLike<{ error: any }>, checks: Check[]) {
  const { error } = await operation;
  must(!!error, `${name}: operation unexpectedly succeeded`);
  pass(checks, name, error.message);
}

async function mustRpc(client: any, name: string, args: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

function firstRow(data: any, label: string) {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error(`${label} returned no row`);
  return row;
}

async function insertOne(db: any, table: string, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await db.from(table).insert(row).select("id").single();
  if (error || !data?.id) throw new Error(`${table} insert: ${error?.message ?? "missing id"}`);
  return data.id;
}

async function insertThroughClient(client: any, table: string, row: Record<string, unknown>): Promise<string> {
  const { data, error } = await client.from(table).insert(row).select("id").single();
  if (error || !data?.id) throw new Error(`${table} participant insert: ${error?.message ?? "missing id"}`);
  return data.id;
}

async function mustInsert(db: any, table: string, row: Record<string, unknown>) {
  const { error } = await db.from(table).insert(row);
  if (error) throw new Error(`${table} insert: ${error.message}`);
}

async function mustUpsert(db: any, table: string, row: Record<string, unknown>) {
  const { error } = await db.from(table).upsert(row);
  if (error) throw new Error(`${table} upsert: ${error.message}`);
}

async function mustUpdate(db: any, table: string, row: Record<string, unknown>, column: string, value: string) {
  const { error } = await db.from(table).update(row).eq(column, value);
  if (error) throw new Error(`${table} update: ${error.message}`);
}

function pass(checks: Check[], name: string, detail?: string) {
  checks.push({ name, passed: true, ...(detail ? { detail } : {}) });
}

function must(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function cleanupFixtures(db: any, created: Created) {
  const errors: string[] = [];
  const remove = async (table: string, column: string, ids: string[]) => {
    if (!ids.length) return;
    const { error } = await db.from(table).delete().in(column, ids);
    if (error) errors.push(`${table}: ${error.message}`);
  };

  await remove("messages", "connection_id", created.connectionIds);
  await remove("client_agent_messages", "thread_id", created.threadIds);
  await remove("client_agent_threads", "id", created.threadIds);
  await remove("exchange_connections", "id", created.connectionIds);
  await remove("agent_contact_requests", "investor_id", created.userIds);
  await remove("exchange_agent_assignments", "investor_id", created.userIds);
  await remove("representation_invites", "representation_id", created.representationIds);
  await remove("agent_representations", "id", created.representationIds);
  await remove("agent_clients", "client_user_id", created.userIds);
  await remove("agent_clients", "agent_id", created.userIds);
  await remove("matches", "id", created.matchIds);
  await remove("property_financials", "property_id", created.propertyIds);
  if (created.propertyIds.length) {
    const { error } = await db.from("pledged_properties")
      .update({ exchange_id: null }).in("id", created.propertyIds);
    if (error) errors.push(`pledged_properties unlink: ${error.message}`);
  }
  await remove("exchanges", "id", created.exchangeIds);
  await remove("pledged_properties", "id", created.propertyIds);
  await remove("notifications", "user_id", created.userIds);
  await remove("user_roles", "user_id", created.userIds);
  await remove("profiles", "id", created.userIds);

  let usersDeleted = 0;
  for (const userId of [...created.userIds].reverse()) {
    const { error } = await db.auth.admin.deleteUser(userId);
    if (error) errors.push(`auth.users ${userId}: ${error.message}`);
    else usersDeleted += 1;
  }
  let remainingProfiles = 0;
  if (created.userIds.length) {
    const { count, error } = await db.from("profiles")
      .select("id", { count: "exact", head: true }).in("id", created.userIds);
    if (error) errors.push(`cleanup verification: ${error.message}`);
    remainingProfiles = count ?? -1;
  }
  return {
    passed: errors.length === 0 && remainingProfiles === 0 && usersDeleted === created.userIds.length,
    users_deleted: usersDeleted,
    remaining_profiles: remainingProfiles,
    errors,
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
