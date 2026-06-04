
# Phase 3 plan — Reset mock data for ROE matching verification

## Part 1 — Clear existing test data

**What's in the DB today:** 6 auth users, 6 profiles, 8 exchanges, 8 agent_clients, 6 pledged_properties, 6 property_financials, 3 replacement_criteria, 14 matches, 3 exchange_connections, 17 messages, 7 notifications, 20 exchange_timeline rows.

**How seed data is distinguished:** the project does NOT have a clean `is_mock` boolean. Today's old seeder marks rows by string tag (`__mock__` in `agent_clients.notes`, `pledged_properties.description`, `notifications.metadata.tag`). That's brittle and doesn't tag everything (exchanges, financials, matches, etc. inherit by FK only). For this reset I'll use a **stronger rule**: treat every operational row as disposable test data and wipe broadly, but keep identity/configuration rows.

**Will DELETE (all rows, full-table truncate via cascade-safe order):**
- `messages`
- `exchange_connections`
- `matches`
- `exchange_timeline`
- `identification_list`
- `property_financials`
- `property_images`, `property_documents` (orphaned after properties go)
- `pledged_properties`
- `replacement_criteria`
- `exchanges`
- `agent_clients`
- `notifications`
- `client_invites` (test invites)

**Will KEEP, untouched:**
- `auth.users` (all 6 — including the two `mock.agent.*@replacefinder.test` counterparty users, which we'll reuse as buyer/seller agents)
- `profiles`, `user_roles`
- `app_settings` (the 7%/25y row)
- `support_tickets`, `demo_requests`, `contact_submissions`, `referrals`, `user_notification_preferences`

**Confirmation point for you:** there is no real production traffic on this DB — everything in those operational tables today is dev/seed. If any row in `exchanges`/`agent_clients`/etc. is something you actually want to keep, say so before I run this. Otherwise I'll wipe all of them.

## Part 2 — New mock data designed for ROE matching

### Actors (reuse existing auth users — no new auth.users created)
- **Buyer agent A** = `Eamon (eamon.t.mckenna123@gmail.com)` — primary test account, no criteria specified
- **Buyer agent B** = `Stephen Martin` — no criteria specified
- **Buyer agent C** = `Eamon (icloud)` — WITH replacement_criteria specified (tests the non-neutral fit path)
- **Seller agents** = the two existing `mock.agent.{alpha,bravo}@replacefinder.test` users, who will own the 8 candidate listings

Each buyer gets 1 agent_client + 1 active exchange + 1 relinquished pledged_property + 1 property_financials row for the relinquished asset.

### Buyers (relinquished property → known current ROE)

Buyer's current ROE formula: `noi / (asking_price − loan_balance)`. Equity = `asking_price − loan_balance`.

| Buyer | Relinquished asset | Asking | Loan bal | Equity | NOI | **Current ROE** |
|---|---|---|---|---|---|---|
| **A** Sarah Chen | Houston multifamily | $2,000,000 | $1,200,000 | $800,000 | $40,000 | **5.00%** |
| **B** Rodriguez LLC | Phoenix retail | $3,000,000 | $1,500,000 | $1,500,000 | $105,000 | **7.00%** |
| **C** Patel Trust | Raleigh office (asset_type=office, in criteria) | $1,500,000 | $700,000 | $800,000 | $48,000 | **6.00%** |

### Candidate listings (8 properties on seller agents)

Each fully populated: `asking_price > 0`, `noi ≥ 0`, `loan_balance = 0` (seller-side loan irrelevant to scoring), `occupancy_rate` set 85–98, `units`, `year_built`, asset_type, strategy_type, address/city/state.

Underwriting assumption (matches engine): debt service = annual payment on `0.75 × asking_price` at 7%/25y. Per $1M of loan at 7%/25y → annual P&I ≈ $84,773. So debt service per $1 of price ≈ `0.75 × 84773/1e6 ≈ 0.06358`.

| # | Property | Asset | City | Asking | NOI | Affordable for buyer? (equity ≥ 25%·price) |
|---|---|---|---|---|---|---|
| 1 | Sunrise Apartments | multifamily | Phoenix AZ | $3,000,000 | $260,000 | A no (needs $750k eq), B yes, C no |
| 2 | Crosspoint Industrial | industrial | Charlotte NC | $3,200,000 | $280,000 | B yes |
| 3 | Heights Garden Apts | multifamily | Houston TX | $3,200,000 | $230,000 | A yes (eq $800k = exactly 25%), B yes |
| 4 | Mesa Strip Retail | retail | Mesa AZ | $2,800,000 | $185,000 | A no, B yes |
| 5 | Tempe Flex Industrial | industrial | Tempe AZ | $3,000,000 | $200,000 | A no, B yes |
| 6 | Coral Plaza | retail | Miami FL | $2,400,000 | $135,000 | B yes |
| 7 | Triangle Office Park | office | Raleigh NC | $3,000,000 | $260,000 | C no (eq $800k vs $750k req — yes, barely) |
| 8 | Durham Medical Office | office | Durham NC | $2,800,000 | $215,000 | C yes |

(Affordability = equity ≥ 25% × asking, per `MAX_COMMERCIAL_LTV = 0.75`.)

### Worked example for **Buyer A** (equity $800k, current ROE 5.0%)

For each candidate, candidate_roe = `(NOI − 0.06358 × price) / 800000`.

| # | Price | NOI | Debt svc | Net to buyer | **Candidate ROE** | vs 5.0% baseline | Expected outcome |
|---|---|---|---|---|---|---|---|
| 1 | $3.0M | $260k | $190.7k | $69.3k | 8.66% | +3.66 pp | ❌ unaffordable (price $3M > $800k/0.25 = $3.2M? actually $3M ≤ $3.2M → **affordable**) → **match, high score** |
| 2 | $3.2M | $280k | $203.5k | $76.5k | 9.57% | +4.57 pp | affordable (=cap). **match, very high** |
| 3 | $3.2M | $230k | $203.5k | $26.5k | 3.31% | −1.69 pp | **NO match** (fails ROE gate) |
| 4 | $2.8M | $185k | $178.0k | $7.0k | 0.87% | −4.13 pp | **NO match** |
| 5 | $3.0M | $200k | $190.7k | $9.3k | 1.16% | −3.84 pp | **NO match** |
| 6 | $2.4M | $135k | $152.6k | −$17.6k | −2.20% | negative | **NO match** |
| 7 | $3.0M | $260k | $190.7k | $69.3k | 8.66% | +3.66 pp | **match, high score** |
| 8 | $2.8M | $215k | $178.0k | $37.0k | 4.63% | −0.37 pp | **NO match** (just under baseline) |

So Buyer A should end up with **3 matches** (#1, #2, #7), with #2 highest (~92 on ROE component), #1 and #7 mid-high (~73). Marginal-near-baseline candidate #8 deliberately falls just below to verify the gate is strict.

I'll publish the analogous tables for B and C in the build step. Headline expectations:
- **Buyer B** (baseline 7.0%, equity $1.5M): ~5 matches, all candidates affordable; spread spans well-above to just-above 7%.
- **Buyer C** (baseline 6.0%, equity $800k, criteria = office only): non-office candidates should still match on ROE but get a lower fit sub-score; #7 and #8 office candidates should score highest.

### Criteria (only Buyer C)
`replacement_criteria`: asset_types=['office'], target_states=['NC'], strategy_types=['core'] — to confirm fit weighting kicks in vs neutral.

## Part 3 — Trigger matching and view

After inserts, I'll call `run-auto-matching` once per buyer exchange (with the relinquished property_id) — that's the existing entrypoint, no new endpoint needed. It will populate `matches` including the new ROE columns.

**How you'll verify:**
1. UI: log in as Eamon, go to `/agent/matches` → open Buyer A's exchange → the `WhyThisMatched` banner shows "Current 5.0% → Projected X%" and `AgentMatchDetail` shows the full ROE breakdown.
2. DB: `SELECT buyer_current_roe, candidate_roe, roe_improvement_pp, total_score FROM matches ORDER BY buyer_exchange_id, total_score DESC` should match the predicted table above (within rounding).

## Technical notes
- Wipes use a single migration with `DELETE FROM ... WHERE true` (truncate would skip FK checks but migration is cleaner with ordered deletes).
- Inserts use `supabase--insert` (data-only) — no schema changes anywhere.
- No edits to `matching-core.ts`, `match-config.ts`, scoring weights, or any UI components in this phase.
- `exchange_timeline` rows are auto-created by app flows; I won't manually backfill — they'll regenerate as needed.

Awaiting your approval before I touch anything.
