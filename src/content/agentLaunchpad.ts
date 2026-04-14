import {
  Settings2, Globe,
  UserCircle, UserPlus, FileText, Workflow, Search, Handshake,
  type LucideIcon,
} from "lucide-react";

export type AgentLaunchpadStepId =
  | "profile"
  | "client"
  | "exchange"
  | "matching"
  | "matches"
  | "connection";

export interface AgentLaunchpadGroup {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  steps: AgentLaunchpadStepId[];
}

export interface AgentLaunchpadStepContent {
  id: AgentLaunchpadStepId;
  title: string;
  description: string;
  actionLabel: string;
  icon: LucideIcon;
  href?: string;
  isInline?: boolean;
}

export const AGENT_LAUNCHPAD_GROUPS: AgentLaunchpadGroup[] = [
  {
    id: "setup",
    title: "Foundational Setup",
    description: "Complete the core tasks that make your agent workspace usable and match-ready.",
    icon: Settings2,
    steps: ["profile", "client", "exchange"],
  },
  {
    id: "network",
    title: "Matching & Connections",
    description: "Learn the matching flow, review opportunities, and initiate collaboration.",
    icon: Globe,
    steps: ["matching", "matches", "connection"],
  },
];

export const AGENT_LAUNCHPAD_STEPS: AgentLaunchpadStepContent[] = [
  {
    id: "profile",
    title: "Complete your profile",
    description: "Add your brokerage details, specializations, and bio so your workspace reflects how you operate.",
    actionLabel: "Open settings",
    icon: UserCircle,
    href: "/agent/settings",
  },
  {
    id: "client",
    title: "Add your first client",
    description: "Create a client record for someone you're representing in a 1031 exchange so you can start real workflow activity.",
    actionLabel: "Add client",
    icon: UserPlus,
    href: "/agent/clients/new",
  },
  {
    id: "exchange",
    title: "Create your first exchange",
    description: "Pledge a property and set replacement criteria so the network can begin finding relevant opportunities.",
    actionLabel: "New exchange",
    icon: FileText,
    href: "/agent/exchanges/new",
  },
  {
    id: "matching",
    title: "Understand how matching works",
    description: "See how 1031ExchangeUp scores and connects opportunities across the network before you start reviewing results.",
    actionLabel: "See how matching works",
    icon: Workflow,
    isInline: true,
  },
  {
    id: "matches",
    title: "Review your matches",
    description: "Once your exchange is active, this is where matched properties appear for evaluation and follow-up.",
    actionLabel: "View matches",
    icon: Search,
    href: "/agent/matches",
  },
  {
    id: "connection",
    title: "Start your first connection",
    description: "When you find a strong fit, initiate a connection to move the exchange forward and unlock counterpart visibility.",
    actionLabel: "Open connections",
    icon: Handshake,
    href: "/agent/connections",
  },
];
