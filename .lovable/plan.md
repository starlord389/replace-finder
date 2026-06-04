# automation-worker audit

## What it actually does (function by function)

**`processMatchingQueue`** — Drains `match_job_queue`, runs matching, writes to `event_outbox`. **Dead.** Both tables don't exist; any call throws on the first query. This is the same queue you already replaced with inline matching in create/update-exchange.

**`processDeadlineNotifications`** — Scans `exchanges` for `identification_deadline` / `closing_deadline` within 7 days, inserts rows into `notifications`. **Code is valid against the live schema** (exchanges + notifications tables exist with the referenced columns). Would work if it ran.

**`processReferralAssignments`** — Picks pending rows from `referrals` and round-robin assigns to "agents." **Broken against current schema.** It filters agents with `profiles.role = 'agent'`, but `profiles` has no `role` column — roles live in `public.user_roles`. The agent list comes back empty every time, so it always returns `{ assigned: 0 }`. The `referrals` table is also empty (0 rows) per the earlier investigation. Effectively a no-op even if invoked.

## Is anything calling it?

- **No code references** anywhere in `src/` or `supabase/`. Grep for `automation-worker` returns zero hits.
- **No cron jobs** — the `pg_cron` extension isn't even enabled (`cron.job` table doesn't exist).
- **No DB triggers** invoke it.
- **No scheduled function** in Lovable Cloud.

It is fully unreachable today.

## Honest answer: do you lose anything by deleting it?

**No working functionality is lost.**

- Matching queue: already replaced by inline matching.
- Deadline reminders: **are not running today** — nothing invokes this function. Deleting it doesn't break a feature that's working; it removes code that pretends to be a feature. If you want deadline reminders, they need a scheduler (pg_cron + `net.http_post`) — that's a separate build, not preserved by keeping this file.
- Referral auto-assign: broken against current schema and the referrals table is empty.

## Recommendation: (a) delete it entirely

Reasons:
1. Zero callers, zero scheduler — nothing breaks.
2. Two-thirds of it is dead (queue/outbox tables don't exist; referral logic queries a non-existent column).
3. The one viable piece (deadline notifications) isn't actually running, so deleting it changes nothing in production behavior.
4. Keeping dead code that *looks* functional is worse than removing it — it implies reminders work when they don't.

If/when you want real deadline reminders, the right move is a fresh, focused edge function plus a `pg_cron` schedule. The current 184-line file isn't a useful starting point because the matching/referral halves are wrong for today's schema; you'd extract maybe 40 lines of deadline logic and rewrite the rest.

## Plan if you approve

1. Delete `supabase/functions/automation-worker/` directory.
2. Call `supabase--delete_edge_functions` to remove the deployed function from Lovable Cloud.

Nothing else touched. No DB changes. No frontend changes.
