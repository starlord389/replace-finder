import {
  Calculator, HelpCircle, Layers, LayoutGrid, Route, Tag, type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";

// Hashes match the section ids rendered on the native homepage (src/pages/Home.tsx).
export const PUBLIC_NAV_SECTION_HASHES = {
  process: "process",
  feature: "feature",
  coverage: "coverage",
  roeCalculator: "roe-calculator",
  pricing: "pricing",
  faq: "faq",
} as const;

export type PublicNavSectionHash =
  (typeof PUBLIC_NAV_SECTION_HASHES)[keyof typeof PUBLIC_NAV_SECTION_HASHES];

export type PublicNavItem = {
  label: string;
  /** Homepage section this scrolls to. */
  hash: PublicNavSectionHash;
  /** Full route+hash target, e.g. "/#process". */
  to: string;
  icon: LucideIcon;
  description: string;
};

export type PublicNavGroup = {
  label: string;
  items: readonly PublicNavItem[];
};

function item(
  label: string,
  hash: PublicNavSectionHash,
  icon: LucideIcon,
  description: string,
): PublicNavItem {
  return { label, hash, to: `${ROUTES.home}#${hash}`, icon, description };
}

// The two nav dropdowns. Each label is a category umbrella; the items are
// real homepage sections (rendered as a mega-menu with icon + description).
export const PUBLIC_NAV_GROUPS: readonly PublicNavGroup[] = [
  {
    label: "Product",
    items: [
      item("How It Works", PUBLIC_NAV_SECTION_HASHES.process, Route, "Add a listing, get matched, connect"),
      item("Features", PUBLIC_NAV_SECTION_HASHES.feature, Layers, "Off-market network & match scoring"),
      item("Asset Classes", PUBLIC_NAV_SECTION_HASHES.coverage, LayoutGrid, "Off-market inventory in every property type"),
    ],
  },
  {
    label: "Resources",
    items: [
      item("ROE Calculator", PUBLIC_NAV_SECTION_HASHES.roeCalculator, Calculator, "See if your client's equity should exchange"),
      item("Pricing", PUBLIC_NAV_SECTION_HASHES.pricing, Tag, "Free for founding agents"),
      item("FAQ", PUBLIC_NAV_SECTION_HASHES.faq, HelpCircle, "Common questions, answered"),
    ],
  },
] as const;

export const PUBLIC_FOOTER_LINKS = [
  { label: "Home", to: ROUTES.home },
  { label: "How It Works", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.process}` },
  { label: "Features", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.feature}` },
  { label: "Asset Classes", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.coverage}` },
  { label: "Pricing", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.pricing}` },
  { label: "ROE Calculator", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.roeCalculator}` },
  { label: "FAQ", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.faq}` },
  { label: "For Landlords", to: ROUTES.forLandlords },
  { label: "Login", to: ROUTES.login },
  { label: "Get Started", to: ROUTES.signup },
] as const;
