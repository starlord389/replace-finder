import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeftRight, Plus, Clock, Building2, Search, MoreVertical, MapPin,
  ExternalLink, Archive, RotateCcw, Eye,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAgentExchangesQuery } from "@/features/agent/hooks/useAgentExchangesQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/exchangeWizardTypes";
import {
  EXCHANGE_STATUS_LABELS, EXCHANGE_STATUS_COLORS, ASSET_TYPE_LABELS,
} from "@/lib/constants";
import type { Enums } from "@/integrations/supabase/types";

function fmtPrice(v: number | null) {
  if (!v) return "Price TBD";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

const STATUS_FILTER_ORDER = [
  "draft", "active", "in_identification", "in_closing", "completed", "cancelled", "expired",
];

export default function AgentExchanges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: exchanges = [], isLoading, error } = useAgentExchangesQuery(user?.id);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    propertyId: string;
    action: "withdraw" | "reactivate";
    name: string;
  } | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: exchanges.length };
    for (const s of STATUS_FILTER_ORDER) c[s] = 0;
    for (const e of exchanges) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [exchanges]);

  const filtered = useMemo(() => {
    let rows = exchanges;
    if (statusFilter !== "all") rows = rows.filter((e) => e.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((e) => {
        const p = e.pledged_properties;
        return (
          e.agent_clients?.client_name?.toLowerCase().includes(q) ||
          p?.property_name?.toLowerCase().includes(q) ||
          p?.address?.toLowerCase().includes(q) ||
          p?.city?.toLowerCase().includes(q)
        );
      });
    }
    return rows;
  }, [exchanges, search, statusFilter]);

  const updatePropertyStatus = useMutation({
    mutationFn: async (vars: { id: string; action: "withdraw" | "reactivate" }) => {
      const update: any =
        vars.action === "withdraw"
          ? { status: "withdrawn", withdrawn_at: new Date().toISOString() }
          : { status: "active", withdrawn_at: null };
      const { error } = await supabase
        .from("pledged_properties")
        .update(update)
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-exchanges", user?.id] });
      toast.success("Property updated");
    },
    onError: () => toast.error("Failed to update property"),
  });

  const activeCount = exchanges.filter((e) =>
    ["active", "in_identification", "in_closing"].includes(e.status),
  ).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load exchanges: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  const handleConfirm = () => {
    if (!confirmAction) return;
    updatePropertyStatus.mutate({ id: confirmAction.propertyId, action: confirmAction.action });
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Exchanges</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active exchange{activeCount !== 1 ? "s" : ""} · {exchanges.length} total
          </p>
        </div>
        <Button onClick={() => navigate("/agent/exchanges/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Exchange
        </Button>
      </div>

      {exchanges.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-lg font-semibold text-foreground">No exchanges yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create an exchange for a client to pledge their property and start receiving matches.
          </p>
          <Button className="mt-4" onClick={() => navigate("/agent/exchanges/new")}>
            Create First Exchange
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by client, property, address, city…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all})</SelectItem>
                {STATUS_FILTER_ORDER.filter((s) => counts[s] > 0).map((s) => (
                  <SelectItem key={s} value={s}>
                    {EXCHANGE_STATUS_LABELS[s] || s} ({counts[s]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ex) => {
              const p = ex.pledged_properties;
              const loc = p ? [p.city, p.state].filter(Boolean).join(", ") : "";
              const nextDeadline = ex.identification_deadline || ex.closing_deadline;
              const daysLeft = nextDeadline
                ? differenceInDays(new Date(nextDeadline), new Date())
                : null;
              const deadlineLabel = ex.identification_deadline ? "to ID" : "to close";
              const canWithdraw = p && (p.status === "active" || p.status === "draft");
              const canReactivate = p && p.status === "withdrawn";

              return (
                <Card
                  key={ex.id}
                  className="overflow-hidden transition-all hover:shadow-md"
                >
                  <div
                    className="relative aspect-[16/10] cursor-pointer bg-muted"
                    onClick={() => navigate(`/agent/exchanges/${ex.id}`)}
                  >
                    {p?.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.property_name || "Property"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <Badge
                        className={`${EXCHANGE_STATUS_COLORS[ex.status] || "bg-muted text-muted-foreground"} text-[10px]`}
                      >
                        {EXCHANGE_STATUS_LABELS[ex.status] || ex.status}
                      </Badge>
                    </div>
                    <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/agent/exchanges/${ex.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View exchange
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/agent/exchanges/${ex.id}/edit`}>
                              <ArrowLeftRight className="mr-2 h-4 w-4" /> Edit details
                            </Link>
                          </DropdownMenuItem>
                          {(canWithdraw || canReactivate) && <DropdownMenuSeparator />}
                          {canWithdraw && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  propertyId: p!.id,
                                  action: "withdraw",
                                  name: p!.property_name || p!.address || "this property",
                                })
                              }
                              className="text-red-600 focus:text-red-700"
                            >
                              <Archive className="mr-2 h-4 w-4" /> Withdraw property
                            </DropdownMenuItem>
                          )}
                          {canReactivate && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({
                                  propertyId: p!.id,
                                  action: "reactivate",
                                  name: p!.property_name || p!.address || "this property",
                                })
                              }
                            >
                              <RotateCcw className="mr-2 h-4 w-4" /> Reactivate property
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent
                    className="cursor-pointer p-4"
                    onClick={() => navigate(`/agent/exchanges/${ex.id}`)}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-lg font-bold text-foreground">
                        {fmtPrice(p?.asking_price ?? null)}
                      </p>
                      {ex.exchange_proceeds ? (
                        <span className="text-xs text-muted-foreground">
                          {formatCurrency(ex.exchange_proceeds)} proceeds
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {p?.cap_rate && <span>{Number(p.cap_rate).toFixed(1)}% cap</span>}
                      {p?.cap_rate && p?.units ? <span className="text-border">·</span> : null}
                      {p?.units ? <span>{p.units} units</span> : null}
                      {(p?.cap_rate || p?.units) && p?.year_built ? (
                        <span className="text-border">·</span>
                      ) : null}
                      {p?.year_built ? <span>Built {p.year_built}</span> : null}
                    </div>
                    <p className="mt-2 truncate font-semibold text-foreground">
                      {p?.property_name || p?.address || "No property pledged yet"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {loc || "Location TBD"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {p?.asset_type && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            {ASSET_TYPE_LABELS[p.asset_type as Enums<"asset_type">]}
                          </span>
                        )}
                        {p && p.match_count > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                            {p.match_count} match{p.match_count > 1 ? "es" : ""}
                          </span>
                        )}
                        {daysLeft != null && (
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                              daysLeft < 7
                                ? "bg-red-100 text-red-700"
                                : daysLeft < 21
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            <Clock className="h-3 w-3" /> {daysLeft}d {deadlineLabel}
                          </span>
                        )}
                      </div>
                      {ex.agent_clients?.client_name && (
                        <span className="truncate text-muted-foreground">
                          for {ex.agent_clients.client_name}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="mt-3 h-8 w-full justify-center text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link to={`/agent/exchanges/${ex.id}`}>
                        Open exchange
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              No exchanges match your filters.
            </div>
          )}
        </>
      )}

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "reactivate"
                ? "Reactivate property?"
                : "Withdraw property?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "reactivate"
                ? `Set "${confirmAction.name}" back to active. It will start receiving matches again.`
                : `"${confirmAction?.name}" will be marked withdrawn. It won't appear in new matches and existing buyers won't be able to send new connection requests.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {confirmAction?.action === "reactivate" ? "Reactivate" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
