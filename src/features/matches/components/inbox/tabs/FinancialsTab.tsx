import { DollarSign, TrendingUp, Receipt, Wallet, Info } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { financialMetrics } from "../inboxHelpers";
import { cn } from "@/lib/utils";

export function FinancialsTab({ rel }: { rel: Relationship }) {
  const metrics = financialMetrics(rel);
  const cap = metrics.find((m) => m.key === "cap")?.value ?? "—";
  // Real figures only — no fabricated gross/expense split. Gross income and
  // operating expenses come straight from the listing's stored financials; NOI
  // prefers the stored (server-derived) value.
  const money = (v: number | null) => (v != null ? `$${Math.round(v).toLocaleString()}` : "—");
  const grossIncome = money(rel.grossRentRoll);
  const expenses = money(rel.totalOperatingExpenses);
  const noi = rel.noi != null ? money(rel.noi) : (metrics.find((m) => m.key === "noi")?.value ?? "—");
  const hasIncomeStatement =
    rel.grossRentRoll != null || rel.totalOperatingExpenses != null || rel.noi != null;

  return (
    <div className="space-y-8">
      {/* 4-up KPI hero */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiHero icon={DollarSign} label="Gross Income" value={grossIncome} sub="/year" />
        <KpiHero icon={Receipt} label="Expenses" value={expenses} sub="/year" />
        <KpiHero icon={Wallet} label="NOI" value={noi} sub="/year" tint="bg-primary/5" />
        <KpiHero icon={TrendingUp} label="Cap Rate" value={cap} sub="current" tint="bg-emerald-50" valueTint="text-emerald-700" />
      </section>

      {/* Income statement — estimated from cap rate when verified line items aren't provided */}
      <section className="rounded-2xl border bg-card p-6">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Receipt className="h-4 w-4 text-primary" />
          Income &amp; Expenses
        </h3>
        <div className="mt-4 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              <tr className="text-foreground">
                <td className="px-4 py-3">Gross Operating Income</td>
                <td className="px-4 py-3 text-right font-medium">{grossIncome}<span className="text-muted-foreground">/yr</span></td>
              </tr>
              <tr className="text-foreground">
                <td className="px-4 py-3">Operating Expenses</td>
                <td className="px-4 py-3 text-right font-medium">{expenses !== "—" ? `(${expenses})` : "—"}<span className="text-muted-foreground">/yr</span></td>
              </tr>
              <tr className="bg-muted/30 text-foreground">
                <td className="px-4 py-3 font-semibold">Net Operating Income</td>
                <td className="px-4 py-3 text-right font-bold">{noi}<span className="text-muted-foreground">/yr</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {hasIncomeStatement
            ? "Income and expense figures as provided by the listing agent."
            : "The listing agent hasn't shared a detailed income statement yet."}{" "}
          Request the offering memorandum and T-12 for verified, line-item financials.
        </p>
      </section>

      {/* Full financial grid */}
      <section className="rounded-2xl border bg-card p-6">
        <h3 className="text-base font-bold text-foreground">All Financial Metrics</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.key} className="rounded-xl border bg-background p-4">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {m.label}
                {m.estimated && <Info className="h-3 w-3" />}
              </div>
              <p className="mt-1 text-lg font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KpiHero({
  icon: Icon, label, value, sub, tint, valueTint,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  sub: string;
  tint?: string;
  valueTint?: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 text-center", tint)}>
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1.5 text-2xl font-bold text-foreground", valueTint)}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
