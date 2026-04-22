interface FitGaugeProps {
  /** 0-100 */
  score: number;
  label?: string;
  sublabel?: string;
}

function colorFor(score: number) {
  if (score >= 85) return "hsl(142 71% 45%)";
  if (score >= 70) return "hsl(45 93% 47%)";
  if (score >= 50) return "hsl(25 95% 53%)";
  return "hsl(0 72% 51%)";
}

export function FitGauge({ score, label = "Exchange Fit", sublabel }: FitGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 180; // 0 → 180 deg
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const startX = cx - radius;
  const startY = cy;
  // arc end point
  const endRad = ((180 - angle) * Math.PI) / 180;
  const endX = cx + radius * Math.cos(endRad);
  const endY = cy - radius * Math.sin(endRad);
  const largeArc = angle > 180 ? 1 : 0;
  const color = colorFor(clamped);

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground">{label}</h2>
      {sublabel && <p className="mt-1 text-sm text-muted-foreground">{sublabel}</p>}
      <div className="mt-4 flex flex-col items-center">
        <svg viewBox="0 0 200 120" className="w-full max-w-xs">
          {/* background arc */}
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${cx + radius} ${startY}`}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={16}
            strokeLinecap="round"
          />
          {/* score arc */}
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth={16}
            strokeLinecap="round"
          />
          <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" style={{ fontSize: 30, fontWeight: 700 }}>
            {Math.round(clamped)}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
            out of 100
          </text>
        </svg>
        <p className="mt-2 text-sm font-medium" style={{ color }}>
          {clamped >= 85 ? "Excellent fit" : clamped >= 70 ? "Strong fit" : clamped >= 50 ? "Moderate fit" : "Weak fit"}
        </p>
      </div>
    </div>
  );
}
