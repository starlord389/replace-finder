import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell, Legend } from "recharts";

interface PropMetrics {
  revenue?: number | null;
  expenses?: number | null;
  noi?: number | null;
  debtSvc?: number | null;
}

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;

export function CashFlowWaterfall({ yours, theirs }: { yours: PropMetrics | null; theirs: PropMetrics | null }) {
  const build = (m: PropMetrics | null) => ({
    Revenue: m?.revenue ?? 0,
    Expenses: m?.expenses ?? 0,
    NOI: m?.noi ?? 0,
    "Debt Service": m?.debtSvc ?? 0,
    "Cash Flow": (m?.noi ?? 0) - (m?.debtSvc ?? 0),
  });

  const yoursVals = build(yours);
  const theirsVals = build(theirs);
  const data = ["Revenue", "Expenses", "NOI", "Debt Service", "Cash Flow"].map((stage) => ({
    stage,
    yours: (yoursVals as any)[stage],
    theirs: (theirsVals as any)[stage],
  }));

  if (data.every((d) => d.yours === 0 && d.theirs === 0)) return null;

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cash Flow Waterfall</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="stage" fontSize={11} />
          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} fontSize={11} />
          <Tooltip formatter={(v: number) => fmt(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="yours" name="Your Property" fill="hsl(215 20% 65%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="theirs" name="This Property" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
