import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const canonical = read("supabase/migrations/20260811160000_canonical_match_workflow.sql");
const repair = read("supabase/migrations/20260820200000_admin_workflow_deployment_repair.sql");

describe("late canonical workflow deployment repair", () => {
  it("keeps the canonical workflow as the source of the missing schema", () => {
    expect(canonical).toContain("CREATE TABLE IF NOT EXISTS public.match_workflow_states");
    expect(canonical).toContain("CREATE TABLE IF NOT EXISTS public.match_workflow_events");
    expect(canonical).toContain("INSERT INTO public.match_workflow_states");
    expect(canonical).toContain("trg_sync_match_workflow_connection");
  });

  it("extends account suspension to both late-created workflow tables", () => {
    for (const table of ["match_workflow_states", "match_workflow_events"]) {
      expect(repair).toContain(`ON public.${table} AS RESTRICTIVE FOR SELECT TO authenticated`);
      expect(repair).toContain(`ON public.${table} AS RESTRICTIVE FOR INSERT TO authenticated`);
      expect(repair).toContain(`ON public.${table} AS RESTRICTIVE FOR UPDATE TO authenticated`);
      expect(repair).toContain(`ON public.${table} AS RESTRICTIVE FOR DELETE TO authenticated`);
    }
  });
});
