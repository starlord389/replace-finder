import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { toast } from "sonner";
import {
  Building2, Plus, Search, MoreVertical, MapPin, ExternalLink,
  Archive, RotateCcw, Eye, ArrowLeftRight,
} from "lucide-react";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Tables, Enums } from "@/integrations/supabase/types";

type PropertyRow = Tables<"pledged_properties"> & {
  asking_price: number | null;
  cap_rate: number | null;
  cover_url: string | null;
  exchange_status: string | null;
  client_name: string | null;
  match_count: number;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  under_contract: "Under Contract",
  exchanged: "Exchanged",
  withdrawn: "Withdrawn",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 border-green-200",
  under_contract: "bg-blue-100 text-blue-800 border-blue-200",
  exchanged: "bg-purple-100 text-purple-800 border-purple-200",
  withdrawn: "bg-red-50 text-red-700 border-red-200",
};

function fmtPrice(v: number | null) {
  if (!v) return "Price TBD";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
}

async function fetchProperties(agentId: string): Promise<PropertyRow[]> {
  const { data: props, error } = await supabase
    .from("pledged_properties")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!props || props.length === 0) return [];

  const ids = props.map((p) => p.id);
  const exchangeIds = props.map((p) => p.exchange_id).filter(Boolean) as string[];

  const [finsRes, imgsRes, exchangesRes, matchesRes] = await Promise.all([
    supabase.from("property_financials").select("property_id, asking_price, cap_rate").in("property_id", ids),
    supabase.from("property_images").select("property_id, storage_path").in("property_id", ids).order("sort_order"),
    exchangeIds.length > 0
      ? supabase.from("exchanges").select("id, status, client_id").in("id", exchangeIds)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from("matches").select("seller_property_id").in("seller_property_id", ids),
  ]);

  const clientIds = Array.from(new Set((exchangesRes.data ?? []).map((e: any) => e.client_id).filter(Boolean)));
  const { data: clients } = clientIds.length > 0
    ? await supabase.from("agent_clients").select("id, client_name").in("id", clientIds)
    : { data: [] as any[] };

  const finMap = new Map((finsRes.data ?? []).map((f: any) => [f.property_id, f]));
  const exMap = new Map((exchangesRes.data ?? []).map((e: any) => [e.id, e]));
  const clientMap = new Map((clients ?? []).map((c: any) => [c.id, c.client_name]));

  const coverByProp = new Map<string, string>();
  for (const img of imgsRes.data ?? []) {
    if (!coverByProp.has(img.property_id)) {
      const { data: signed } = supabase.storage.from("property-images").getPublicUrl(img.storage_path);
      coverByProp.set(img.property_id, signed?.publicUrl ?? "");
    }
  }

  const matchCountByProp = new Map<string, number>();
  for (const m of matchesRes.data ?? []) {
    matchCountByProp.set(m.seller_property_id, (matchCountByProp.get(m.seller_property_id) ?? 0) + 1);
  }

  return props.map((p) => {
    const fin = finMap.get(p.id);
    const ex = p.exchange_id ? exMap.get(p.exchange_id) : null;
    return {
      ...p,
      asking_price: fin?.asking_price ?? null,
      cap_rate: fin?.cap_rate ?? null,
      cover_url: coverByProp.get(p.id) ?? null,
      exchange_status: ex?.status ?? null,
      client_name: ex?.client_id ? clientMap.get(ex.client_id) ?? null : null,
      match_count: matchCountByProp.get(p.id) ?? 0,
    };
  });
}

