import { ArrowRight, Building2, MapPin } from "lucide-react";
import { ASSET_TYPE_LABELS } from "@/lib/constants";
import type { Enums } from "@/integrations/supabase/types";

const fmt = (v: number | null | undefined) =>
  v != null && v !== 0 ? `$${Math.round(Number(v)).toLocaleString()}` : "—";
const num = (v: number | null | undefined) =>
  v != null ? Number(v).toLocaleString() : "—";

interface SideProps {
  label: "Your Property" | "Replacement Property";
  name?: string | null;
  city?: string | null;
  state?: string | null;
  imgUrl?: string | null;
  price?: number | null;
  capRate?: number | null;
  noi?: number | null;
  units?: number | null;
  sf?: number | null;
  yearBuilt?: number | null;
  assetType?: string | null;
}

function Side({ label, name, city, state, imgUrl, price, capRate, noi, units, sf, yearBuilt, assetType }: SideProps) {
  return (
    <div className="flex-1 rounded-lg border bg-card p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mb-3 aspect-[16/10] overflow-hidden rounded-md bg-muted">
        {imgUrl ? (
          <img src={imgUrl} alt={name || ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building2 className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <p className="font-semibold text-foreground truncate">{name || "Property"}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />{[city, state].filter(Boolean).join(", ") || "—"}
      </p>
      <p className="mt-3 text-xl font-bold text-foreground">{fmt(price)}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-muted/50 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground">Cap Rate</p>
          <p className="font-semibold text-foreground">{capRate != null ? `${Number(capRate).toFixed(1)}%` : "—"}</p>
        </div>
        <div className="rounded bg-muted/50 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground">NOI</p>
          <p className="font-semibold text-foreground">{fmt(noi)}</p>
        </div>
        <div className="rounded bg-muted/50 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground">{units ? "Units" : "Sq Ft"}</p>
          <p className="font-semibold text-foreground">{units ? num(units) : sf ? num(sf) : "—"}</p>
        </div>
        <div className="rounded bg-muted/50 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground">Built</p>
          <p className="font-semibold text-foreground">{yearBuilt || "—"}</p>
        </div>
      </div>
      {assetType && (
        <p className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {ASSET_TYPE_LABELS[assetType as Enums<"asset_type">] || assetType}
        </p>
      )}
    </div>
  );
}

export function SideBySidePanel({ left, right }: { left: SideProps; right: SideProps }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Side-by-Side</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">A quick visual comparison of both properties.</p>
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <Side {...left} />
        <div className="flex shrink-0 items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background shadow-sm">
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>
        </div>
        <Side {...right} />
      </div>
    </div>
  );
}
