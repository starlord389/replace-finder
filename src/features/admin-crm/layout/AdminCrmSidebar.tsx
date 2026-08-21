import { NavLink, Link } from "react-router-dom";
import {
  BarChart3,
  Building2,
  BriefcaseBusiness,
  CalendarClock,
  Gauge,
  Handshake,
  Headphones,
  Inbox,
  LogOut,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { label: string; href: string; icon: LucideIcon; end?: boolean };

const workspace: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: Gauge, end: true },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Properties", href: "/admin/properties", icon: Building2 },
  { label: "Opportunities", href: "/admin/opportunities", icon: BriefcaseBusiness },
];

const operations: NavItem[] = [
  { label: "Communications", href: "/admin/communications", icon: MessageSquareText },
  { label: "Representation Requests", href: "/admin/representation-requests", icon: Handshake },
  { label: "Leads & Requests", href: "/admin/intake", icon: Inbox },
  { label: "Demo Requests", href: "/admin/demos", icon: CalendarClock },
  { label: "Support", href: "/admin/support", icon: Headphones },
];

const administration: NavItem[] = [
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "System & Audit", href: "/admin/system", icon: ShieldCheck },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function NavigationGroup({ label, items, onNavigate }: {
  label: string;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive ? "bg-emerald-500/15 text-emerald-300" : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default function AdminCrmSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut, hasRole } = useAuth();
  return (
    <div className="flex h-full flex-col bg-[#0d2138] text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <ExchangeLogoLockup
          markClassName="h-8"
          textClassName="text-[15px] tracking-[-0.03em] text-white"
          suffix="CRM"
          suffixClassName="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300"
        />
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
        <NavigationGroup label="Workspace" items={workspace} onNavigate={onNavigate} />
        <NavigationGroup label="Operations" items={operations} onNavigate={onNavigate} />
        <NavigationGroup label="Administration" items={administration} onNavigate={onNavigate} />
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 min-w-0">
          <p className="truncate text-xs font-medium text-slate-200">{user?.email}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">Administrator</p>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          {hasRole("agent") && <Link className="text-slate-400 hover:text-white" to="/agent/dashboard">Agent view</Link>}
          {hasRole("investor") && <Link className="text-slate-400 hover:text-white" to="/investor/dashboard">Owner view</Link>}
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-full justify-start px-2 text-slate-400 hover:bg-white/5 hover:text-white" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />Sign out
        </Button>
      </div>
    </div>
  );
}
