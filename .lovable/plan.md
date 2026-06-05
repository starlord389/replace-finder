## Goal

Make client identity unmistakable everywhere a match, listing, or deal appears. An agent should be able to glance at any card and instantly know **which client** and **which of their relinquished properties** it belongs to, and visually group by client via a consistent accent color.

This is presentation-only — no scoring, matching, or schema changes.

---

## 1. Per-client accent colors

**Approach:** deterministic client-side derivation, no schema changes.

- Add `src/features/matches/lib/clientAccent.ts` exporting:
  - A curated palette of ~10 HSL-based accent tokens (e.g. indigo, teal, amber, rose, emerald, violet, sky, orange, fuchsia, lime) defined in `index.css` as `--client-accent-1` … `--client-accent-10` plus matching `--client-accent-N-soft` (low-opacity background) and `--client-accent-N-fg` (text-on-soft).
  - `getClientAccent(clientId: string)` → `{ ring, border, bg, text, dot }` Tailwind class set. Index is `hash(clientId) % palette.length`, stable across sessions.
- All colors live as HSL semantic tokens in `index.css` / `tailwind.config.ts`. No raw hex in components.
- Persistence is implicit: same `client_id` → same accent forever. No DB column needed. (If we ever want manual override, we can add `agent_clients.accent_index` later — out of scope now.)

---

## 2. Matches page (`/agent/matches`)

### 2a. Inbox card (`PropertyMatchCard.tsx`)

Restructure the card so **client identity leads**:

```text
┌─[accent border-left, 3px]──────────────────────┐
│ ● Sarah Chen · Houston Multifamily      [#3]   │  ← NEW: lead row, accent dot + client + relinquished
│ ─────────────────────────────────────────────  │
│ [img 64]  Phoenix Garden Apartments            │  ← matched property (was the lead, now secondary)
│   [99]    Phoenix, AZ · Multifamily            │
│           $2.4M · 6.2% cap · $148K NOI         │
│           Why: +35% ROE, no boot               │
│           [New match]              → Share     │
└────────────────────────────────────────────────┘
```

- Left border: `border-l-[3px]` using the client accent.
- Lead row: small accent dot + **bold client name** + " · " + relinquished property short label (city + asset, or property name if available). Truncates gracefully.
- Drop the existing "Matched for {client}" line — replaced by the lead row, no duplication.
- Keep rank pill, unread dot, score chip, status pill, next-action arrow.
- The lead row is **always shown** (regardless of `showClientLabel` / exchange scope) — that's the whole point.

### 2b. Preview / review panel (`PropertyReviewPanel.tsx`)

- Add a top "client context strip" above the property hero:
  - Accent-bg pill: `● Sarah Chen` (accent dot + client name, bg = `--client-accent-N-soft`, text = `--client-accent-N-fg`).
  - Followed by " · Trading out of **Houston Multifamily** ($1.8M · 5.1% cap)".
  - Right side: small "View exchange" link to `/agent/exchanges/:id`.
- The matched property hero/title remains, but visually subordinate to the client strip.

### 2c. Filter / group by client (replace "All exchanges" selector)

Convert `ExchangeContextBar`'s popover into a **client-first** picker:

- Top item: "All clients" (current "All exchanges" behavior).
- Then grouped by client: for each client, one header row with accent dot + client name + total match count; under it, one button per exchange (the relinquished property). Selecting the client header scopes to all that client's exchanges; selecting a child scopes to that single exchange.
- URL state: add `?client=<clientId>` alongside existing `?exchange=`. Either filters `rels` by `clientId` (new) or `buyerExchangeId` (existing). If both set, exchange wins.
- Add a "Group by client" toggle next to the sort/filter bar. When on, `InboxList` renders sticky client section headers (accent dot + name + count) between cards instead of a flat list. Default off when an individual exchange is selected; default on for "All clients".

### 2d. Required data

`Relationship` already carries `clientName` and `buyerExchangeId`. We need:
- `clientId` on each relationship (for stable accent + grouping). Add to `useUnifiedRelationships` by including `client_id` in the exchanges select and threading it through `exClientMap` → `Relationship.clientId`.
- Relinquished property label for the lead row. The agent already fetches relinquished snapshots in `useAgentMatchesQuery`; we'll add the same lookup (id, city, state, asset_type, property_name) to `useUnifiedRelationships` keyed by `buyer_exchange_id`, and expose `relinquishedLabel: string | null` on `Relationship`. No new tables — same `pledged_properties` + `exchanges.relinquished_property_id`.

---

## 3. Consistency across other list views

Apply the same accent + "Client · Relinquished" lead pattern wherever matches/deals appear in a list:

- **Dashboard "Needs attention"** (`AgentDashboard.tsx` via `useAgentAttentionQuery`): each row gets accent left-border + client lead line above the action.
- **Agent connection detail list / `AgentConnectionDetail`** previews: same treatment for any list of related deals.
- **Listings page (seller-side, `AgentMatchesHub` seller cards / `useAgentMatchesQuery.sellerMatches`)**: each seller-side match card shows the **buyer**'s client name and relinquished property (so the seller agent knows whose buyer is interested), using that buyer-client's accent. Falls back to "Buyer (private)" with a neutral accent if the connection isn't accepted yet (privacy unchanged).
- **Exchanges page (`AgentExchanges`)**: row left-border in the client's accent for visual grouping continuity.

Shared component: extract a small `<ClientLeadLine clientId clientName relinquishedLabel size?="sm|md" />` and `<ClientAccentBorder clientId>` wrapper so every list uses identical visuals.

---

## 4. Out of scope (explicit)

- No changes to scoring, ranking, matching engine, or any edge function.
- No schema migrations. (`accent_index` on `agent_clients` deferred; deterministic hash is enough.)
- No changes to the slide-out actions/deal-room panel internals — only the header above it picks up the accent.
- No changes to client-detail or exchange-detail pages beyond the accent border at the top.

---

## Technical summary

- New: `src/features/matches/lib/clientAccent.ts`, `<ClientLeadLine>`, `<ClientAccentBorder>` in `src/features/matches/components/shared/`.
- New CSS tokens in `index.css`: 10 accent triples (`--client-accent-N`, `-soft`, `-fg`), all HSL.
- Modified: `useUnifiedRelationships.ts` (add `clientId`, `relinquishedLabel`); `PropertyMatchCard.tsx`, `PropertyReviewPanel.tsx`, `ExchangeContextBar.tsx`, `InboxList.tsx` (group headers), `AgentMatchesHub.tsx` (URL `?client=`, group toggle), `useAgentMatchesQuery.ts` (expose client accent fields), `AgentDashboard.tsx` attention rows, `AgentExchanges.tsx` row borders.
- All Tailwind classes go through semantic tokens; no raw hex in components.

---

## Review checkpoints before I build

1. Accent palette = deterministic hash of `client_id` against 10 HSL tokens, no DB column. OK?
2. Card lead becomes "Client · Relinquished short-label" with accent left border; matched-property details move to the second tier. OK?
3. "All exchanges" picker becomes "All clients" with grouped exchanges underneath, plus an optional "Group by client" toggle on the inbox. OK?
4. Same treatment rolls out to dashboard attention, listings (seller side, with privacy fallback), and exchanges list. Anywhere else you want included?
