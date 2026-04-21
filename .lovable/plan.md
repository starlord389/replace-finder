

## Edit, draft, and publish exchanges

Today exchanges are write-once: the wizard creates them, but the detail page is read-only and there's no way to change a property, financials, criteria, or move between draft ↔ active. I'll add a full edit flow that mirrors the create wizard and adds inline status controls.

### What you'll see

**On the exchange detail page (`/agent/exchanges/:id`)**
- New header actions next to the status badge:
  - **Edit** button — opens the wizard prefilled with the exchange's data
  - **Publish** button — visible only when status is `draft`; flips status to `active`, queues matching, and adds a timeline event
  - **Save as Draft** button — visible only when status is `active` (and no connections yet); flips back to `draft` and pauses matching
  - **Delete draft** button — visible only on drafts with no matches/connections (small, destructive variant)
- Status badge updates immediately after any action, with a toast confirming what happened

**Edit page (`/agent/exchanges/:id/edit`)**
- Same 4-step wizard UI as "New Exchange", prefilled with everything: client (locked — can't switch client on an existing exchange), property, financials, photos, replacement criteria
- Step header label says "Edit Exchange" instead of "New Exchange"
- Review step shows two buttons matching current status:
  - If editing a draft: **Save Changes (Draft)** + **Save & Publish**
  - If editing an active exchange: **Save Changes** + **Save & Move to Draft**
- Cancel button returns to detail page without saving
- Existing photos appear in the uploader with a remove button; new photos can be added

**Toast / timeline behavior**
- Every save inserts an `exchange_timeline` event: `exchange_updated`, `exchange_published`, or `exchange_moved_to_draft` with a description like "Property financials updated" or "Exchange published — matching queued"
- Publishing an active exchange re-enqueues a match job so updated criteria/financials get rescored

### How it works

**Frontend**
- `src/pages/agent/EditExchange.tsx` (new) — copy of `NewExchange.tsx` adapted to:
  - Take `:id` from URL
  - Hydrate `WizardState` from existing rows (`exchanges` + `pledged_properties` + `property_financials` + `property_images` + `replacement_criteria`)
  - Lock the client step (display only) — first wizard step becomes a read-only client card with "Continue"
  - Call `useUpdateExchange` instead of `useCreateExchange`
- `src/features/exchanges/api/updateExchange.ts` (new) — invokes a new `update-exchange` edge function with the same payload shape as create plus `exchangeId` and an `intent: "save_draft" | "publish" | "save_active" | "move_to_draft"`
- `src/features/exchanges/hooks/useUpdateExchange.ts` (new) — mirrors `useCreateExchange`, invalidates the same queries plus `["exchange-detail", id]`
- `src/pages/agent/AgentExchangeDetail.tsx` — add the action buttons; small mutations for inline publish / move-to-draft / delete draft that hit the same edge function with intent flags (no wizard required for those quick toggles)
- `src/App.tsx` — register `/agent/exchanges/:id/edit` route

**Backend**
- New edge function `supabase/functions/update-exchange/index.ts`:
  - Verifies caller owns the exchange (`agent_id = auth.uid()`)
  - For wizard saves: `UPDATE` the `pledged_properties`, `property_financials`, `replacement_criteria`, and `exchanges` rows; reconcile `property_images` (delete removed, insert new)
  - For status changes: just update `exchanges.status` (+ set `listed_at` on pledged_properties when publishing)
  - On publish (whether from wizard or inline button), enqueue a row in `match_job_queue` so re-scoring runs
  - Insert appropriate `exchange_timeline` event
  - Insert `event_outbox` row (`exchange.updated` or `exchange.published`)
- Inline `delete-draft` action (only allowed when status = `draft` AND no rows in `matches` or `exchange_connections` referencing it) — handled in the same edge function with `intent: "delete_draft"`; cascades cleanup of property/financials/images/criteria/timeline

**Guardrails**
- Can't move an exchange to draft once it has any `accepted` or `completed` `exchange_connections` — button is hidden in that case
- Can't change the client on an existing exchange — first wizard step becomes read-only
- Can't delete an exchange that already has matches generated — only fresh drafts

### Files

| File | Change |
|---|---|
| `src/pages/agent/EditExchange.tsx` | New — wizard in edit mode |
| `src/features/exchanges/api/updateExchange.ts` | New — client-side wrapper |
| `src/features/exchanges/hooks/useUpdateExchange.ts` | New — React Query mutation |
| `src/pages/agent/AgentExchangeDetail.tsx` | Add Edit / Publish / Save-as-Draft / Delete buttons + handlers |
| `src/App.tsx` | Register `/agent/exchanges/:id/edit` |
| `src/components/exchange/StepSelectClient.tsx` | Optional `lockedClientName` prop to render read-only mode |
| `src/components/exchange/StepReview.tsx` | Add `mode` prop ("create" \| "edit-draft" \| "edit-active") to render correct button labels |
| `supabase/functions/update-exchange/index.ts` | New — handles update, publish, move-to-draft, delete-draft intents |

### Out of scope

- Editing exchange after a connection is accepted (keeps audit trail clean — would need a change-request flow)
- Bulk status changes from the list page
- Versioning/history of property snapshots beyond the existing timeline events