export default function AgentPledgedProperties() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    action: "withdraw" | "reactivate" | "off_market";
    name: string;
  } | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["agent-properties", user?.id],
    queryFn: () => fetchProperties(user!.id),
    enabled: !!user?.id,
  });

  const filtered = useMemo(() => {
    let rows = properties;
    if (statusFilter !== "all") rows = rows.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          (p.property_name?.toLowerCase().includes(q)) ||
          (p.address?.toLowerCase().includes(q)) ||
          (p.city?.toLowerCase().includes(q)) ||
          (p.client_name?.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [properties, search, statusFilter]);

  const updateStatus = useMutation({
    mutationFn: async (vars: { id: string; status: Enums<"pledged_property_status">; field?: "withdrawn_at" | null }) => {
      const update: any = { status: vars.status };
      if (vars.field === "withdrawn_at") update.withdrawn_at = new Date().toISOString();
      if (vars.status === "active" && vars.field === null) update.withdrawn_at = null;
      await supabase.from("pledged_properties").update(update).eq("id", vars.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-properties", user?.id] });
      toast.success("Property updated");
    },
    onError: () => toast.error("Failed to update property"),
  });

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.action === "withdraw") {
      updateStatus.mutate({ id: confirmAction.id, status: "withdrawn", field: "withdrawn_at" });
    } else if (confirmAction.action === "reactivate") {
      updateStatus.mutate({ id: confirmAction.id, status: "active", field: null });
    } else if (confirmAction.action === "off_market") {
      updateStatus.mutate({ id: confirmAction.id, status: "withdrawn", field: "withdrawn_at" });
    }
    setConfirmAction(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const counts = {
    all: properties.length,
    draft: properties.filter((p) => p.status === "draft").length,
    active: properties.filter((p) => p.status === "active").length,
    under_contract: properties.filter((p) => p.status === "under_contract").length,
    withdrawn: properties.filter((p) => p.status === "withdrawn").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pledged Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All properties you've listed across your exchanges. {counts.active} active · {counts.draft} draft.
          </p>
        </div>
        <Button onClick={() => navigate("/agent/exchanges/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Listing
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground">No pledged properties yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Pledge a property when you create an exchange. It will be matched to other agents' buyers automatically.
            </p>
            <Button className="mt-4" onClick={() => navigate("/agent/exchanges/new")}>
              <Plus className="mr-2 h-4 w-4" /> Create First Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, city, client…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all})</SelectItem>
                <SelectItem value="active">Active ({counts.active})</SelectItem>
                <SelectItem value="draft">Draft ({counts.draft})</SelectItem>
                <SelectItem value="under_contract">Under Contract ({counts.under_contract})</SelectItem>
                <SelectItem value="withdrawn">Withdrawn ({counts.withdrawn})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const loc = [p.city, p.state].filter(Boolean).join(", ");
              return (
                <Card key={p.id} className="overflow-hidden transition-all hover:shadow-md">
                  <div className="relative aspect-[16/10] bg-muted">
                    {p.cover_url ? (
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
                      <Badge className={`${STATUS_COLORS[p.status]} text-[10px]`}>
                        {STATUS_LABELS[p.status]}
                      </Badge>
                    </div>
                    <div className="absolute right-2 top-2">
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
                          {p.exchange_id ? (
                            <DropdownMenuItem asChild>
                              <Link to={`/agent/exchanges/${p.exchange_id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View exchange
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {p.exchange_id ? (
                            <DropdownMenuItem asChild>
                              <Link to={`/agent/exchanges/${p.exchange_id}/edit`}>
                                <ArrowLeftRight className="mr-2 h-4 w-4" /> Edit details
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          {p.status === "active" || p.status === "draft" ? (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ id: p.id, action: "withdraw", name: p.property_name || "this property" })}
                              className="text-red-600 focus:text-red-700"
                            >
                              <Archive className="mr-2 h-4 w-4" /> Withdraw
                            </DropdownMenuItem>
                          ) : null}
                          {p.status === "withdrawn" ? (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ id: p.id, action: "reactivate", name: p.property_name || "this property" })}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" /> Reactivate
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-lg font-bold text-foreground">{fmtPrice(p.asking_price)}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {p.cap_rate && <span>{Number(p.cap_rate).toFixed(1)}% cap</span>}
                      {p.cap_rate && p.units && <span className="text-border">·</span>}
                      {p.units && <span>{p.units} units</span>}
                      {(p.cap_rate || p.units) && p.year_built && <span className="text-border">·</span>}
                      {p.year_built && <span>Built {p.year_built}</span>}
                    </div>
                    <p className="mt-2 truncate font-semibold text-foreground">
                      {p.property_name || p.address || "Untitled property"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {loc || "Location TBD"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {p.asset_type && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            {ASSET_TYPE_LABELS[p.asset_type as Enums<"asset_type">]}
                          </span>
                        )}
                        {p.match_count > 0 && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
                            {p.match_count} match{p.match_count > 1 ? "es" : ""}
                          </span>
                        )}
                      </div>
                      {p.client_name && (
                        <span className="truncate text-muted-foreground">
                          for {p.client_name}
                        </span>
                      )}
                    </div>
                    {p.exchange_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="mt-3 h-8 w-full justify-center text-xs"
                      >
                        <Link to={`/agent/exchanges/${p.exchange_id}`}>
                          Open exchange
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
              No properties match your filters.
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "reactivate" ? "Reactivate property?" : "Withdraw property?"}
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
