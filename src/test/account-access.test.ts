import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getSuspendedAccountUi,
  isAccountSuspended,
  isEmailConfirmationError,
} from "@/lib/accountAccess";

describe("account access helpers", () => {
  it("uses suspension only as the application access state", () => {
    expect(isAccountSuspended("verified")).toBe(false);
    expect(isAccountSuspended("pending")).toBe(false);
    expect(isAccountSuspended(null)).toBe(false);
    expect(isAccountSuspended("suspended")).toBe(true);
    expect(getSuspendedAccountUi().title).toBe("Account suspended");
  });

  it("detects email confirmation login errors", () => {
    expect(isEmailConfirmationError("Email not confirmed")).toBe(true);
    expect(isEmailConfirmationError("Invalid login credentials")).toBe(false);
  });

  it("enables email confirmation for local and fresh environments", () => {
    const config = readFileSync(resolve(process.cwd(), "supabase/config.toml"), "utf8");
    expect(config).toContain("[auth.email]");
    expect(config).toContain("enable_confirmations = true");
  });
});
