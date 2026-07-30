import {
  Settings2, Compass,
  UserCircle, UserPlus, FileText, Workflow, Search, KanbanSquare,
  type LucideIcon,
} from "lucide-react";

export type AgentLaunchpadStepId =
  | "profile"
  | "client"
  | "exchange"
  | "matching"
  | "matches"
  | "pipeline";

export interface AgentLaunchpadGroup {
  id: "setup" | "workflow";
  title: string;
  description: string;
  icon: LucideIcon;
  steps: AgentLaunchpadStepId[];
}

export interface AgentLaunchpadStepContent {
  id: AgentLaunchpadStepId;
  title: string;
  description: string;
  tip: string;
  actionLabel: string;
  icon: LucideIcon;
  href?: string;
  isInline?: boolean;
}

export const AGENT_LAUNCHPAD_GROUPS: AgentLaunchpadGroup[] = [
  {
    id: "setup",
    title: "Set up your workspace",
    description: "A few one-time details so the platform can start working for you.",
    icon: Settings2,
    steps: ["profile", "client", "exchange"],
  },
  {
    id: "workflow",
    title: "Run your pipeline",
    description: "The day-to-day flow: review matches, connect, and move deals to close.",
    icon: Compass,
    steps: ["matching", "matches", "pipeline"],
  },
];

export const AGENT_LAUNCHPAD_STEPS: AgentLaunchpadStepContent[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your brokerage, markets, and a short bio so counterparties know who they're dealing with.",
    tip: "Your specializations and markets sharpen the matches we surface for your clients.",
    actionLabel: "Open settings",
    icon: UserCircle,
    href: "/agent/settings",
  },
  {
    id: "client",
    title: "Add your first client",
    description: "Create a client record for someone you're representing so you can attach listings and matches to them.",
    tip: "You don't have to invite the client yet — start with their info and replacement goals.",
    actionLabel: "Add client",
    icon: UserPlus,
    href: "/agent/clients/new",
  },
  {
    id: "exchange",
    title: "Create your first listing",
    description: "Pledge a property with financials and replacement criteria — the more accurate, the sharper the matches.",
    tip: "Price, geography, asset type, and strategy are the biggest signals in our scoring.",
    actionLabel: "New listing",
    icon: FileText,
    href: "/agent/exchanges/new",
  },
  {
    id: "matching",
    title: "See how matching works",
    description: "A quick tour of how we privately score fit for your clients before you review results.",
    tip: "This is a private platform — your clients never browse a public marketplace.",
    actionLabel: "See how matching works",
    icon: Workflow,
    isInline: true,
  },
  {
    id: "matches",
    title: "Review your matches",
    description: "Open the matches inbox to evaluate properties we've scored for your listings.",
    tip: "Only matches you approve are surfaced to your client — you stay in control of what they see.",
    actionLabel: "View matches",
    icon: Search,
    href: "/agent/matches",
  },
  {
    id: "pipeline",
    title: "Move deals forward in Pipeline",
    description: "Track every approved match from conversation through LOI, under contract, and close.",
    tip: "Use Pipeline daily so every client's next property is lined up early.",
    actionLabel: "Open Pipeline",
    icon: KanbanSquare,
    href: "/agent/pipeline",
  },
];
