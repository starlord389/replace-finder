export type AppRouteRole = "public" | "agent" | "investor" | "admin";

export const ROUTES = {
  home: "/",
  forLandlords: "/landlords",
  forAgents: "/agents",
  forInvestors: "/investors",
  bookDemo: "/book-demo",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  privacy: "/privacy",
  terms: "/terms",
  metaAgentReplacementProperty: "/meta/agents/replacement-property",
  agentHome: "/agent",
  agentLaunchpad: "/agent/launchpad",
  investorHome: "/investor",
  adminHome: "/admin",
} as const;

export function getDefaultRouteForRole(role: string | null | undefined): string {
  if (role === "admin") return ROUTES.adminHome;
  if (role === "investor") return ROUTES.investorHome;
  return ROUTES.agentHome;
}

export function getAgentPostLoginRoute(
  launchpadCompletedAt: string | null | undefined,
) {
  return launchpadCompletedAt ? ROUTES.agentHome : ROUTES.agentLaunchpad;
}
