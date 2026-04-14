import { describe, expect, it } from "vitest";
import {
  getAgentVerificationUiState,
  hasOperationalAgentAccess,
  isEmailConfirmationError,
} from "@/lib/agentVerification";

describe("agent verification helpers", () => {
  it("treats non-suspended agents as operational", () => {
    expect(hasOperationalAgentAccess("verified")).toBe(true);
    expect(hasOperationalAgentAccess("pending")).toBe(true);
    expect(hasOperationalAgentAccess(null)).toBe(true);
    expect(hasOperationalAgentAccess("suspended")).toBe(false);
  });

  it("returns self-certified ui state by default", () => {
    expect(getAgentVerificationUiState("verified")).toMatchObject({
      badgeLabel: "Self-Certified",
      isSuspended: false,
    });
  });

  it("returns suspended ui state when account is suspended", () => {
    expect(getAgentVerificationUiState("suspended")).toMatchObject({
      badgeLabel: "Suspended",
      isSuspended: true,
    });
  });

  it("detects email confirmation login errors", () => {
    expect(isEmailConfirmationError("Email not confirmed")).toBe(true);
    expect(isEmailConfirmationError("Invalid login credentials")).toBe(false);
  });
});
