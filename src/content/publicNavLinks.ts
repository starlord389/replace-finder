import { ROUTES } from "@/app/routes/routeManifest";

export const PUBLIC_NAV_SECTION_HASHES = {
  process: "process",
  feature: "feature",
  contact: "contact",
} as const;

export type PublicNavSectionHash =
  (typeof PUBLIC_NAV_SECTION_HASHES)[keyof typeof PUBLIC_NAV_SECTION_HASHES];

export const PUBLIC_NAV_LINKS = [
  {
    label: "How It Works",
    to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.process}`,
    hash: PUBLIC_NAV_SECTION_HASHES.process,
  },
  {
    label: "Features",
    to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.feature}`,
    hash: PUBLIC_NAV_SECTION_HASHES.feature,
  },
  {
    label: "Contact",
    to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.contact}`,
    hash: PUBLIC_NAV_SECTION_HASHES.contact,
  },
] as const;

export const PUBLIC_FOOTER_LINKS = [
  { label: "Home", to: ROUTES.home },
  ...PUBLIC_NAV_LINKS,
  { label: "Login", to: ROUTES.login },
  { label: "Get Started", to: ROUTES.signup },
] as const;
