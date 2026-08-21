import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  AlertTriangle,
  Building2,
  CalendarClock,
  CircleUserRound,
  Handshake,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Loader2,
  MessagesSquare,
  RefreshCw,
  Search,
  TicketCheck,
  Users,
  ChartNoAxesCombined,
  ServerCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { AdminSearchItem } from "@/features/admin/hooks/useAdminCommandCenter";

interface AdminGlobalSearchProps {
  items: AdminSearchItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isRetrying: boolean;
  onRetry: () => void;
}

const destinations = [
  { title: "Command Center", href: "/admin", icon: LayoutDashboard },
  { title: "Users & Accounts", href: "/admin/users", icon: Users },
  { title: "Communications", href: "/admin/communications", icon: MessagesSquare },
  { title: "Properties", href: "/admin/properties", icon: Building2 },
  { title: "Opportunities", href: "/admin/opportunities", icon: ArrowLeftRight },
  { title: "Representation Requests", href: "/admin/representation-requests", icon: Handshake },
  { title: "Demo Requests", href: "/admin/demos", icon: CalendarClock },
  { title: "Growth & Intake", href: "/admin/intake", icon: Inbox },
  { title: "Support", href: "/admin/support", icon: HelpCircle },
  { title: "Reports & Exports", href: "/admin/reports", icon: ChartNoAxesCombined },
  { title: "System & Audit", href: "/admin/system", icon: ServerCog },
];

const typeIcons: Record<AdminSearchItem["type"], React.ElementType> = {
  User: CircleUserRound,
  Exchange: ArrowLeftRight,
  Property: Building2,
  Connection: Handshake,
  Demo: CalendarClock,
  Lead: Inbox,
  Ticket: TicketCheck,
  Event: CalendarClock,
};

export default function AdminGlobalSearch({
  items,
  isLoading,
  isError,
  errorMessage,
  isRetrying,
  onRetry,
}: AdminGlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];
    return items
      .filter((item) =>
        `${item.type} ${item.title} ${item.subtitle}`.toLowerCase().includes(term),
      )
      .slice(0, 30);
  }, [items, query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  const accountDirectoryHref = `/admin/users?q=${encodeURIComponent(query.trim())}`;
  const unavailable = (
    <div className="mx-2 my-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-900" role="alert">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">The admin search index is unavailable.</p>
          <p className="mt-1 line-clamp-2 text-xs text-red-700">
            {errorMessage || "Live operational results could not be loaded."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 h-7 border-red-200 bg-white px-2 text-xs text-red-800 hover:bg-red-100"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1.5 h-3 w-3" />}
            Retry live search
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`hidden h-9 w-[260px] justify-between bg-white md:flex ${isError ? "border-red-200 text-red-700" : "text-muted-foreground"}`}
        onClick={() => setOpen(true)}
        data-testid="admin-global-search-trigger"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search the admin center
        </span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">Ctrl K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search the admin center"
      >
        <Search className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search accounts, investors, exchanges, properties, leads, tickets…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length < 2 ? (
            <>
              <CommandGroup heading="Go to">
                {destinations.map((destination) => (
                  <CommandItem
                    key={destination.href}
                    value={destination.title}
                    onSelect={() => go(destination.href)}
                  >
                    <destination.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {destination.title}
                  </CommandItem>
                ))}
              </CommandGroup>
              {isError && unavailable}
            </>
          ) : (
            <>
              <CommandGroup heading="Complete account directory">
                <CommandItem
                  value={`Search all Users & Accounts ${query}`}
                  onSelect={() => go(accountDirectoryHref)}
                  className="gap-3"
                  data-testid="admin-search-all-accounts"
                >
                  <div className="rounded-md bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Search all Users &amp; Accounts</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Search the server-backed directory for “{query.trim()}”, including auth-only accounts.
                    </p>
                  </div>
                  <CommandShortcut>All accounts</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              {isLoading ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading live results…</div>
              ) : isError ? unavailable : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No matching indexed records. Search the complete account directory above.
                </div>
              ) : (
                <CommandGroup heading={`${results.length} live result${results.length === 1 ? "" : "s"}`}>
                  {results.map((item) => {
                    const Icon = typeIcons[item.type];
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.type} ${item.title} ${item.subtitle}`}
                        onSelect={() => go(item.href)}
                        className="gap-3"
                      >
                        <div className="rounded-md bg-muted p-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                        </div>
                        <CommandShortcut>{item.type}</CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
