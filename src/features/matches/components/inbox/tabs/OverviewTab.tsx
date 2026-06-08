import { CheckCircle2, Sparkles } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";

const IMPROVEMENTS = [
  "New roof installed",
  "New vinyl siding",
  "New back deck",
  "12 new windows",
  "AC in all commercial units",
];

export function OverviewTab({ rel }: { rel: Relationship }) {
  const seed = rel.matchId.charCodeAt(0) || 7;
  const totalUnits = ((seed % 12) + 4);
  const residential = Math.max(1, Math.round(totalUnits * 0.7));
  const commercial = Math.max(0, totalUnits - residential);
  const yearBuilt = 1900 + (seed % 120);
  const buildingSize = `~${(2 + (seed % 9)).toFixed(0)},${(seed * 73) % 900 + 100} sq.ft.`;
  const lotSize = `${(0.05 + (seed % 30) / 100).toFixed(2)} acres`;

  const city = rel.propertyCity ?? "this market";
  const state = rel.propertyState ?? "";

  return (
    <div className="space-y-10">
      <section className="text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Executive Summary
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Property Overview
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Exceptional opportunity to acquire a {totalUnits}-unit mixed-use property in the heart of
          downtown {city}{state ? `, ${state}` : ""}, consisting of {residential} residential units
          and {commercial} commercial spaces with strong in-place income and long-term upside. The
          asset has been significantly improved in recent years, minimizing near-term capital
          expenditures. Professionally managed with an experienced property manager in place,
          offering a seamless transition for new ownership. Ideal for an investor seeking stable
          cash flow with upside, or a 1031 exchange buyer looking to trade into a larger,
          higher-performing asset.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            Property Details
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <FactBox label="Building Size" value={buildingSize} />
            <FactBox label="Lot Size" value={lotSize} />
            <FactBox label="Year Built" value={String(yearBuilt)} />
            <FactBox label="Total Units" value={String(totalUnits)} />
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Unit Mix
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-primary/5 p-4 text-center">
                <p className="text-2xl font-bold text-primary">{residential}</p>
                <p className="text-xs font-medium text-muted-foreground">Residential</p>
              </div>
              <div className="rounded-xl bg-muted p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{commercial}</p>
                <p className="text-xs font-medium text-muted-foreground">Commercial</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </span>
            Recent Capital Improvements
          </h3>
          <ul className="mt-4 space-y-3">
            {IMPROVEMENTS.map((imp) => (
              <li key={imp} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                {imp}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function FactBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-4 py-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
