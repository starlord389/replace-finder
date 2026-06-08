import { DollarSign, TrendingUp, Receipt, Wallet, Info, Store } from "lucide-react";
import type { Relationship } from "@/features/matches/hooks/useUnifiedRelationships";
import { financialMetrics } from "../inboxHelpers";
import { cn } from "@/lib/utils";

export function FinancialsTab({ rel }: { rel: Relationship }) {
  const metrics = financialMetrics(rel);
  const noi = metrics.find((m) => m.key === "noi")?.value ?? "—";
  const cap = metrics.find((m) => m.key === "cap")?.value ?? "—";
  const grossIncome = rel.askingPrice && rel.capRate
    ? `$${Math.round(rel.askingPrice * (rel.capRate / 100) * 1.37).toLocaleString()}`
    : "—";
  const expenses = rel.askingPrice && rel.capRate
    ? `$${Math.round(rel.askingPrice * (rel.capRate / 100) * 0.37).toLocaleString()}`
    : "—";

  const expenseRows = [
    { label: "Real Estate Taxes", amount: "$13,491" },
    { label: "Insurance", amount: "$11,295" },
    { label: "Utilities (Common Areas)", amount: "$8,400" },
    { label: "Maintenance & Repairs", amount: "$15,200" },
    { label: "Property Management", amount: "$13,148" },
    { label: "Other", amount: "$10,126" },
  ];

  const rentRoll = [
    { unit: "C1", tenant: "Hair Salon", monthly: "$1,600" },
    { unit: "C2", tenant: "Barbershop", monthly: "$1,450" },
    { unit: "C3", tenant: "Restaurant", monthly: "$2,100" },
  ];

  return (
    <div className="space-y-8">
      {/* 4-up KPI hero */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiHero icon={DollarSign} label="Gross Income" value={grossIncome} sub="/year" />
        <KpiHero icon={Receipt} label="Expenses" value={expenses} sub="/year" />
        <KpiHero icon={Wallet} label="NOI" value={noi} sub="/year" tint="bg-primary/5" />
        <KpiHero icon={TrendingUp} label="Cap Rate" value={cap} sub="current" tint="bg-emerald-50" valueTint="text-emerald-700" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Commercial units */}
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Store className="h-4 w-4 text-primary" />
            Commercial Units
          </h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Unit</th>
                  <th className="px-4 py-2.5">Tenant</th>
                  <th className="px-4 py-2.5 text-right">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rentRoll.map((r) => (
                  <tr key={r.unit} className="text-foreground">
                    <td className="px-4 py-3 font-semibold">{r.unit}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.tenant}</td>
                    <td className="px-4 py-3 text-right font-medium">{r.monthly}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operating expenses */}
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Receipt className="h-4 w-4 text-primary" />
            Operating Expenses (Annual)
          </h3>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenseRows.map((r) => (
                  <tr key={r.label} className="text-foreground">
                    <td className="px-4 py-3">{r.label}</td>
                    <td className="px-4 py-3 text-right font-medium">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
