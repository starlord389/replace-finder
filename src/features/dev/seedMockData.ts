import { supabase } from "@/integrations/supabase/client";

/**
 * Seeds the full demo dataset for the signed-in agent. Runs server-side
 * (seed-counterparty-agents edge function, action "seed-all") because
 * matches, connections, messages, and notifications have service-only
 * insert policies. The function clears existing data first, so seeding
 * is always a clean rebuild.
 */
export type SeedValidationReport = {
  ok: boolean;
  total_issues: number;
  tables: Array<{
    table: string;
    label: string;
    total: number;
    valid: number;
    invalid: number;
    issues: Array<{ record: string; missing: string[] }>;
  }>;
};

export async function seedAgentMockData(_userId: string) {
  const { data, error } = await supabase.functions.invoke(
    "seed-counterparty-agents",
    { body: { action: "seed-all" } }
  );
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (data?.version !== 5 || !data?.seeded) {
    throw new Error(
      "The seeding function on the server is outdated (expected v5). " +
      "Redeploy the seed-counterparty-agents edge function, then try again."
    );
  }
  return {
    counts: data.seeded as {
      clients: number;
      properties: number;
      exchanges: number;
      matches: number;
      connections: number;
    },
    validation: (data.validation ?? null) as SeedValidationReport | null,
  };
}

export async function validateAgentMockData() {
  const { data, error } = await supabase.functions.invoke(
    "seed-counterparty-agents",
    { body: { action: "validate" } }
  );
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.validation as SeedValidationReport;
}
