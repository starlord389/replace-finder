import {
  scopeAdminUser360,
  useAdminUser360,
  type AdminAccountState,
  type AdminAuthAccount,
  type AdminUser360,
  type AdminUserScopedData,
  type AdminUserScope,
} from "@/features/admin/hooks/useAdminUser360";

export type CrmUserWorkspace = AdminUser360;
export type CrmUserWorkspaceView = AdminUserScopedData;
export type CrmWorkspaceScope = AdminUserScope;
export type CrmAuthAccount = AdminAuthAccount;
export type CrmAccountState = AdminAccountState;
export { scopeAdminUser360 as scopeCrmUserWorkspace };

/** One relationship-aware query boundary for an administrator's user workspace. */
export function useCrmUserWorkspace(userId: string | undefined) {
  return useAdminUser360(userId);
}
