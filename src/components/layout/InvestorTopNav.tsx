import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftRight, Heart, HelpCircle, LayoutDashboard, LogOut, Menu, MessageCircle, Search, Settings, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ExchangeLogoLockup } from "@/components/brand/ExchangeLogo";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/features/workspace/workspaceMode";
import { cn } from "@/lib/utils";

const NAV = [
  { title: "Dashboard", url: "/investor/dashboard", icon: LayoutDashboard },
  { title: "Explore", url: "/investor/marketplace", icon: Search },
  { title: "Saved", url: "/investor/saved", icon: Heart },
  { title: "Inquiries", url: "/investor/inquiries", icon: MessageCircle },
];

function WorkspaceToggle({ full = false }: { full?: boolean }) {
  const { isDemo, setMode } = useWorkspaceMode();
  const navigate = useNavigate();
  const go = (mode: "live" | "demo") => { setMode(mode); navigate("/investor/dashboard"); };
  return (
    <div className={cn("flex items-center rounded-full border bg-muted/40 p-0.5 text-xs font-semibold", full && "w-full")}>
      <button onClick={() => go("live")} className={cn("flex-1 rounded-full px-3 py-1", !isDemo ? "bg-emerald-600 text-white" : "text-muted-foreground")}>Live</button>
      <button onClick={() => go("demo")} className={cn("flex-1 rounded-full px-3 py-1", isDemo ? "bg-[#16284a] text-white" : "text-muted-foreground")}>Demo</button>
    </div>
  );
}

export default function InvestorTopNav() {
  const { user, profileName, hasRole, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const initial = (profileName ?? user?.email ?? "I").charAt(0).toUpperCase();

  const secondaryLinks = (
    <>
      {hasRole("agent") && <Link to="/agent/dashboard" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><ArrowLeftRight className="mr-2 h-4 w-4" />Agent view</Link>}
      {hasRole("admin") && <Link to="/admin" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><ArrowLeftRight className="mr-2 h-4 w-4" />Admin view</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6">
        <Link to="/investor/dashboard" className="shrink-0">
          <ExchangeLogoLockup markClassName="h-8" textClassName="text-[15px] text-[#16284a]" suffix="Investor / Owner" suffixClassName="rounded bg-[#16284a]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#16284a]" />
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV.map(({ title, url, icon: Icon }) => <NavLink key={url} to={url} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted" activeClassName="bg-[#16284a]/10 text-[#16284a]"><Icon className="h-4 w-4" />{title}</NavLink>)}
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {hasRole("admin") && <WorkspaceToggle />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button aria-label="Account menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16284a] text-sm font-semibold text-white">{initial}</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{profileName || user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/investor/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/investor/help"><HelpCircle className="mr-2 h-4 w-4" />Help</Link></DropdownMenuItem>
              {(hasRole("agent") || hasRole("admin")) && <DropdownMenuSeparator />}
              {hasRole("agent") && <DropdownMenuItem asChild><Link to="/agent/dashboard"><ArrowLeftRight className="mr-2 h-4 w-4" />Switch to Agent view</Link></DropdownMenuItem>}
              {hasRole("admin") && <DropdownMenuItem asChild><Link to="/admin"><ArrowLeftRight className="mr-2 h-4 w-4" />Switch to Admin view</Link></DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="ml-auto md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon">{mobileOpen ? <X /> : <Menu />}<span className="sr-only">Menu</span></Button></SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="border-b p-4"><p className="truncate text-sm font-medium">{profileName || user?.email}</p></div>
              {hasRole("admin") && <div className="border-b p-3"><WorkspaceToggle full /></div>}
              <nav className="space-y-1 p-3">
                {NAV.map(({ title, url, icon: Icon }) => <NavLink key={url} to={url} className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" activeClassName="bg-[#16284a]/10 text-[#16284a]"><Icon className="mr-2 h-4 w-4" />{title}</NavLink>)}
                <NavLink to="/investor/settings" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" activeClassName="bg-muted text-foreground"><Settings className="mr-2 h-4 w-4" />Settings</NavLink>
                <NavLink to="/investor/help" className="flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted" activeClassName="bg-muted text-foreground"><HelpCircle className="mr-2 h-4 w-4" />Help</NavLink>
                <div className="my-2 border-t" />{secondaryLinks}
              </nav>
              <div className="absolute bottom-0 w-full border-t p-3"><Button variant="ghost" className="w-full justify-start" onClick={() => signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button></div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
