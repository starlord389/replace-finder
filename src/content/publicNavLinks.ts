import {
  Calculator, Clock, HelpCircle, Layers, LayoutGrid, Route, Tag, Users, type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/app/routes/routeManifest";

// Hashes match the section ids rendered on the native homepage (src/pages/Home.tsx).
export const PUBLIC_NAV_SECTION_HASHES = {
  problem: "problem",
  process: "process",
  feature: "feature",
  coverage: "coverage",
  whyAgents: "why-agents",
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
      item("The Problem", PUBLIC_NAV_SECTION_HASHES.problem, Clock, "Finding a replacement in the 45-day window"),
      item("How It Works", PUBLIC_NAV_SECTION_HASHES.process, Route, "Add a listing, get matched, connect"),
      item("Features", PUBLIC_NAV_SECTION_HASHES.feature, Layers, "The network & match scoring"),
      item("Asset Classes", PUBLIC_NAV_SECTION_HASHES.coverage, LayoutGrid, "Replacement inventory in every property type"),
    ],
  },
  {
    label: "Resources",
    items: [
      item("Why Agents Join", PUBLIC_NAV_SECTION_HASHES.whyAgents, Users, "Generate business, grow your network"),
      item("ROE Calculator", PUBLIC_NAV_SECTION_HASHES.roeCalculator, Calculator, "See if your client's equity should exchange"),
      item("Pricing", PUBLIC_NAV_SECTION_HASHES.pricing, Tag, "Free for founding agents"),
      item("FAQ", PUBLIC_NAV_SECTION_HASHES.faq, HelpCircle, "Common questions, answered"),
    ],
  },
] as const;

export const PUBLIC_FOOTER_LINKS = [
  { label: "Home", to: ROUTES.home },
  { label: "The Problem", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.problem}` },
  { label: "How It Works", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.process}` },
  { label: "Features", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.feature}` },
  { label: "Asset Classes", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.coverage}` },
  { label: "Why Agents Join", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.whyAgents}` },
  { label: "Pricing", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.pricing}` },
  { label: "ROE Calculator", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.roeCalculator}` },
  { label: "FAQ", to: `${ROUTES.home}#${PUBLIC_NAV_SECTION_HASHES.faq}` },
  { label: "For Landlords", to: ROUTES.forLandlords },
  { label: "Login", to: ROUTES.login },
  { label: "Get Started", to: ROUTES.signup },
  { label: "Privacy Policy", to: ROUTES.privacy },
  { label: "Terms & Conditions", to: ROUTES.terms },
] as const;
