import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";

type HealthQueue = {
  pending: number;
  failed: number;
  oldestPendingAt: string | null;
};

export type AdminSystemHealth = {
  checkedAt: string;
  matching: HealthQueue & { processing: number };
  outbox: HealthQueue;
  email: {
    pending: number;
    failed: number;
    bounced: number;
    complained: number;
    dlq: number;
    sentLast24h: number;
    lastIssueAt: string | null;
  };
};

export type AdminAuditEntry = Tables<"admin_audit_log"> & {
  actorName: string;
  actorEmail: string | null;
};

type AuditActionInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Json;
};

function asObject(value: Json): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asString(value: Json | undefined) {
  return typeof value === "string" ? value : null;
}

export function normalizeAdminSystemHealth(value: Json): AdminSystemHealth {
  const root = asObject(value);
  const matching = asObject(root.matching ?? null);
  const outbox = asObject(root.outbox ?? null);
  const email = asObject(root.email ?? null);

  return {
    checkedAt: asString(root.checked_at) ?? new Date().toISOString(),
    matching: {
      pending: asNumber(matching.pending),
      processing: asNumber(matching.processing),
      failed: asNumber(matching.failed),
      oldestPendingAt: asString(matching.oldest_pending_at),
    },
    outbox: {
      pending: asNumber(outbox.pending),
      failed: asNumber(outbox.failed),
      oldestPendingAt: asString(outbox.oldest_pending_at),
    },
    email: {
      pending: asNumber(email.pending),
      failed: asNumber(email.failed),
      bounced: asNumber(email.bounced),
      complained: asNumber(email.complained),
      dlq: asNumber(email.dlq),
      sentLast24h: asNumber(email.sent_last_24h),
      lastIssueAt: asString(email.last_issue_at),
    },
  };
}

export function getAdminHealthIssueCount(health: AdminSystemHealth) {
  return (
    health.matching.failed +
    health.outbox.failed +
    getAdminEmailIssueCount(health)
  );
}

export function getAdminEmailIssueCount(health: AdminSystemHealth) {
  return health.email.failed + health.email.bounced + health.email.complained + health.email.dlq;
}

export function useAdminSystemHealth() {
  return useQuery({
    queryKey: ["admin-system-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_system_health");
      if (error) throw error;
      return normalizeAdminSystemHealth(data);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useAdminAuditLog() {
  return useQuery({
    queryKey: ["admin-audit-log"],
    queryFn: async (): Promise<AdminAuditEntry[]> => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const entries = data ?? [];
      const actorIds = [...new Set(entries.map((entry) => entry.actor_id).filter((id): id is string => Boolean(id)))];
      const profileResult = actorIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
        : { data: [], error: null };

      if (profileResult.error) throw profileResult.error;
      const actors = new Map((profileResult.data ?? []).map((profile) => [profile.id, profile]));

      return entries.map((entry) => {
        const actor = entry.actor_id ? actors.get(entry.actor_id) : null;
        return {
          ...entry,
          actorName: actor?.full_name || actor?.email || "Former admin",
          actorEmail: actor?.email ?? null,
        };
      });
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export async function recordAdminAction({
  action,
  entityType,
  entityId = null,
  summary = null,
  metadata = {},
}: AuditActionInput) {
  const { error } = await supabase.rpc("log_admin_action", {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_summary: summary,
    p_metadata: metadata,
  });

  if (error) {
    console.error("Admin action completed, but its audit entry could not be recorded.", error);
    toast.warning("Change saved, but the audit entry failed", {
      description: "Refresh and check System & Audit before making another sensitive change.",
    });
    return false;
  }
  return true;
}
