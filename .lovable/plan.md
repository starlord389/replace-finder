# Fix mobile responsiveness — user-facing (agent) pages only

## What's happening

On mobile, agent pages load zoomed-out and scroll sideways. Root causes:

1. **Content wider than viewport** — filter rows with `min-w-max` + stacked fixed-width selects (`AgentMatches`, `AgentPledgedProperties`), and a few header rows that don't wrap (`AgentMatchDetail`, `AgentExchangeDetail`).
2. **No global overflow guard** — nothing on `html/body` or the layout `<main>` prevents a single wide child from forcing horizontal scroll on the whole page.
3. **Viewport meta** missing `viewport-fit=cover` (iOS gutter).
4. **iOS focus auto-zoom** — `<Select>` and `<Textarea>` use `text-sm` (14px), which makes iOS Safari zoom in on focus. `Input` already handles this correctly with `text-base md:text-sm`.

Scope: agent app only (`/agent/*`). No admin pages, no public/marketing pages.

## Fix plan

### 1. Viewport + global safety net
- `index.html`: viewport meta → `width=device-width, initial-scale=1.0, viewport-fit=cover`.
- `src/index.css`: add `html, body { overflow-x: hidden; }` and `body { -webkit-text-size-adjust: 100%; }`.

### 2. Agent layout container
- `AgentLayout.tsx`: add `min-w-0 overflow-x-hidden` to the flex column and `<main>` so a wide child can't blow out the page.

### 3. Agent page fixes (surgical, no redesign)
- **`AgentMatches.tsx`** — convert the `min-w-max` filter row of four `w-[200px]`/`w-[180px]` selects to `grid grid-cols-2 gap-2 md:flex md:flex-wrap`, selects `w-full md:w-[180px]`. Drop the outer `overflow-x-auto`.
- **`AgentPledgedProperties.tsx`** — search + select row to `flex-col sm:flex-row`; search `w-full`, select `w-full sm:w-[180px]`.
- **`AgentMatchDetail.tsx`** — header band: add `flex-wrap` + `min-w-0` so the title row doesn't push width. Keep the two existing `overflow-x-auto` table wrappers.
- **`AgentExchangeDetail.tsx`** — title row: add `flex-wrap` + `min-w-0`.
- **`AgentMessages.tsx`** — verify the two-pane layout collapses to a single column under `md`; if both panes still render side-by-side, gate one with `hidden md:flex` based on whether a conversation is open.
- **`AgentConnections.tsx` / `AgentClients.tsx` / `AgentDashboard.tsx` / `AgentSettings.tsx`** — spot-fix any header/card rows where `min-w-0` is missing on flex children with long text. No structural changes.

### 4. iOS focus auto-zoom on form controls (used inside agent pages)
- `src/components/ui/select.tsx` (SelectTrigger): `text-sm` → `text-base md:text-sm`.
- `src/components/ui/textarea.tsx`: `text-sm` → `text-base md:text-sm`.

### 5. Verification
Set preview to mobile (375px) and walk through every `/agent/*` page: Dashboard, Launchpad, Matches, Match Detail, Exchanges, Exchange Detail, New/Edit Exchange, Pledged Properties, Connections, Connection Detail, Clients, Client Detail, Messages, Settings, Help. Confirm: no horizontal scroll, pages render at natural 1× zoom, no input triggers iOS focus zoom. Re-check at 768px to make sure desktop layouts still look right.

## Out of scope
- Admin pages (`/admin/*`).
- Public/marketing pages (already work on mobile).
- Any redesign, business-logic, or data changes.
