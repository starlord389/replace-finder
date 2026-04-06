

# Phase 1A: Database Foundation — 17 Migrations

## Overview
Create all new tables for the exchange network alongside existing tables. No frontend changes. No RLS policies (Phase 1B). This is 17 sequential SQL migrations.

## Important Flags

**Foreign keys to `auth.users`**: Your SQL references `auth.users(id)` in many places (agent_clients, referrals, exchanges, exchange_connections, messages, notifications, etc.). Platform guidelines recommend against this because `auth.users` can't be queried from the client SDK. Since you already have a `profiles` table that mirrors user IDs, consider whether these FKs should reference `profiles(id)` instead. However, the FKs will still *work* for referential integrity — you just can't join through them from the client. I'll proceed with your SQL as written unless you want to change this.

**`profiles.role` column**: You're adding a `role` column directly to profiles. The existing `user_roles` table already stores roles. This creates two sources of truth. If this is intentional for the new data model, that's fine — just flagging it.

**CHECK constraints**: Several tables use CHECK constraints for enum-like values. These work fine for static value lists (not time-based), so no issue here.

## Execution Plan

Run all 17 migrations via the database migration tool in order:

1. **Expand profiles** — Add agent columns (mls_number, license_state, brokerage, bio, etc.), role column, verification fields, CHECK constraints
2. **agent_clients** — Agent-client relationships with status
3. **referrals** — Platform referral tracking
4. **exchanges** — Core exchange table with `exchange_status` enum, key dates, economics (FKs to properties/criteria added later)
5. **pledged_properties** — Property listings with `property_source` and `pledged_property_status` enums, physical details. Also adds FK from exchanges.relinquished_property_id
6. **property_financials** — Financials tied 1:1 to pledged_properties
7. **property_images + property_documents** — Media/docs for pledged properties
8. **replacement_criteria** — Buyer criteria per exchange, plus FK from exchanges.criteria_id
9. **matches** — Scored matches with `boot_status` enum, boot analysis fields, unique pair constraint
10. **exchange_connections** — Agent-to-agent connection flow with facilitation fee tracking
11. **identification_list** — 45-day ID list (max 3 positions per exchange)
12. **notifications** — User notifications with type constraints
13. **messages** — Connection-scoped messaging
14. **exchange_timeline** — Audit trail per exchange
15. **dst_properties** — Platform-managed DST backup options
16. **Auto-deadline trigger** — Calculates identification (sale+45d) and closing (sale+180d) deadlines
17. **Auto-status trigger** — Transitions exchange status based on data completeness

## What Gets Created
- 5 new enums: `exchange_status`, `property_source`, `pledged_property_status`, `boot_status` (plus reusing existing `asset_type`, `strategy_type`)
- 14 new tables with indexes
- 2 triggers + 2 functions on `exchanges`
- ~8 new columns on `profiles`

## What Does NOT Change
- No existing tables dropped or modified (except profiles)
- No frontend code touched
- No RLS policies created
- No edge functions modified

