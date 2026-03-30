

# Redesign Launchpad as Onboarding Guide

## Concept
Transform the Launchpad from a stats/quick-actions page into a guided onboarding checklist — helping new users understand the 1031 exchange process on the platform. Inspired by GoHighLevel's approach: a centered list of actionable steps, each with a description and a CTA button, that guide the user through key platform features.

## Design
A centered card-based checklist with a welcoming heading like "Let's get your 1031 exchange started". Each step is a horizontal row with an icon, title, description, and action button. Steps are contextually aware — completed steps show a green checkmark instead of a CTA.

```text
┌─────────────────────────────────────────────────────┐
│  Let's get your 1031 exchange started               │
│  Complete these steps to make the most of the       │
│  platform.                                          │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ 👤  Complete your profile                   │    │
│  │     Add your name, phone, and company so    │    │
│  │     we can reach you about your exchange.   │    │
│  │                              [Complete] ✓   │    │
│  ├─────────────────────────────────────────────┤    │
│  │ 📋  Submit your first exchange request      │    │
│  │     Tell us about the property you're       │    │
│  │     selling and what you're looking for.    │    │
│  │                          [Start Exchange]   │    │
│  ├─────────────────────────────────────────────┤    │
│  │ 🔍  Review your matches                     │    │
│  │     Once we find matching properties,       │    │
│  │     you'll review and respond here.         │    │
│  │                          [View Matches]     │    │
│  ├─────────────────────────────────────────────┤    │
│  │ 📊  Track your exchange progress            │    │
│  │     Monitor deadlines, status updates,      │    │
│  │     and timelines from the Overview page.   │    │
│  │                          [Go to Overview]   │    │
│  ├─────────────────────────────────────────────┤    │
│  │ ❓  Need help?                              │    │
│  │     Learn how 1031 exchanges work and       │    │
│  │     get answers to common questions.        │    │
│  │                          [Visit Help]       │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Progress: ██░░░░░░░░ 1 of 5 complete               │
└─────────────────────────────────────────────────────┘
```

## Steps (with completion logic)

1. **Complete your profile** — Check if `profiles` has `full_name` and `phone` filled → links to `/dashboard/settings`
2. **Submit your first exchange request** — Check if user has any `exchange_requests` → links to `/dashboard/exchanges/new`
3. **Review your matches** — Check if user has any `matched_property_access` rows → links to `/dashboard/matches`
4. **Track your exchange progress** — Check if user has visited Overview (or just always available) → links to `/dashboard/overview`
5. **Need help?** — Always available → links to `/dashboard/help`

## Technical Changes

### 1. Rewrite `src/pages/client/Launchpad.tsx`
- Fetch profile data (full_name, phone) and exchange_requests count and matched_property_access count on mount
- Compute completion state for each step
- Render centered card with step rows — each row: icon, title, description, and either a "Complete ✓" badge or a CTA button (Link)
- Show a progress bar at the bottom with "X of 5 complete"
- Clean, premium design matching the app's style (no bright green GoHighLevel buttons — use the existing primary blue)

### No other files change
- No database changes
- No routing changes
- No new components needed — all self-contained in Launchpad.tsx

