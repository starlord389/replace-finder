import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getClientAccent } from "@/features/matches/lib/clientAccent";
import type { AgentListing } from "@/features/pipeline/hooks/useAgentListings";

export function ListingSwitcher({ listings }: { listings: AgentListing[] }) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = listings.filter((l) => {
      if (!term) return true;
      return (
        (l.propertyName ?? "").toLowerCase().includes(term) ||
        (l.address ?? "").toLowerCase().includes(term) ||
        (l.city ?? "").toLowerCase().includes(term) ||
        (l.clientName ?? "").toLowerCase().includes(term)
      );
    });
    const map = new Map<string, { clientId: string | null; clientName: string; items: AgentListing[] }>();
    for (const l of filtered) {
      const key = l.clientId ?? "_unassigned";
      const name = l.clientName ?? "Unassigned";
      if (!map.has(key)) map.set(key, { clientId: l.clientId, clientName: name, items: [] });
      map.get(key)!.items.push(l);
    }
    return Array.from(map.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
  }, [listings, q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search listings by property, location, or client…"
          className="pl-9"
        />
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          No listings match your search.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const accent = getClientAccent(g.clientId);
            return (
              <div key={g.clientId ?? "_unassigned"}>
                <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", accent.dot)} />
                  {g.clientName}
                </div>
                <ul className="divide-y rounded-lg border bg-card">
                  {g.items.map((l) => {
                    const title =
                      l.propertyName ||
                      l.address ||
                      (l.status === "draft" ? "Draft listing" : "Untitled");
                    const loc = [l.city, l.state].filter(Boolean).join(", ");
                    return (
                      <li key={l.id}>
                        <Link
                          to={`/agent/workspace/${l.id}`}
                          className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{title}</p>
                            {loc && (
                              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" /> {loc}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
