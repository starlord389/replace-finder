import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const migrationsDir = resolve(root, "supabase/migrations");
const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => ({ file, sql: readFileSync(resolve(migrationsDir, file), "utf8") }));

describe("fresh-environment avatar bucket configuration", () => {
  it("declares profile-avatars as a private bucket with size and MIME limits", () => {
    const config = read("supabase/config.toml");
    expect(config).toContain("[storage.buckets.profile-avatars]");
    expect(config).toMatch(/\[storage\.buckets\.profile-avatars\][\s\S]*public\s*=\s*false/);
    expect(config).toMatch(/file_size_limit\s*=\s*"5MiB"/);
    expect(config).toMatch(/allowed_mime_types\s*=\s*\["image\/jpeg",\s*"image\/png",\s*"image\/webp"\]/);
  });

  it("documents the bucket-seeding step for fresh and local environments", () => {
    expect(read("supabase/migrations/20260812120000_personable_trust_profiles.sql")).toMatch(
      /bucket-seeding step/i,
    );
  });

  it("keeps the profile-column additions and comments in the trust-profile migration", () => {
    const sql = read("supabase/migrations/20260812120000_personable_trust_profiles.sql");
    for (const column of [
      "profile_headline",
      "service_areas",
      "completed_1031_exchanges",
      "career_transaction_volume",
    ]) {
      expect(sql).toContain(`ADD COLUMN IF NOT EXISTS ${column}`);
      expect(sql).toContain(`COMMENT ON COLUMN public.profiles.${column}`);
    }
    expect(sql).toContain("self-reported");
  });

  it("has no migration that creates or updates profile-avatars as a public bucket", () => {
    for (const { file, sql } of migrations) {
      if (!sql.includes("profile-avatars")) continue;
      expect(sql, file).not.toMatch(/storage\.buckets/i);
    }
  });

  it("leaves no public-read avatar policy in the final ordered chain", () => {
    let publicReadPolicy = false;
    for (const { sql } of migrations) {
      const statements = sql.split(";");
      for (const statement of statements) {
        if (!statement.includes("profile-avatars")) continue;
        if (/DROP\s+POLICY[\s\S]*Profile avatars are publicly readable/i.test(statement)) {
          publicReadPolicy = false;
        } else if (/CREATE\s+POLICY[\s\S]*Profile avatars are publicly readable/i.test(statement)) {
          publicReadPolicy = true;
        }
      }
    }
    expect(publicReadPolicy).toBe(false);
  });

  it("restricts every avatar SELECT policy in the final state to authenticated, authorized readers", () => {
    const selectPolicies = migrations
      .flatMap(({ file, sql }) => sql.split(";").map((statement) => ({ file, statement })))
      .filter(
        ({ statement }) =>
          /CREATE\s+POLICY/i.test(statement) &&
          statement.includes("profile-avatars") &&
          /FOR\s+SELECT/i.test(statement),
      );
    const last = selectPolicies.at(-1);
    expect(last).toBeDefined();
    expect(last!.statement).toMatch(/FOR\s+SELECT\s+TO\s+authenticated/i);
    expect(last!.statement).toContain("auth.uid()::text = (storage.foldername(name))[1]");
    expect(last!.statement).toContain("FROM public.profiles p");
    expect(last!.statement).not.toMatch(/TO\s+anon/i);
  });
});
