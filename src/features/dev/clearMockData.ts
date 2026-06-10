import { supabase } from "@/integrations/supabase/client";

/**
 * Clears the signed-in agent's workspace data (clients, listings,
 * exchanges and all dependents, notifications). Runs server-side via the
 * seed-counterparty-agents edge function (action "clear-all") because
 * several tables have service-only delete policies.
 */
export async function clearAgentMockData(_userId: string) {
  const { data, error } = await supabase.functions.invoke(
    "seed-counterparty-agents",
    { body: { action: "clear-all" } }
  );
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (data?.version !== 3 || !data?.cleared) {
    throw new Error(
      "The clear function on the server is outdated (expected v3). " +
      "Redeploy the seed-counterparty-agents edge function, then try again."
    );
  }
}
