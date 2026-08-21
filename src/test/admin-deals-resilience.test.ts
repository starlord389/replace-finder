import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("admin canonical record directory resilience", () => {
  it("pages and filters canonical records on the server", () => {
    const page = read("src/pages/admin/AdminDeals.tsx");
    const hook = read("src/features/admin-crm/data/useAdminCrmDirectory.ts");

    expect(page).toContain("useAdminCrmDirectory<DirectoryRecord, DirectoryContext>");
    expect(page).toContain("const PAGE_SIZE = 25");
    expect(page).toContain("Showing");
    expect(page).toContain("Page {page} of {totalPages}");
    expect(hook).toContain('rpc("admin_list_crm_records"');
    expect(hook).toContain("p_limit: pageSize");
    expect(hook).toContain("p_offset: (page - 1) * pageSize");
    expect(hook).toContain("p_search: search.trim()");
    expect(hook).toContain('p_status: status === "all" ? "" : status');
    expect(hook).not.toContain("search.trim() || undefined");
    expect(page).not.toContain('.from("pledged_properties").select("*")');
    expect(page).not.toContain('.from("matches").select("*")');
  });

  it("shows an explicit retry state instead of presenting a failed query as zero records", () => {
    const page = read("src/pages/admin/AdminDeals.tsx");

    expect(page).toContain("directory.isError");
    expect(page).toContain("This directory is unavailable");
    expect(page).toContain("The server-backed directory could not be loaded.");
    expect(page).toContain("directory.refetch()");
    expect(page).toContain("Retry");
  });
});
