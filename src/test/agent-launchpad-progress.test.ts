import { describe, expect, it } from "vitest";
import {
  countFilledProfileFields,
  isAgentProfileComplete,
} from "@/features/agent/hooks/useAgentLaunchpadProgress";

describe("agent launchpad profile completion", () => {
  it("requires brokerage details, bio, and specializations", () => {
    expect(
      isAgentProfileComplete({
        brokerage_name: "Acme Realty",
        brokerage_address: "123 Main St",
        bio: "Focused on multifamily exchanges.",
        specializations: ["multifamily"],
      }),
    ).toBe(true);
  });

  it("returns false when any required field is missing", () => {
    expect(
      isAgentProfileComplete({
        brokerage_name: "Acme Realty",
        brokerage_address: null,
        bio: "Focused on multifamily exchanges.",
        specializations: ["multifamily"],
      }),
    ).toBe(false);

    expect(
      isAgentProfileComplete({
        brokerage_name: "Acme Realty",
        brokerage_address: "123 Main St",
        bio: "",
        specializations: ["multifamily"],
      }),
    ).toBe(false);

    expect(
      isAgentProfileComplete({
        brokerage_name: "Acme Realty",
        brokerage_address: "123 Main St",
        bio: "Focused on multifamily exchanges.",
        specializations: [],
      }),
    ).toBe(false);
  });

  it("counts partially filled profiles for in-progress state", () => {
    expect(
      countFilledProfileFields({
        brokerage_name: "Acme",
        brokerage_address: null,
        bio: null,
        specializations: null,
      }),
    ).toBe(1);

    expect(
      countFilledProfileFields({
        brokerage_name: "Acme",
        brokerage_address: "123 Main",
        bio: "Bio",
        specializations: ["mf"],
      }),
    ).toBe(4);
  });
});
