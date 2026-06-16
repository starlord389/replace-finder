import {
  HelpCircle, Layers, Mail, Route, ShieldCheck, Tag, type LucideIcon,
} from "lucide-react";
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
// real site sections (rendered as a mega-menu with icon + description).
// Some sections are built in a later step — their links are wired now and
// simply no-op until the section exists.
export const PUBLIC_NAV_GROUPS: readonly PublicNavGroup[] = [
  {
    label: "Product",
    items: [
      item("How It Works", PUBLIC_NAV_SECTION_HASHES.process, Route, "Pledge a listing, get matched, close"),
      item("Features", PUBLIC_NAV_SECTION_HASHES.feature, Layers, "Off-market network & match scoring"),
      item("Why Agents Only", PUBLIC_NAV_SECTION_HASHES.agentsOnly, ShieldCheck, "A network where everyone can transact"),
    ],
  },
  {
    label: "Resources",
    items: [
      item("Pricing", PUBLIC_NAV_SECTION_HASHES.pricing, Tag, "Free for founding agents"),
      item("FAQ", PUBLIC_NAV_SECTION_HASHES.faq, HelpCircle, "Common questions, answered"),
      item("Contact", PUBLIC_NAV_SECTION_HASHES.contact, Mail, "Get in touch with our team"),
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
