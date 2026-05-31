import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WorkspaceExchange } from "../hooks/useWorkspaceExchanges";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exchanges: WorkspaceExchange[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ExchangePickerDrawer({
  open,
  onOpenChange,
  exchanges,
  selectedId,
  onSelect,
}: Props) {
  const [q, setQ] = useState("");
  const filtered = q
    ? exchanges.filter((e) => {
        const s = q.toLowerCase();
        return (
          e.clientName.toLowerCase().includes(s) ||
          (e.relinquishedAddress ?? "").toLowerCase().includes(s) ||
          (e.relinquishedCity ?? "").toLowerCase().includes(s) ||
          (e.relinquishedState ?? "").toLowerCase().includes(s)
        );
      })
    : exchanges;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="shrink-0 border-b px-5 py-4">
          <SheetTitle>Switch exchange</SheetTitle>
          <SheetDescription>
            Pick a client's 1031 exchange to focus the workspace on.
          </SheetDescription>
          <div className="relative pt-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search client or property…"
              className="h-9 pl-8"
            />
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No exchanges match "{q}".
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((ex) => {
                const active = ex.id === selectedId;
                const location = [ex.relinquishedCity, ex.relinquishedState]
                  .filter(Boolean)
                  .join(", ");
                const dl = ex.daysRemaining;
                return (
                  <li key={ex.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(ex.id);
                        onOpenChange(false);
                      }}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-lg border px-3 py-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {ex.clientName}
                        </span>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">
                          {ex.status}
                        </span>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {ex.relinquishedAddress || location || "No relinquished property"}
                      </span>
                      {location && ex.relinquishedAddress && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {location}
                        </span>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                        <span className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{ex.matchCount}</span>{" "}
                          match{ex.matchCount === 1 ? "" : "es"}
                        </span>
                        {ex.bestScore > 0 && (
                          <span className="text-muted-foreground">
                            Best{" "}
                            <span className="font-semibold text-foreground">
                              {Math.round(ex.bestScore)}
                            </span>
                          </span>
                        )}
                        {dl != null && (
                          <span
                            className={cn(
                              "flex items-center gap-0.5",
                              dl < 0
                                ? "text-destructive"
                                : dl <= 14
                                  ? "text-amber-600"
                                  : "text-muted-foreground",
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
