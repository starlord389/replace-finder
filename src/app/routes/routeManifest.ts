export type AppRouteRole = "public" | "agent" | "admin";

export const ROUTES = {
  home: "/",
  bookDemo: "/book-demo",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  agentHome: "/agent",
  agentLaunchpad: "/agent/launchpad",
  adminHome: "/admin",
} as const;

export function getDefaultRouteForRole(role: string | null | undefined): string {
  if (role === "admin") return ROUTES.adminHome;
  return ROUTES.agentHome;
}

export function getAgentPostLoginRoute(
  launchpadCompletedAt: string | null | undefined,
  verificationStatus?: string | null,
) {
  if (verificationStatus === "suspended") return ROUTES.agentHome;
  return launchpadCompletedAt ? ROUTES.agentHome : ROUTES.agentLaunchpad;
}
