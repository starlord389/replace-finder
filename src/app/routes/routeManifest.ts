export type AppRouteRole = "public" | "agent" | "admin" | "client";

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  howItWorks: "/how-it-works",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  agentHome: "/agent",
  agentLaunchpad: "/agent/launchpad",
  adminHome: "/admin",
  clientHome: "/dashboard",
  unavailable: "/unavailable",
} as const;

export function getDefaultRouteForRole(role: string | null | undefined): string {
  if (role === "admin") return ROUTES.adminHome;
  if (role === "agent") return ROUTES.agentHome;
  if (role === "client") return ROUTES.clientHome;
  return ROUTES.agentHome;
}

export function getAgentPostLoginRoute(
  launchpadCompletedAt: string | null | undefined,
  verificationStatus?: string | null,
) {
  if (verificationStatus === "suspended") return ROUTES.agentHome;
  return launchpadCompletedAt ? ROUTES.agentHome : ROUTES.agentLaunchpad;
}
