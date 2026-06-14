## Goal

Turn `/agent/pipeline` from a 4-column board with bare cards into a complete deal-management surface: 6 stages, summary KPIs, search/filter/sort, richer cards, per-column deal value, and drag-and-drop stage overrides.

## New visual

```text
┌── Header (title + New listing) ─────────────────────────────────┐
│                                                                  │
│ [ Listings: 12 · $24.3M ] [ At-risk: 3 ] [ Best score: 87 ]      │  ← summary metrics
│ [ New: 4 ($6.1M) ]  ...                                          │
│                                                                  │
│ [ Search ____ ] [ Client ▾ ] [ Asset ▾ ] [ Sort ▾ ] [ Reset ]    │  ← sticky toolbar
│                                                                  │
│ ┌── New ──┐┌── Interested ──┐┌── Connected ──┐┌── LOI ──┐...     │  ← 6-stage board
│ │ count   ││ count          ││ count         ││ count   │        │
│ │ $value  ││ $value         ││ $value        ││ $value  │        │
│ │ [card]  ││ [card]         ││ [card]        ││ [card]  │        │
│ │ [card]  ││                ││               ││         │        │
│ └─────────┘└────────────────┘└───────────────┘└─────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

## Stages (6 columns)

`new → interested → connected → loi → under_contract → closed`

- **new** — UiStatus `new`
- **interested** — UiStatus `sent_to_client` + `client_interested`
- **connected** — UiStatus `in_conversation`
- **loi** — UiStatus `loi`
- **under_contract** — UiStatus `under_contract`
- **closed** — UiStatus `closed` OR listing.status `closed`/`completed`

`archived` matches are excluded from the board (filtered out, not a column).

A listing's auto-stage = the furthest stage reached across its matches (rank by the order above). If a listing has no matches, default to `new`.

## Drag-and-drop (manual override)

Schema change: add `pipeline_stage_override TEXT NULL` to `public.exchanges`. When non-null it wins over the auto-derived stage. Right-click / context menu on a card → "Reset to auto" clears the override.

- Implementation: `@dnd-kit/core` + `@dnd-kit/sortable` (already in many Lovable stacks; install if missing).
- On drop: optimistically update React Query cache, then `update exchanges set pipeline_stage_override = $stage where id = $id`. Toast on success/failure.
- A small "auto" / "manual" badge on each card so the agent knows whether the stage is overridden.

## Summary metrics bar

Top row of pill cards above the toolbar:
- **Listings** — total count + total deal value (sum of `askingPrice`).
- **At-risk** — count of listings whose nearest deadline ≤ 14d.
- **Best score** — highest `score` across all open relationships.
- **Active matches** — total open matches across listings.

Each pill is clickable to apply a board filter (e.g. At-risk → only at-risk listings).

## Filter / sort toolbar (sticky)

- **Search** — substring against `clientName`, `propertyName`, `address`, `city`.
- **Client filter** — multi-select of clients with at least one listing.
- **Asset type filter** — multi-select from distinct `assetType` values present.
- **Sort** — Recent activity (default) / Nearest deadline / Deal value (desc) / Best score.
- **Reset** — clears all filters.

State lives in URL query params so it survives reloads: `q`, `clients`, `assets`, `sort`, `risk`.

## Richer cards

`PipelineListingCard` updates:
- Top row: client accent dot + name, plus an "auto" / "manual" stage badge.
- Title: property name / address.
- Sub-row: city/state + asset type pill.
- Asking price (right-aligned, bold).
- Best match score chip (e.g. "87 score").
- Nearest deadline countdown chip: green (>30d) / amber (≤30d) / red (≤14d) / dark red (≤7d) / muted (none).
- Tiny stage-progress dot row showing all 6 stages with the current one filled.
- Footer: matches count + last activity relative time.
- Hover quick-action: "View matches →" linking to `/agent/matches?listing=<id>` (existing param) without opening the workspace.

## Per-column header

Each column header shows:
- Stage title + subtitle (one-liner about what the stage means).
- Count chip.
- Deal value sum at this stage.

## Empty states

- Whole board empty (no listings): existing prompt to create a listing.
- Filters return zero results: show "No listings match these filters" with a Reset button.
- Empty column: small muted "Nothing here yet" line.

## Files

`supabase migration`
- `ALTER TABLE public.exchanges ADD COLUMN pipeline_stage_override TEXT NULL;`
- No new policies needed — existing exchange policies cover updates by the owning agent.

`src/features/pipeline/hooks/useAgentListings.ts`
- Add `pipeline_stage_override` to the select and the returned `AgentListing` interface.

`src/features/pipeline/hooks/usePipelineStageOverride.ts` (new)
- `useUpdatePipelineStage()` mutation: `supabase.from('exchanges').update({ pipeline_stage_override }).eq('id', id)`. Invalidates `['agent-listings', userId]` and provides optimistic update.

`src/features/pipeline/lib/pipelineStages.ts` (new)
- Stage constants, labels, subtitles, rank map.
- `relsToStage(rel, localState)` → maps UiStatus → StageKey.
- `deriveAutoStage(listing, rels)` → walks all rels for an exchange, returns furthest stage.
- `resolveStage(listing, autoStage)` → `pipeline_stage_override ?? autoStage`.

`src/features/pipeline/lib/pipelineFilters.ts` (new)
- Filter, sort, and search pure functions operating on `(listing, computedMeta)` tuples.
- Sort options enum + comparator factory.

`src/features/pipeline/components/PipelineKanban.tsx`
- Replace current implementation with 6 columns.
- Use `@dnd-kit/core` `DndContext` + `useDroppable` on columns + `useDraggable` on cards.
- Compute per-column count and deal value.
- Pass filter results in from `AgentPipeline` (parent owns filter state).

`src/features/pipeline/components/PipelineListingCard.tsx`
- Add price, asset pill, deadline chip, score chip, stage-progress dots, auto/manual badge, hover quick-action.
- Accept `isDragging` and visual override.

`src/features/pipeline/components/PipelineSummaryBar.tsx` (new)
- Renders the four metric pills. Receives derived metrics from parent. Clickable to set/unset filters.

`src/features/pipeline/components/PipelineToolbar.tsx` (new)
- Search input, client multi-select, asset multi-select, sort dropdown, reset button.
- Lifts state via URL search params.

`src/pages/agent/AgentPipeline.tsx`
- Orchestrates: reads URL params, derives filtered/sorted listings, renders SummaryBar + Toolbar + Kanban.
- Keeps the legacy deep-link redirect effect.

## Out of scope

- Mobile-specific overhaul (board scrolls horizontally on small screens; toolbar stacks).
- Drag-and-drop within a column to reorder (no manual ordering — sort handles it).
- Bulk actions (multi-select cards). Could come later.
- Editing match-level UiStatus from the pipeline — that still happens in the Matches inbox / Workspace.
- No new RLS policies (existing exchange policies cover `pipeline_stage_override` updates).