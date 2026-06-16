import { ROUTES } from "@/app/routes/routeManifest";

export const PUBLIC_NAV_SECTION_HASHES = {
  process: "process",
  feature: "feature",
  agentsOnly: "agents-only",
  pricing: "pricing",
  faq: "faq",
  contact: "contact",
} as const;

export type PublicNavSectionHash =
  (typeof PUBLIC_NAV_SECTION_HASHES)[keyof typeof PUBLIC_NAV_SECTION_HASHES];

export type PublicNavItem = {
  label: string;
  /** Homepage section this scrolls to. */
  hash: PublicNavSectionHash;
  /** Full route+hash target, e.g. "/#process". */
  to: string;
};

export type PublicNavGroup = {
  label: string;
  items: readonly PublicNavItem[];
};

function item(label: string, hash: PublicNavSectionHash): PublicNavItem {
  return { label, hash, to: `${ROUTES.home}#${hash}` };
}

// The two nav dropdowns. Each label is a category umbrella; the items are
// real site sections. Some sections are built in a later step — their links
// are wired now and simply no-op until the section exists.
export const PUBLIC_NAV_GROUPS: readonly PublicNavGroup[] = [
  {
    label: "Product",
    items: [
      item("How It Works", PUBLIC_NAV_SECTION_HASHES.process),
      item("Features", PUBLIC_NAV_SECTION_HASHES.feature),
      item("Why Agents Only", PUBLIC_NAV_SECTION_HASHES.agentsOnly),
    ],
  },
  {
    label: "Resources",
    items: [
      item("Pricing", PUBLIC_NAV_SECTION_HASHES.pricing),
      item("FAQ", PUBLIC_NAV_SECTION_HASHES.faq),
      item("Contact", PUBLIC_NAV_SECTION_HASHES.contact),
    ],
  },
] as const;

export const PUBLIC_FOOTER_LINKS = [
  { label: "Home", to: ROUTES.home },
  { label: "How It Works", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.process}` },
  { label: "Features", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.feature}` },
  { label: "For Landlords", to: ROUTES.forLandlords },
  { label: "Contact", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.contact}` },
  { label: "Login", to: ROUTES.login },
  { label: "Get Started", to: ROUTES.signup },
] as const;
