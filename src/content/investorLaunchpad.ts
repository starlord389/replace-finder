import {
  Building2,
  Compass,
  FileCheck2,
  KanbanSquare,
  Search,
  Settings2,
  UserCircle,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type InvestorLaunchpadStepId =
  | "profile"
  | "listing"
  | "publish"
  | "matching"
  | "matches"
  | "pipeline";

export interface InvestorLaunchpadGroup {
  id: "setup" | "workflow";
  title: string;
  description: string;
  icon: LucideIcon;
  steps: InvestorLaunchpadStepId[];
}

export interface InvestorLaunchpadStepContent {
  id: InvestorLaunchpadStepId;
  title: string;
  description: string;
  tip: string;
  icon: LucideIcon;
  href?: string;
  isInline?: boolean;
}

export const INVESTOR_LAUNCHPAD_GROUPS: InvestorLaunchpadGroup[] = [
  {
    id: "setup",
    title: "Set up your exchange",
    description: "Add your details and current property so the platform can calculate your exchange position.",
    icon: Settings2,
    steps: ["profile", "listing", "publish"],
  },
  {
    id: "workflow",
    title: "Run your pipeline",
    description: "Review qualified matches, connect with listing agents, and move your exchange forward.",
    icon: Compass,
    steps: ["matching", "matches", "pipeline"],
  },
];

export const INVESTOR_LAUNCHPAD_STEPS: InvestorLaunchpadStepContent[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your name, company or ownership entity, and phone number for exchange communications.",
    tip: "Your contact details stay private until you connect with a listing agent.",
    icon: UserCircle,
    href: "/investor/settings",
  },
  {
    id: "listing",
    title: "List your current property",
    description: "Enter the property and financial information used to calculate your equity and current return on equity.",
    tip: "Accurate value, loan balance, rent, and expenses give the matching engine the clearest starting point.",
    icon: Building2,
    href: "/investor/exchanges/new",
  },
  {
    id: "publish",
    title: "Publish your exchange",
    description: "Publish the property when it is ready so automatic matching can begin.",
    tip: "You can keep multiple exchanges active and manage each one separately.",
    icon: FileCheck2,
    href: "/investor/listings",
  },
  {
    id: "matching",
    title: "See how matching works",
    description: "A quick tour of how your equity and projected return determine which replacement properties you see.",
    tip: "There is no public property marketplace and no exchange-criteria form.",
    icon: Workflow,
    isInline: true,
  },
  {
    id: "matches",
    title: "Review your qualified matches",
    description: "Compare replacement properties that fit your buying-power ceiling and improve projected return on equity.",
    tip: "Properties appear only after the automatic engine qualifies them for one of your exchanges.",
    icon: Search,
    href: "/investor/matches",
  },
  {
    id: "pipeline",
    title: "Move deals forward in Pipeline",
    description: "Track conversations with listing agents from the first message through offer, contract, and close.",
    tip: "Use Pipeline to keep every active exchange and agent conversation organized.",
    icon: KanbanSquare,
    href: "/investor/pipeline",
  },
];
