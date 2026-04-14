# Production Readiness Checklist

## Security and Access
- [ ] Apply latest migrations including RLS hardening and queue primitives.
- [ ] Confirm service-only insert policies for `matches`, `notifications`, and `exchange_timeline`.
- [ ] Rotate service role key and verify it is never exposed in browser builds.
- [ ] Run referral intake abuse checks (rate limiting/captcha at edge).

## Core Workflow
- [ ] Verify `create-exchange` edge function successfully creates draft and activated exchanges.
- [ ] Verify activated exchanges enqueue `match_job_queue` jobs.
- [ ] Verify `automation-worker` processes queue jobs and writes matches.
- [ ] Verify bilateral connection flow still enforces fee acknowledgment before identity reveal.

## Deadlines and Automation
- [ ] Schedule `automation-worker` invocation (Supabase scheduled function/cron).
- [ ] Verify deadline notifications (`deadline_warning`, `deadline_critical`) are generated only once per window.
- [ ] Verify referral auto-assignment writes `assigned_agent_id` and sends notifications.

## Quality and Observability
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run verify:domain` against staging data.
- [ ] Verify telemetry logs appear for login success/failure, exchange creation, matching, and connection initiation.

## Agent Signup Validation
- [ ] Verify agent signup only asks for essential self-certification fields.
- [ ] Verify the auth trigger writes agent role, license state, brokerage name, professional ID, and `verification_status = 'verified'`.
- [ ] Verify pending legacy agent profiles are migrated to active self-certified status.
- [ ] Verify signup success copy instructs email confirmation and does not mention manual approval.
- [ ] Verify confirmed agents land in `/agent` with no pending-verification banner or badge.
- [ ] Verify suspended agents still surface clear restricted-state messaging.

## Agent Launchpad Validation
- [ ] Verify new agents are routed to `/agent/launchpad` until launchpad completion is recorded.
- [ ] Verify launchpad progress updates from live profile, client, exchange, match, and connection state.
- [ ] Verify the profile checklist step only completes when brokerage details, bio, and specializations are filled in.
- [ ] Verify the inline matching explanation expands in place and contributes to visible checklist progress.
- [ ] Verify all launchpad steps complete before the final dashboard CTA appears.
- [ ] Verify Launchpad remains accessible from the agent sidebar after completion.

## Release Controls
- [ ] Roll out with feature flags for automation worker and referral auto-assignment.
- [ ] Monitor `event_outbox` and `match_job_queue` for failed records.
- [ ] Validate rollback process for latest migrations in staging before production.
