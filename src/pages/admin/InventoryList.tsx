import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
  INVENTORY_STATUS_LABELS,
  INVENTORY_STATUS_COLORS,
  US_STATES,
} from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

type PropertyWithFinancials = Tables<"inventory_properties"> & {
  inventory_financials: Tables<"inventory_financials"> | null;
};

export default function InventoryList() {
  const [properties, setProperties] = useState<PropertyWithFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    const { data } = await supabase
      .from("inventory_properties")
      .select("*, inventory_financials(*)")
      .order("created_at", { ascending: false });

    // Supabase returns array for 1:many, but we have unique constraint so flatten
    const normalized = (data ?? []).map((p: any) => ({
      ...p,
      inventory_financials: Array.isArray(p.inventory_financials)
        ? p.inventory_financials[0] ?? null
        : p.inventory_financials,
    }));
    setProperties(normalized);
    setLoading(false);
  };

  const filtered = properties.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (stateFilter !== "all" && p.state !== stateFilter) return false;
    if (assetFilter !== "all" && p.asset_type !== assetFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Internal Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {properties.length} properties · {properties.filter((p) => p.status === "active").length} active
          </p>
        </div>
        <Link to="/admin/inventory/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Property
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.entries(INVENTORY_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
          <option value="all">All states</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={assetFilter} onChange={(e) => setAssetFilter(e.target.value)}>
          <option value="all">All types</option>
          {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No properties found.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/admin/inventory/${p.id}`} className="block">
              <div className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-foreground">{p.name || "Untitled Property"}</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${INVENTORY_STATUS_COLORS[p.status]}`}>
                        {INVENTORY_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[p.city, p.state].filter(Boolean).join(", ")}
                      {p.asset_type ? ` · ${ASSET_TYPE_LABELS[p.asset_type]}` : ""}
                      {p.strategy_type ? ` · ${STRATEGY_TYPE_LABELS[p.strategy_type]}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    {p.inventory_financials?.asking_price && (
                      <p className="text-sm font-semibold text-foreground">
                        ${Number(p.inventory_financials.asking_price).toLocaleString()}
                      </p>
                    )}
                    {p.inventory_financials?.cap_rate && (
                      <p className="text-xs text-muted-foreground">
                        {Number(p.inventory_financials.cap_rate).toFixed(1)}% cap
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
