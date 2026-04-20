import {
  LayoutDashboard, Users, ArrowLeftRight, Handshake, Link2,
  MessageSquare, Settings, HelpCircle, LogOut, Compass,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const networkItems = [
  { title: "Launchpad", url: "/agent/launchpad", icon: Compass },
  { title: "Dashboard", url: "/agent", icon: LayoutDashboard, end: true },
  { title: "My Clients", url: "/agent/clients", icon: Users },
  { title: "Exchanges", url: "/agent/exchanges", icon: ArrowLeftRight },
  { title: "Matches", url: "/agent/matches", icon: Handshake },
  { title: "Connections", url: "/agent/connections", icon: Link2 },
];

const toolsItems = [
  { title: "Messages", url: "/agent/messages", icon: MessageSquare },
];

const accountItems = [
  { title: "Settings", url: "/agent/settings", icon: Settings },
  { title: "Help", url: "/agent/help", icon: HelpCircle },
];

export default function AgentSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut, profileName } = useAuth();
  const [brokerageName, setBrokerageName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("brokerage_name").eq("id", user.id).single()
      .then(({ data }) => setBrokerageName(data?.brokerage_name ?? null));
  }, [user]);

  const renderGroup = (label: string, items: typeof networkItems) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.end}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  activeClassName="bg-primary/10 text-primary"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center gap-2 px-4 py-4 border-b">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  1031<span className="text-primary">ExchangeUp</span>
                </span>
                <span className="rounded bg-[#FADC6A]/25 px-1.5 py-0.5 text-[10px] font-semibold text-[#1d1d1d]">
                  Agent
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">1031</span>
            )}
          </div>

          {renderGroup("Exchange Network", networkItems)}
          {renderGroup("Tools", toolsItems)}
          {renderGroup("Account", accountItems)}
        </div>

        <SidebarFooter className="border-t p-3">
          {!collapsed && (
            <>
              <p className="truncate text-sm font-medium text-foreground">
                {profileName || user?.email}
              </p>
              {brokerageName && (
                <p className="mb-2 truncate text-xs text-muted-foreground">{brokerageName}</p>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Sign Out"}
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
