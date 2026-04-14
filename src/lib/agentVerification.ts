export function hasOperationalAgentAccess(status: string | null | undefined): boolean {
  return status !== "suspended";
}

export function isEmailConfirmationError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /email.*confirm/i.test(message);
}

export interface AgentVerificationUiState {
  badgeLabel: string;
  badgeClassName: string;
  title: string;
  description: string;
  isSuspended: boolean;
}

export function getAgentVerificationUiState(status: string | null | undefined): AgentVerificationUiState {
  if (status === "suspended") {
    return {
      badgeLabel: "Suspended",
      badgeClassName: "bg-red-100 text-red-700",
      title: "Account suspended",
      description: "Your workspace is temporarily restricted. Contact support@1031exchangeup.com to restore access.",
      isSuspended: true,
    };
  }

  return {
    badgeLabel: "Self-Certified",
    badgeClassName: "bg-green-100 text-green-700",
    title: "Self-certified and ready to work",
    description: "Your agent workspace is active. Finish the rest of your profile later in Settings.",
    isSuspended: false,
  };
}
