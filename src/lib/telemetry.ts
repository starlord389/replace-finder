type TelemetryEvent =
  | "app_render_error"
  | "auth_login_success"
  | "auth_login_failure"
  | "exchange_create_requested"
  | "matching_invoked"
  | "connection_initiated"
  | "auth_callback_redirect";

interface TelemetryPayload {
  [key: string]: unknown;
}

export function trackEvent(event: TelemetryEvent, payload: TelemetryPayload = {}) {
  // Keep this lightweight until a vendor sink is wired.
  console.info(`[telemetry] ${event}`, {
    ...payload,
    timestamp: new Date().toISOString(),
  });
}
