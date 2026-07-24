import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  CircleUserRound,
  Handshake,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Search,
  TicketCheck,
  Users,
  ChartNoAxesCombined,
  ServerCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
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
}

const destinations = [
  { title: "Command Center", href: "/admin", icon: LayoutDashboard },
  { title: "Deal Oversight", href: "/admin/deals", icon: ArrowLeftRight },
  { title: "Users & Roles", href: "/admin/users", icon: Users },
  { title: "Demos", href: "/admin/demos", icon: CalendarClock },
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

export default function AdminGlobalSearch({ items, isLoading }: AdminGlobalSearchProps) {
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

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden h-9 w-[260px] justify-between bg-white text-muted-foreground md:flex"
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
          placeholder="Search people, exchanges, properties, leads, tickets…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length < 2 ? (
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
          ) : isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading results…</div>
          ) : (
            <>
              <CommandEmpty>No matching records found.</CommandEmpty>
              <CommandGroup heading={`${results.length} result${results.length === 1 ? "" : "s"}`}>
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
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
