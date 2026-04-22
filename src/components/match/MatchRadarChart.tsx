import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { SCORE_DIMENSIONS } from "@/lib/constants";

export function MatchRadarChart({ match }: { match: any }) {
  const data = SCORE_DIMENSIONS.map((dim) => ({
    dimension: dim.label,
    score: Math.round(Number(match[dim.key] ?? 0)),
    ideal: 100,
  }));

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">Match Quality at a Glance</h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">The further out the shape reaches, the better the fit on each dimension.</p>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
          <Radar name="Ideal" dataKey="ideal" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.05} strokeDasharray="3 3" />
          <Radar name="This match" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
