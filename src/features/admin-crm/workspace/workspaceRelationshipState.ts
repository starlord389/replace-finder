import type {
  AdminClientInvite,
  AdminUserClient,
} from "@/features/admin/hooks/useAdminUser360";
import type { Tables } from "@/integrations/supabase/types";

export type ClientWorkspaceAccessState = "self" | "connected" | "invited" | "crm_only";

export type ClientWorkspaceAccess = {
  state: ClientWorkspaceAccessState;
  label: string;
  detail: string;
  invite: AdminClientInvite | null;
};

export function getClientWorkspaceAccess(
  client: AdminUserClient,
  invites: AdminClientInvite[],
): ClientWorkspaceAccess {
  const invite = invites
    .filter((row) => row.client_id === client.id)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;

  if (client.client_user_id && client.client_user_id === client.agent_id) {
    return {
      state: "self",
      label: "Self-owned",
      detail: "The agent is also the property owner and is recorded as their own client.",
      invite,
    };
  }
  if (client.client_user_id || invite?.status === "accepted" || invite?.accepted_user_id) {
    return {
      state: "connected",
      label: "Platform connected",
      detail: "This client has their own property-owner workspace.",
      invite,
    };
  }
  if (invite?.status === "pending") {
    return {
      state: "invited",
      label: "Invite pending",
      detail: `Workspace invitation sent to ${invite.email}.`,
      invite,
    };
  }
  return {
    state: "crm_only",
    label: "CRM only",
    detail: "The agent manages this client without a client login.",
    invite,
  };
}

export function getOwnerRepresentations(
  userId: string,
  representations: Tables<"agent_representations">[],
) {
  return representations
    .filter((row) => row.investor_id === userId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getActiveOwnerRepresentation(
  userId: string,
  representations: Tables<"agent_representations">[],
) {
  return getOwnerRepresentations(userId, representations).find((row) => row.status === "active") ?? null;
}
