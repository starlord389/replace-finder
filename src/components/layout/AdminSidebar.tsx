import { LayoutDashboard, HelpCircle, LogOut, ArrowLeftRight, Settings, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ExchangeLogoLockup, ExchangeLogoMark } from "@/components/brand/ExchangeLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const operationsItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
];

const managementItems = [
  { title: "Users & Roles", url: "/admin/users", icon: Users },
  { title: "Support", url: "/admin/support", icon: HelpCircle },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-4 border-b">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <ExchangeLogoLockup
                  markClassName="h-8"
                  textClassName="text-[15px] tracking-[-0.03em] text-foreground"
                  suffix="Admin"
                  suffixClassName="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700"
                />
              </div>
            )}
            {collapsed && (
              <ExchangeLogoMark className="h-7 w-auto" title="1031 Exchange Up" />
            )}
          </div>

          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationsItems.map((item) => (
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

          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
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
        </div>

        <SidebarFooter className="border-t p-3">
          {!collapsed && (
            <>
              <p className="mb-1 truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
              <Link
                to="/agent"
                className="mb-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeftRight className="h-3 w-3" />
                Switch to Agent View
              </Link>
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
