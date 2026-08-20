import {
  useAdminUserDirectory,
  type AdminUserDirectoryAccountStatus,
  type AdminUserDirectoryDataScope,
  type AdminUserDirectoryPage,
  type AdminUserDirectoryParams,
  type AdminUserDirectoryRow,
  type AdminUserDirectorySort,
} from "@/features/admin/hooks/useAdminUserDirectory";

export type CrmUser = AdminUserDirectoryRow;
export type CrmUsersPage = AdminUserDirectoryPage;
export type CrmUsersParams = AdminUserDirectoryParams;
export type CrmUserSort = AdminUserDirectorySort;
export type CrmUserDataScope = AdminUserDirectoryDataScope;
export type CrmUserAccountStatus = AdminUserDirectoryAccountStatus;

/**
 * The CRM owns this boundary even while the server contract is shared with the
 * legacy admin rollout. Pages should import the CRM contract, not database
 * implementation details.
 */
export function useCrmUsers(params: CrmUsersParams = {}) {
  return useAdminUserDirectory(params);
}
