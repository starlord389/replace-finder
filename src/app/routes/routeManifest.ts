export type AppRouteRole = "public" | "agent" | "admin" | "client";

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  howItWorks: "/how-it-works",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  agentHome: "/agent",
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
