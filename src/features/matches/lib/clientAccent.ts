// Deterministic per-client accent colors.
// Stable across sessions: same client_id → same accent forever.
// Uses Tailwind's built-in palette (literal class strings so JIT picks them up).

export interface ClientAccent {
  /** Tailwind class for a left-border bar */
  borderLeft: string;
  /** Tailwind class for a small filled dot */
  dot: string;
  /** Soft background tint */
  soft: string;
  /** Foreground text colour on top of `soft` */
  fg: string;
  /** Solid ring for outlined / selected states */
  ring: string;
  /** Human readable palette name (debug / a11y) */
  name: string;
  /** Index in palette */
  index: number;
}

const PALETTE: Omit<ClientAccent, "index">[] = [
  { name: "indigo",   borderLeft: "border-l-indigo-500",   dot: "bg-indigo-500",   soft: "bg-indigo-50",   fg: "text-indigo-700",   ring: "ring-indigo-500"   },
  { name: "teal",     borderLeft: "border-l-teal-500",     dot: "bg-teal-500",     soft: "bg-teal-50",     fg: "text-teal-700",     ring: "ring-teal-500"     },
  { name: "amber",    borderLeft: "border-l-amber-500",    dot: "bg-amber-500",    soft: "bg-amber-50",    fg: "text-amber-800",    ring: "ring-amber-500"    },
  { name: "rose",     borderLeft: "border-l-rose-500",     dot: "bg-rose-500",     soft: "bg-rose-50",     fg: "text-rose-700",     ring: "ring-rose-500"     },
  { name: "emerald",  borderLeft: "border-l-emerald-500",  dot: "bg-emerald-500",  soft: "bg-emerald-50",  fg: "text-emerald-700",  ring: "ring-emerald-500"  },
  { name: "violet",   borderLeft: "border-l-violet-500",   dot: "bg-violet-500",   soft: "bg-violet-50",   fg: "text-violet-700",   ring: "ring-violet-500"   },
  { name: "sky",      borderLeft: "border-l-sky-500",      dot: "bg-sky-500",      soft: "bg-sky-50",      fg: "text-sky-700",      ring: "ring-sky-500"      },
  { name: "orange",   borderLeft: "border-l-orange-500",   dot: "bg-orange-500",   soft: "bg-orange-50",   fg: "text-orange-700",   ring: "ring-orange-500"   },
  { name: "fuchsia",  borderLeft: "border-l-fuchsia-500",  dot: "bg-fuchsia-500",  soft: "bg-fuchsia-50",  fg: "text-fuchsia-700",  ring: "ring-fuchsia-500"  },
  { name: "lime",     borderLeft: "border-l-lime-500",     dot: "bg-lime-500",     soft: "bg-lime-50",     fg: "text-lime-800",     ring: "ring-lime-500"     },
];

const NEUTRAL: ClientAccent = {
  name: "neutral",
  borderLeft: "border-l-muted-foreground/30",
  dot: "bg-muted-foreground/50",
  soft: "bg-muted",
  fg: "text-muted-foreground",
  ring: "ring-muted-foreground/30",
  index: -1,
};

function hashString(s: string): number {
  // djb2
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getClientAccent(clientId: string | null | undefined): ClientAccent {
  if (!clientId) return NEUTRAL;
  const idx = hashString(clientId) % PALETTE.length;
  return { ...PALETTE[idx], index: idx };
}

export const NEUTRAL_ACCENT = NEUTRAL;
