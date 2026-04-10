import { describe, it, expect } from "vitest";
import { getDefaultRouteForRole, ROUTES } from "@/app/routes/routeManifest";
import { getUnauthorizedRedirectPath, isKnownRole } from "@/app/routes/routeGuards";

describe("route policy helpers", () => {
  it("returns default route by role", () => {
    expect(getDefaultRouteForRole("agent")).toBe(ROUTES.agentHome);
    expect(getDefaultRouteForRole("admin")).toBe(ROUTES.adminHome);
    expect(getDefaultRouteForRole("client")).toBe(ROUTES.clientHome);
    expect(getDefaultRouteForRole("unknown")).toBe(ROUTES.agentHome);
  });

  it("returns unauthorized redirect path", () => {
    expect(getUnauthorizedRedirectPath(null)).toBe(ROUTES.login);
    expect(getUnauthorizedRedirectPath("agent")).toBe(ROUTES.agentHome);
    expect(getUnauthorizedRedirectPath("admin")).toBe(ROUTES.adminHome);
  });

  it("flags known roles", () => {
    expect(isKnownRole("agent")).toBe(true);
    expect(isKnownRole("admin")).toBe(true);
    expect(isKnownRole("client")).toBe(true);
    expect(isKnownRole("broker")).toBe(false);
  });
});
