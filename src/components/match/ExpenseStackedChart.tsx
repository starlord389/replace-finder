import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from "recharts";

interface FinLike {
  real_estate_taxes?: number | null;
  insurance?: number | null;
  utilities?: number | null;
  management_fee?: number | null;
  maintenance_repairs?: number | null;
  capex_reserves?: number | null;
  other_expenses?: number | null;
}

const CATEGORIES: Array<{ key: keyof FinLike; label: string; color: string }> = [
  { key: "real_estate_taxes", label: "Taxes", color: "hsl(0 72% 51%)" },
  { key: "insurance", label: "Insurance", color: "hsl(25 95% 53%)" },
  { key: "utilities", label: "Utilities", color: "hsl(45 93% 47%)" },
  { key: "management_fee", label: "Management", color: "hsl(142 71% 45%)" },
  { key: "maintenance_repairs", label: "Maintenance", color: "hsl(199 89% 48%)" },
  { key: "capex_reserves", label: "CapEx", color: "hsl(262 60% 55%)" },
  { key: "other_expenses", label: "Other", color: "hsl(215 14% 70%)" },
];

export function ExpenseStackedChart({ yours, theirs }: { yours: FinLike | null | undefined; theirs: FinLike | null | undefined }) {
  if (!yours && !theirs) return null;

  const row = (label: string, fin: FinLike | null | undefined) => {
    const r: Record<string, any> = { name: label };
    CATEGORIES.forEach((c) => {
      r[c.label] = fin?.[c.key] ? Number(fin[c.key]) : 0;
    });
    return r;
  };

  const data = [row("Your Property", yours), row("This Property", theirs)];
  const hasData = data.some((d) => CATEGORIES.some((c) => d[c.label] > 0));
  if (!hasData) return null;

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Expense Composition</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" fontSize={11} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} fontSize={11} />
          <Tooltip formatter={(v: number) => `$${Math.round(v).toLocaleString()}`} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {CATEGORIES.map((c) => (
            <Bar key={c.label} dataKey={c.label} stackId="a" fill={c.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
