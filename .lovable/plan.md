## Redesign: Matches → Pipeline

Rebuild the Matches hub as a **kanban pipeline** (Linear / Pipedrive style) with a focused side-drawer for detail. Drops the noisy two-pane inbox.

### New layout

```text
┌───────────────────────────────────────────────────────────────────┐
│ Matches                                       [ + New exchange ]  │
│ Drag deals across stages, or click a card to open.                │
│                                                                   │
│ [ All · New · Pending · Active · Closed ]   🔍 search   ⚙ filter │
├───────────────────────────────────────────────────────────────────┤
│  NEW (11)     │ PENDING (2)   │ ACTIVE (1)    │ CLOSED (0)        │
│  ─────────    │ ─────────     │ ─────────     │ ─────────         │
│  ┌─────────┐  │ ┌─────────┐   │ ┌─────────┐   │                   │
│  │ A  82●  │  │ │ P  86●  │   │ │ M  91●  │   │   (empty state)   │
│  │ Coral…  │  │ │ Crossp… │   │ │ Park…   │   │                   │
│  │ $6.2M   │  │ │ Charlot │   │ │ Conv… 2 │   │                   │
│  │ Miami   │  │ │ ▸ Reply │   │ │ ▸ Open  │   │                   │
│  └─────────┘  │ └─────────┘   │ └─────────┘   │                   │
│  ┌─────────┐  │               │               │                   │
│  │ …       │  │               │               │                   │
└───────────────────────────────────────────────────────────────────┘
```

Click a card → right-side **drawer** (Sheet) slides in, ~520px wide, with:
- Sticky header: counterparty + stage chip + score + "View full" link
- **Conversation is the default body** once connected (chat-first, not a tab)
- Collapsible **Context** rail above chat: property mini-card, match score breakdown, exchange/client, boot warning, timeline — all visible without tab switching
- Sticky footer = the message composer or the primary action button (Accept / Send request / Schedule)

### Stage model (simplified)

Collapse 8 internal stages into 4 user-visible columns:

| Column   | Internal stages                          |
|----------|------------------------------------------|
| New      | `new`, `incoming`                        |
| Pending  | `pending_in`, `pending_out`              |
| Active   | `connected`, `conversing`                |
| Closed   | `closed_won`, `closed_lost`              |

- Single segmented control above the board filters which column(s) show. "All" = all 4 columns visible (default).
- Each card shows ONE status line, not three. Score is a small colored dot + number. "New"/unread is a single blue dot on the avatar — no separate badge.
- Each card surfaces ONE primary CTA based on stage: `Accept request` / `Send request` / `Reply` / `Open`.

### Drawer detail (replaces 4-tab pane)

```text
┌──────────────────────────────────────────────┐
│ ← P  Priya Mehta              [CONVERSING]   │
│    Crosspoint Industrial · 86 match          │
├──────────────────────────────────────────────┤
│ ▾ Context  (collapsed by default if chat)    │
│   [property thumb] Crosspoint Industrial     │
│   Charlotte, NC · $8.2M · 6.1% cap           │
│   Score 86: price ✓ geo ✓ asset ✓ …          │
│   Client: Acme Holdings · Exchange #4821     │
├──────────────────────────────────────────────┤
│ Conversation                                 │
│   ┌──────────────────────────────────────┐   │
│   │  (message thread)                    │   │
│   └──────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│ [ Type a message…              ]   ▸ Send   │
└──────────────────────────────────────────────┘
```

- Pre-connection stages: Context is **expanded by default**, footer shows the primary action (Accept / Send request / Decline), no composer.
- Post-connection: Context **collapsed by default**, footer is the composer. Click "Context" header to expand.
- Property/timeline/score breakdown all live inside the Context accordion — no separate tabs.
- "View full" link in header opens existing dedicated detail page for deep work.

### Mobile

- Kanban → horizontal scroll-snap columns (one column per viewport width)
- Drawer becomes full-screen Sheet from right
- Segmented control becomes a select dropdown

### Files

**New**
- `src/features/matches/components/PipelineBoard.tsx` — 4 columns, virtualized vertical scroll per column
- `src/features/matches/components/PipelineColumn.tsx` — header (label + count), scrollable body, empty state
- `src/features/matches/components/RelationshipCard.tsx` — compact card (avatar, score dot, property + city, $price, one CTA, unread dot)
- `src/features/matches/components/RelationshipDrawer.tsx` — Sheet with sticky header, Context accordion, conversation body, sticky footer
- `src/features/matches/components/ContextPanel.tsx` — collapsible context (property, score breakdown, exchange, boot, timeline)
- `src/features/matches/components/StageActionButton.tsx` — renders the right primary action per stage

**Edited**
- `src/pages/agent/AgentMatchesHub.tsx` — replace two-pane inbox with `PipelineBoard` + `RelationshipDrawer`; drop `Tabs` tab system; keep search + `?id=` URL sync
- `src/features/matches/hooks/useUnifiedRelationships.ts` — add `column: "new" | "pending" | "active" | "closed"` derived field; no schema change

**Reused as-is**
- `ThreadView` (chat body + composer) — embedded in drawer
- `useUnifiedRelationships` data
- Existing accept/decline/send-request mutations

### Out of scope

- Drag-and-drop between columns (stage changes are still driven by actions, not drag) — can add later
- Bulk actions, saved views, ⌘K
- Backend / matching logic changes

### Design tokens

Stays on the locked palette: Inter, blue-600 primary, light theme. Column headers use muted-foreground with a thin accent bar in primary. Cards use `bg-card` with `border-border`, hover lifts to `shadow-sm` + `border-primary/30`. Score dot: emerald ≥85, amber ≥70, rose <70 (existing scale).
