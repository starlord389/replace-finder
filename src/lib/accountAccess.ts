export function isAccountSuspended(status: string | null | undefined): boolean {
  return status === "suspended";
}

export function isEmailConfirmationError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /email.*confirm/i.test(message);
}

export function getSuspendedAccountUi() {
  return {
    title: "Account suspended",
    description: "Your workspace is temporarily restricted. Contact support@1031exchangeup.com to restore access.",
  };
}
