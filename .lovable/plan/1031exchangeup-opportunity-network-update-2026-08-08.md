# 1031ExchangeUp: Opportunity Network Update

Goal: make the product immediately understandable to agents and investors, and make the
underlying flows (ROE entry, progressive criteria, same-agent matching, alerts) actually
support the "continuous opportunity monitoring" promise. Existing visual identity, layout
system and working features are kept — this modifies what exists rather than rebuilding.

## 1. Homepage restructure (copy + hierarchy)

New section order, reusing existing section components where they already exist:

```text
HERO              Your next investment opportunity may already be in the network.
                  CTAs: Find Opportunities  /  See How It Works
MATCH VISUAL      Property + Investor goals + Network -> Intelligent match -> Agent alert
AGENT OPPORTUNITY "Your database may already contain your next transaction."
INVESTOR          "Put your equity to work."
ROE CALCULATOR    3 inputs, result screen, funnel into criteria
HOW IT WORKS      Add -> Analyze -> Match -> Alert -> Connect
PRODUCT PREVIEW   Existing dashboard mockup + a realistic match-alert card
NETWORK / TRUST   Existing logos + experts
EDUCATION/EVENTS  Existing summit card, demoted
FINAL CTA         Add your first opportunity
```

Removals/merges: duplicate "who it's for" and repeated 1031-explainer blocks collapse into
the two audience sections. AI stays as a supporting mention, not the headline claim.

## 2. Trust and consistency fixes

- Single source of truth for events: `src/content/events.ts` exporting the upcoming summit
  (date, time, platform, registration link). The homepage card, resources list and success
  message all read from it, so a date is never stale in two places again.
- Remove any "thousands of opportunities" style claims; replace with "continuously searches
  the ExchangeUp network".
- One pricing story everywhere (hero badges, agent section, FAQ, final CTA):
  investors free; agents free for their first monitored client/property; paid plan to monitor
  additional clients/properties; founding-member language reframed as early-access, not a
  separate price.

## 3. ROE calculator as an acquisition funnel

Rework the existing `RoeMiniCalc` (no new page):

- Inputs reduced to three: estimated fair market value, outstanding loan balance,
  total gross monthly rent. Net income is removed from the entry step.
- Result screen: large equity figure, a simplified return-on-equity percentage, then
  "Is that equity working as hard as it could?" and a primary CTA "See my opportunities".
- CTA carries the entered figures into signup/onboarding so the numbers are not re-typed.

## 4. Progressive criteria (investor onboarding)

Replace the single long intake with a short multi-step flow, one decision per screen,
mobile-first, with a light progress indicator. Steps: replacement market, property type,
target replacement value, objective, timeline, exchange status. Every step skippable, with
"the more ExchangeUp knows, the smarter your matches" messaging. Values persist to the
existing investor preferences / replacement criteria records and stay editable in settings.

Onboarding also asks: "Are you currently working with a real estate agent?"
- Yes -> collect the agent email and send the existing representation invite in the
  background; onboarding continues immediately.
- No -> continue, and flag the investor for an investor-focused agent referral.

Both paths use the representation and referral machinery that already exists.

## 5. Matching engine

- Confirm and, where needed, remove suppression of same-agent / same-brokerage matches.
  These surface as an internal opportunity on the agent's own dashboard rather than a
  connection request to themselves.
- Keep the trade-up rule as an eligibility gate (replacement value >= relinquished value),
  and separate it visually and in data from investment-quality scoring (market, type,
  preferences, returns, equity deployment, cash flow, timing).
- Match cards and alerts show eligibility status and quality score as two distinct signals.

## 6. Alerts and continuous monitoring

- Agent-facing alert copy standardised: opportunity summary, property value, target range,
  market match, profile match percentage, "View opportunity" — no confidential investor or
  address detail before parties engage.
- Persistent "ExchangeUp is monitoring in the background" state on exchange, listing and
  investor detail surfaces, showing last-evaluated time so the product feels active between
  matches.

## Technical notes

- Homepage work is confined to `src/pages/Home.tsx` and `src/pages/HomeSections.tsx`, plus a
  new `src/content/events.ts`.
- ROE changes are inside the existing `RoeMiniCalc` component; result state handled locally.
- Investor onboarding modifies `src/pages/investor/InvestorLaunchpad.tsx` and the existing
  investor preferences hook; no new tables are required — `investor_preferences`,
  `replacement_criteria`, `agent_representations` and `referrals` already cover the fields.
- Matching changes live in `supabase/functions/_shared/matching-core.ts` and are covered by
  the existing unit tests, which will be extended for the same-agent case.
- No visual system, token or font changes.

## Suggested sequencing

1. Events source + trust/pricing consistency (small, unblocks the rest of the copy)
2. Homepage restructure and copy
3. ROE calculator funnel
4. Investor progressive onboarding + agent question
5. Matching engine same-agent + eligibility/quality split, alerts and monitoring states
