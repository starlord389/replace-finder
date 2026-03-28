import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, MapPin, Building2, Calendar, TrendingUp, Ruler, Users } from "lucide-react";
import {
  ASSET_TYPE_LABELS,
  STRATEGY_TYPE_LABELS,
  INVENTORY_STATUS_LABELS,
} from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [access, setAccess] = useState<any>(null);
  const [property, setProperty] = useState<Tables<"inventory_properties"> | null>(null);
  const [financials, setFinancials] = useState<Tables<"inventory_financials"> | null>(null);
  const [images, setImages] = useState<Tables<"inventory_images">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    loadData();
  }, [id, user]);

  const loadData = async () => {
    // Load access record
    const { data: accessData } = await supabase
      .from("matched_property_access")
      .select("*")
      .eq("id", id!)
      .eq("user_id", user!.id)
      .single();

    if (!accessData) {
      setLoading(false);
      return;
    }
    setAccess(accessData);

    // Load property, financials, images in parallel
    const [propRes, finRes, imgRes] = await Promise.all([
      supabase
        .from("inventory_properties")
        .select("*")
        .eq("id", accessData.property_id)
        .single(),
      supabase
        .from("inventory_financials")
        .select("*")
        .eq("property_id", accessData.property_id)
        .maybeSingle(),
      supabase
        .from("inventory_images")
        .select("*")
        .eq("property_id", accessData.property_id)
        .order("sort_order"),
    ]);

    setProperty(propRes.data);
    setFinancials(finRes.data);
    setImages(imgRes.data ?? []);
    setLoading(false);
  };

  const currency = (v: number | null) =>
    v ? `$${Number(v).toLocaleString()}` : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!access || !property) {
    return (
      <p className="py-20 text-center text-muted-foreground">
        Match not found or access denied.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Hero */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Images */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 max-h-64 overflow-hidden">
            {images.slice(0, 3).map((img) => {
              const url = supabase.storage
                .from("inventory-images")
                .getPublicUrl(img.storage_path).data.publicUrl;
              return (
                <img
                  key={img.id}
                  src={url}
                  alt={img.file_name || "Property"}
                  className="h-64 w-full object-cover"
                />
              );
            })}
          </div>
        )}

        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-foreground">
            {property.name || property.address || "Replacement Property"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {(property.city || property.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[property.address, property.city, property.state, property.zip]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            )}
            {property.asset_type && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {ASSET_TYPE_LABELS[property.asset_type]}
              </span>
            )}
            {property.year_built && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Built {property.year_built}
              </span>
            )}
          </div>

          {property.description && (
            <p className="mt-4 text-sm text-foreground leading-relaxed">
              {property.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Property Details */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Property Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {property.asset_type && (
              <Detail
                icon={<Building2 className="h-4 w-4" />}
                label="Asset Type"
                value={ASSET_TYPE_LABELS[property.asset_type]}
              />
            )}
            {property.strategy_type && (
              <Detail
                icon={<TrendingUp className="h-4 w-4" />}
                label="Strategy"
                value={STRATEGY_TYPE_LABELS[property.strategy_type]}
              />
            )}
            {property.square_footage && (
              <Detail
                icon={<Ruler className="h-4 w-4" />}
                label="Square Footage"
                value={Number(property.square_footage).toLocaleString() + " SF"}
              />
            )}
            {property.units && (
              <Detail
                icon={<Users className="h-4 w-4" />}
                label="Units"
                value={String(property.units)}
              />
            )}
            {property.year_built && (
              <Detail
                icon={<Calendar className="h-4 w-4" />}
                label="Year Built"
                value={String(property.year_built)}
              />
            )}
            <Detail
              label="Status"
              value={INVENTORY_STATUS_LABELS[property.status] || property.status}
            />
          </div>
        </div>

        {/* Financials */}
        {financials && (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Financial Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {financials.asking_price && (
                <Detail
                  label="Asking Price"
                  value={currency(financials.asking_price)}
                  highlight
                />
              )}
              {financials.cap_rate && (
                <Detail
                  label="Cap Rate"
                  value={`${Number(financials.cap_rate).toFixed(2)}%`}
                  highlight
                />
              )}
              {financials.noi && (
                <Detail label="NOI" value={currency(financials.noi)} />
              )}
              {financials.annual_revenue && (
                <Detail
                  label="Annual Revenue"
                  value={currency(financials.annual_revenue)}
                />
              )}
              {financials.annual_expenses && (
                <Detail
                  label="Annual Expenses"
                  value={currency(financials.annual_expenses)}
                />
              )}
              {financials.occupancy_rate && (
                <Detail
                  label="Occupancy"
                  value={`${Number(financials.occupancy_rate).toFixed(1)}%`}
                />
              )}
              {financials.debt_amount && (
                <Detail
                  label="Debt"
                  value={currency(financials.debt_amount)}
                />
              )}
              {financials.debt_rate && (
                <Detail
                  label="Debt Rate"
                  value={`${Number(financials.debt_rate).toFixed(2)}%`}
                />
              )}
              {financials.cash_on_cash && (
                <Detail
                  label="Cash on Cash"
                  value={`${Number(financials.cash_on_cash).toFixed(2)}%`}
                />
              )}
            </div>
            {financials.notes && (
              <p className="mt-4 border-t pt-4 text-sm text-muted-foreground">
                {financials.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* All images */}
      {images.length > 0 && (
        <div className="mt-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Photos ({images.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img) => {
                const url = supabase.storage
                  .from("inventory-images")
                  .getPublicUrl(img.storage_path).data.publicUrl;
                return (
                  <img
                    key={img.id}
                    src={url}
                    alt={img.file_name || "Property"}
                    className="h-40 w-full rounded-lg object-cover"
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-medium ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
