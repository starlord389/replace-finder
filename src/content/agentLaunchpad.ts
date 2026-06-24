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
    title: "Setup",
    description: "Get your workspace ready so the platform can start working for you.",
    icon: Settings2,
    steps: ["profile", "client", "exchange"],
  },
  {
    id: "workflow",
    title: "Daily workflow",
    description: "Learn the flow and run your pipeline day-to-day.",
    icon: Compass,
    steps: ["matching", "matches", "pipeline"],
  },
];

export const AGENT_LAUNCHPAD_STEPS: AgentLaunchpadStepContent[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your brokerage details, specializations, and a short bio so your workspace reflects how you operate.",
    tip: "Tip: Specializations and markets help us route the most relevant matches your way.",
    actionLabel: "Open settings",
    icon: UserCircle,
    href: "/agent/settings",
  },
  {
    id: "client",
    title: "Add your first client",
    description: "Create a client record for someone you're representing in a 1031 exchange so you can start real workflow activity.",
    tip: "Tip: You can invite the client later — start by capturing their info and replacement goals.",
    actionLabel: "Add client",
    icon: UserPlus,
    href: "/agent/clients/new",
  },
  {
    id: "exchange",
    title: "Create your first listing",
    description: "Pledge a property with financials and replacement criteria so the platform can begin scoring fit on your behalf.",
    tip: "Tip: The more accurate your criteria (price, geography, asset type, strategy), the sharper your matches.",
    actionLabel: "New listing",
    icon: FileText,
    href: "/agent/exchanges/new",
  },
  {
    id: "matching",
    title: "Understand how matching works",
    description: "See how 1031ExchangeUp privately scores opportunities for your clients before you start reviewing results.",
    tip: "Tip: This is a private platform — your clients never browse a public marketplace.",
    actionLabel: "See how matching works",
    icon: Workflow,
    isInline: true,
  },
  {
    id: "matches",
    title: "Review your matches",
    description: "Once a listing is active, matched properties appear here for you to evaluate and approve before sharing with your client.",
    tip: "Tip: Only matches you approve are surfaced to your client — you stay in control of what they see.",
    actionLabel: "View matches",
    icon: Search,
    href: "/agent/matches",
  },
  {
    id: "pipeline",
    title: "Move deals forward in Pipeline",
    description: "Track every approved match through conversation, LOI, under contract, and close from a single pipeline view.",
    tip: "Tip: Use Pipeline daily to keep every client's matches and conversations moving.",
    actionLabel: "Open Pipeline",
    icon: KanbanSquare,
    href: "/agent/pipeline",
  },
];
