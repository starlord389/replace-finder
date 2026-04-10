import { ROUTES, getDefaultRouteForRole } from "./routeManifest";

export function getUnauthorizedRedirectPath(role: string | null | undefined): string {
  if (!role) return ROUTES.login;
  return getDefaultRouteForRole(role);
}

export function isKnownRole(role: string | null | undefined): role is "admin" | "agent" | "client" {
  return role === "admin" || role === "agent" || role === "client";
}
