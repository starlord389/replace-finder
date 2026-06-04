# Inline matching in create-exchange / update-exchange

## Verification

Confirmed against current code:

- **`_shared/matching-core.ts`** exports `computeMatchesForExchange(db, userId, exchangeId, propertyId)` and `persistMatchesAndNotifications(db, matches, userId)` — exactly what `run-auto-matching` uses.
- **`run-auto-matching/index.ts`** is the reference pattern: compute → persist → return. Stays untouched.
- **`create-exchange/index.ts`** writes to `match_job_queue` at L175 (on `activate`) and to `event_outbox` at L183.
- **`update-exchange/index.ts`** writes to `match_job_queue` at L71 (delete on draft-delete), L200 (rescore on save), L231 (publish). Writes to `event_outbox` at L192, L244, L270.

One nuance worth flagging: `update-exchange` currently re-queues matching on a plain save only when the exchange is already published AND criteria/financials changed (L199). The plan preserves that gating.

## Plan

### 1. Add a shared inline-matching helper

In `_shared/matching-core.ts`, add a small wrapper:

```ts
export async function runMatchingSafe(db, userId, exchangeId, propertyId, reason) {
  try {
    const matches = await computeMatchesForExchange(db, userId, exchangeId, propertyId);
    const newCount = await persistMatchesAndNotifications(db, matches, userId);
    console.log(`[matching:${reason}] exchange=${exchangeId} new=${newCount}`);
    return { ok: true, new_matches: newCount };
  } catch (err) {
    console.error(`[matching:${reason}] FAILED exchange=${exchangeId}`, err);
    return { ok: false, error: (err as Error).message };
  }
}
```

This guarantees matching errors never bubble up to fail the save.

### 2. `create-exchange/index.ts`

- Import `runMatchingSafe` from `_shared/matching-core.ts`.
- Replace the `match_job_queue` insert at L175 with `await runMatchingSafe(db, user.id, exchangeId, propertyId, "create:activate")` (only when `payload.activate`).
- Delete the `event_outbox` insert at L183.
- Update the response: replace `matching_queued` with `matching_ran` (boolean) so the frontend signal is honest.

### 3. `update-exchange/index.ts`

- Import `runMatchingSafe`.
- L71 (`match_job_queue` delete on draft-delete): remove — queue table doesn't exist.
- L192 (`event_outbox` insert on plain update): remove.
- L200 (`match_job_queue` insert on rescore): replace with `runMatchingSafe(db, user.id, exchange.id, propertyId, "update:rescore")`. Preserve existing gate (`exchange.status !== "draft" && (payload.criteria || payload.financials) && propertyId`).
- L231 (`match_job_queue` insert on publish, inside `handleStatusChange`): replace with `runMatchingSafe(db, userId, exchange.id, propertyId, "update:publish")`.
- L244 and L270 (`event_outbox` inserts in `handleStatusChange`): remove.

### 4. Failure isolation

All `runMatchingSafe` calls are awaited but swallow their own errors and log. Saves complete regardless. No `try/catch` reshuffling needed in the calling functions — the helper is the boundary.

### 5. Out of scope (not touched)

- `run-auto-matching/` — unchanged, still callable manually.
- `_shared/matching-core.ts` core scoring functions — unchanged, only a new wrapper added.
- `automation-worker/` — not touched in this change. It still references `match_job_queue` and `event_outbox` and remains effectively dead until you decide to delete it (separate task).
- `matches` table, scoring weights, notifications behavior — unchanged.
- Database schema — no migrations.
- Frontend — no changes; both functions keep returning success payloads on the same shape (plus the renamed `matching_ran` flag, which appears unused by the UI but I'll grep to confirm during build).
