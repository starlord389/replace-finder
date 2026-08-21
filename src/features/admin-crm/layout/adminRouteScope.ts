export type AdminRouteScopeMode = "workspace" | "platform" | "live-only";

const platformWidePrefixes = [
  "/admin/intake",
  "/admin/demos",
  "/admin/feedback",
  "/admin/system",
  "/admin/settings",
];

export function adminRouteScopeMode(pathname: string): AdminRouteScopeMode {
  if (pathname.startsWith("/admin/reports")) return "live-only";
  if (platformWidePrefixes.some((prefix) => pathname.startsWith(prefix))) return "platform";
  return "workspace";
}

