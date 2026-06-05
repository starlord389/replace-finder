import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, HelpCircle, LogOut, Menu, Plus, Settings, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";

import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  url: string;
  end?: boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { title: "Dashboard", url: "/agent/dashboard", end: true },
  { title: "My Clients", url: "/agent/clients" },
  { title: "Launchpad", url: "/agent/launchpad" },
];

function NotificationsBell() {
  const { data: notifications = [], unreadCount, markAllRead, markOneRead } = useNotifications();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No notifications yet. You'll be notified about new matches and connection requests.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const Inner = (
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          n.read ? "text-muted-foreground" : "font-semibold text-foreground",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link_to ? (
                      <Link
                        to={n.link_to}
                        onClick={() => !n.read && markOneRead.mutate(n.id)}
                        className="block px-3 py-2.5 transition-colors hover:bg-muted/60"
                      >
                        {Inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.read && markOneRead.mutate(n.id)}
                        className="w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                      >
                        {Inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function AgentTopNav() {
  const { user, signOut, profileName } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const initial = (profileName ?? user?.email ?? "U").charAt(0).toUpperCase();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4dcd0] bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link to="/agent/dashboard" className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            1031<span className="text-primary">ExchangeUp</span>
          </span>
          <span className="rounded bg-[#FADC6A]/25 px-1.5 py-0.5 text-[10px] font-semibold text-[#1d1d1d]">
            Agent
          </span>
        </Link>

        {/* Desktop primary nav */}
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeClassName="bg-primary/10 text-primary"
            >
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
          {/* Desktop right cluster */}
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild size="sm">
              <Link to="/agent/clients/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Client
              </Link>
            </Button>
            <NotificationsBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition hover:bg-primary/15"
                  aria-label="Account menu"
                >
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {profileName || user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/agent/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/agent/help">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile cluster: bell + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <NotificationsBell />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="flex h-full flex-col">
                  <div className="border-b px-4 py-4">
                    <p className="truncate text-sm font-medium text-foreground">
                      {profileName || user?.email}
                    </p>
                  </div>
                  <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                    {PRIMARY_NAV.map((item) => (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end={item.end}
                        className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        activeClassName="bg-primary/10 text-primary"
                      >
                        {item.title}
                      </NavLink>
                    ))}
                    <Link
                      to="/agent/clients/new"
                      className="mt-2 flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Client
                    </Link>
                    <div className="my-3 border-t" />
                    <Link
                      to="/agent/settings"
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                    <Link
                      to="/agent/help"
                      className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <HelpCircle className="mr-2 h-4 w-4" /> Help
                    </Link>
                  </nav>
                  <div className="border-t p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
