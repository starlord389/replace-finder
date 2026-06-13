## Goal
Replace the heavy row-card layout on `/agent/listings` with a calmer, premium card grid grouped by client. Same data, same filters, same routes — just a layout and density pass that fits the rest of the app.

## What changes

### 1. `ListingSwitcher.tsx` — render block only
Keep all data-fetching, filtering, grouping, search/filter UI, "Continue where you left off" banner, and the preview-dialog wiring exactly as they are. Only the `groups.map(...)` render is rebuilt.

**Group header (per client)**
- Single-line header: small colored client dot · client name (`text-[15px] font-semibold tracking-tight`) · subtle count (`text-xs text-muted-foreground` reading "4 listings").
- Thin `border-b border-border/60` rule underneath, `pb-2.5 mb-5`.
- No uppercase tracked caps, no heavy chrome — matches the rest of the agent area.

**Card grid**
- `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5` per group.
- Each card is a `<button>` (same preview-dialog trigger as today) styled as:
  - `rounded-xl border border-border/70 bg-card overflow-hidden text-left transition-all duration-200`
  - `hover:border-border hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] hover:-translate-y-0.5`
  - `focus-visible:ring-2 focus-visible:ring-primary/40`
- **Image**: `aspect-[16/10]` cover image via `propertyImage(null, l.id)`, `object-cover`, `group-hover:scale-[1.03] transition-transform duration-500`. Top-left overlay: status pill (small dot + label, `bg-background/85 backdrop-blur text-xs px-2 py-1 rounded-full border border-border/60`). Top-right overlay if `isLast`: "Last viewed" pill (`bg-primary text-primary-foreground`).
- **Body** (`p-4 space-y-3`):
  - Row 1: title (`text-[15px] font-semibold tracking-tight text-foreground line-clamp-1`) and, right-aligned, the price (`text-[15px] font-semibold tabular-nums`). Price shows `—` when null.
  - Row 2: location with `MapPin` icon (`text-xs text-muted-foreground line-clamp-1`).
  - Thin `border-t border-border/60 pt-3` divider.
  - Row 3 (meta): asset type label on the left (`text-xs text-muted-foreground`), `ChevronRight` 14px on the right. No "View Details" link text — the whole card is the action.
- **Status dot colors** stay the same logic (`bg-amber-500 / bg-emerald-500 / bg-muted-foreground/40 / bg-primary`).
- **Density 3**: cards moderately spaced, body padding `p-4`, gap `gap-5`. Not airy, not cramped.

**Group spacing**
- `space-y-12` between client sections (down from current `space-y-10`, but tighter visual weight per group means more air feels right).

### 2. `AgentListings.tsx` — header polish only
- Drop the page from `max-w-6xl` to `max-w-7xl` so the 3-column grid breathes at xl.
- Slightly lighter header treatment: `text-2xl` stays but switch subtitle copy to `text-sm text-muted-foreground/90` (no behavioral change).

### 3. No changes to
- `ListingPreviewDialog.tsx`
- `useAgentListings.ts`
- Filters / search popover / chips / "Continue where you left off" banner
- Routes, data, font stack (Plus Jakarta Sans stays per your answer)

## Tokens
Semantic only: `card`, `border`, `foreground`, `muted-foreground`, `primary`, `background`. Status dot utility colors (`amber-500 / emerald-500`) stay because they're shared across the app's status indicators.

## Out of scope
- No font changes anywhere.
- No new fields or images uploaded.
- No changes to the preview dialog, edit page, or workspace routes.
- No changes to the pipeline kanban or other listing surfaces.

## Files touched
- `src/features/workspace/components/ListingSwitcher.tsx` (only the `groups.map` render block)
- `src/pages/agent/AgentListings.tsx` (container max-width + subtitle class)
