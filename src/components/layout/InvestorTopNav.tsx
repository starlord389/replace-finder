import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, Bell, HelpCircle, LogOut, Menu, Settings, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { cn } from "@/lib/utils";

const NAV = [
  { title: "Launchpad", url: "/investor/launchpad" },
  { title: "Dashboard", url: "/investor/dashboard" },
  { title: "My Exchanges", url: "/investor/listings", active: /^\/investor\/(listings|exchanges\/)/ },
  { title: "Pipeline", url: "/investor/pipeline" },
  { title: "Matches", url: "/investor/matches" },
  { title: "My Agent", url: "/investor/representation" },
];

function WorkspaceToggle({ full = false }: { full?: boolean }) {
  const { isDemo, setMode } = useWorkspaceMode();
  const navigate = useNavigate();
  const go = (mode: "live" | "demo") => { setMode(mode); navigate("/investor/dashboard"); };
  return (
    <div className={cn("flex items-center rounded-full border bg-muted/40 p-0.5 text-xs font-semibold", full && "w-full")}>
      <button onClick={() => go("live")} className={cn("flex-1 rounded-full px-3 py-1", !isDemo ? "bg-emerald-600 text-white" : "text-muted-foreground")}>Live</button>
      <button onClick={() => go("demo")} className={cn("flex-1 rounded-full px-3 py-1", isDemo ? "bg-amber-500 text-white" : "text-muted-foreground")}>Demo</button>
    </div>
  );
}

export default function InvestorTopNav() {
  const { user, profileName, hasRole, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const initial = (profileName ?? user?.email ?? "I").charAt(0).toUpperCase();

  const switchLinks = (
    <>
      {hasRole("agent") && <Link to="/agent/dashboard" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><ArrowLeftRight className="mr-2 h-4 w-4" />Agent view</Link>}
      {hasRole("admin") && <Link to="/admin" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><ArrowLeftRight className="mr-2 h-4 w-4" />Admin view</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#e8edf3] bg-white/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        <Link to="/investor/dashboard" className="shrink-0">
          <ExchangeLogoLockup markClassName="h-8" textClassName="text-[15px] tracking-[-0.03em] text-foreground" suffix="Investor" suffixClassName="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary" />
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.url} to={item.url} className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground", item.active?.test(location.pathname) && "bg-primary/10 text-primary")} activeClassName="bg-primary/10 text-primary">{item.title}</NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center gap-2 md:flex">
            {hasRole("admin") && <WorkspaceToggle />}
            <Button asChild variant="ghost" size="icon" className="relative h-9 w-9"><Link to="/investor/notifications"><Bell className="h-4 w-4" />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}</Link></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary" aria-label="Account menu">{initial}</button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{profileName || user?.email}</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/investor/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/investor/help"><HelpCircle className="mr-2 h-4 w-4" />Help</Link></DropdownMenuItem>
                <DropdownMenuSeparator />{switchLinks}<DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-1 md:hidden">
            <Button asChild variant="ghost" size="icon" className="relative"><Link to="/investor/notifications"><Bell className="h-4 w-4" />{unreadCount > 0 && <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary" />}</Link></Button>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="icon">{mobileOpen ? <X /> : <Menu />}<span className="sr-only">Menu</span></Button></SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <div className="border-b p-4"><p className="truncate text-sm font-medium">{profileName || user?.email}</p></div>
                {hasRole("admin") && <div className="border-b p-3"><WorkspaceToggle full /></div>}
                <nav className="space-y-1 p-3">
                  {NAV.map((item) => <NavLink key={item.url} to={item.url} className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" activeClassName="bg-primary/10 text-primary">{item.title}</NavLink>)}
                  <NavLink to="/investor/settings" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" activeClassName="bg-muted text-foreground"><Settings className="mr-2 h-4 w-4" />Settings</NavLink>
                  <NavLink to="/investor/help" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" activeClassName="bg-muted text-foreground"><HelpCircle className="mr-2 h-4 w-4" />Help</NavLink>
                  <div className="my-2 border-t" />{switchLinks}
                </nav>
                <div className="absolute bottom-0 w-full border-t p-3"><Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
