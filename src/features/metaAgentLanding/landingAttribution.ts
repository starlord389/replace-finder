import { ROUTES } from "@/app/routes/routeManifest";

/**
 * Meta campaign parameters we expose to telemetry. The CTA itself keeps every
 * incoming query parameter so campaign naming can evolve without a page deploy.
 */
export const META_ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "campaign_id",
  "campaignId",
  "adset_id",
  "ad_set_id",
  "adsetId",
  "ad_id",
  "adId",
  "creative",
  "creative_id",
  "creative_angle",
  "angle",
  "placement",
] as const;

export type AgentLandingAttribution = Record<string, string>;

export function readAgentLandingAttribution(
  search: string | URLSearchParams,
): AgentLandingAttribution {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;

  return META_ATTRIBUTION_KEYS.reduce<AgentLandingAttribution>((values, key) => {
    const value = params.get(key);
    if (value) values[key] = value;
    return values;
  }, {});
}

export function getCreativeAngle(attribution: AgentLandingAttribution): string | null {
  return (
    attribution.creative_angle ??
    attribution.angle ??
    attribution.creative_id ??
    attribution.creative ??
    attribution.utm_content ??
    null
  );
}

export function buildAgentSignupDestination(search: string | URLSearchParams): string {
  const incoming =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : new URLSearchParams(search);

  // Agent is intentionally set last so an incoming role parameter can never
  // return paid agent traffic to the audience-selection screen.
  incoming.set("role", "agent");
  return `${ROUTES.signup}?${incoming.toString()}`;
}
