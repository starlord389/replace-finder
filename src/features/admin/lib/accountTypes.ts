export const INVESTOR_ACCOUNT_LABEL = "Investor / Property Owner";

export function isInvestorOwned(ownerType: string | null | undefined) {
  return ownerType === "investor";
}

export function exchangeOwnerTypeLabel(ownerType: string | null | undefined) {
  return isInvestorOwned(ownerType) ? INVESTOR_ACCOUNT_LABEL : "Agent";
}

export function exchangeManagedForLabel(
  ownerType: string | null | undefined,
  clientName: string | null | undefined,
) {
  return isInvestorOwned(ownerType) ? "Self-managed" : clientName?.trim() || "Client unavailable";
}

export function adminRoleLabel(role: string) {
  if (role === "investor") return INVESTOR_ACCOUNT_LABEL;
  return role.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function adminRoleSummary(roles: string[]) {
  if (roles.length === 0) return "No assigned role";
  return roles.map(adminRoleLabel).join(" · ");
}
