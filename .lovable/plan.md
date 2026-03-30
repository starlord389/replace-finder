

# Help Center Redesign — Two-Tab Layout with Enhanced Content

## The UX Decision

Split Help & Support into **two tabs on the same page** rather than two separate sidebar pages. This keeps navigation simple (one "Help" link in the sidebar) while cleanly separating informational content from support tickets. Users land on the Help tab by default (FAQs + guides), and switch to Support when they need to submit or track tickets.

This solves the conflict: FAQs are front-and-center for self-service, but the support form is one click away — not buried at the bottom.

## Page Layout

### Top of Page
- Page title: "Help Center"
- Subtitle: "Find answers, learn the platform, or get in touch."
- **Two tabs**: "Help & FAQs" (default) | "Support"

### Tab 1: Help & FAQs

**Quick Links Row** (new) — 3-4 action cards at the top for the most common actions:
- "Start an Exchange" → links to /dashboard/exchanges/new
- "View Your Matches" → links to /dashboard/matches
- "Contact Support" → switches to Support tab
- "Update Profile" → links to /dashboard/settings

**How-To Guides** — Same card grid as current, same expand/collapse behavior. Keep exact current UI style.

**FAQ Accordion** — Same categorized accordion cards as current. Add one more category:

- **NEW category: "1031 Exchange Basics"** (5 items):
  - What is a 1031 exchange?
  - What are the key deadlines? (45-day identification, 180-day close)
  - What qualifies as "like-kind" property?
  - What is "boot" and how does it affect my taxes?
  - Can I do a 1031 exchange on my primary residence?

This helps users who are new to 1031 exchanges, not just new to the platform.

**Platform Overview** (new, at bottom) — A brief "About the Platform" card explaining the end-to-end workflow in 4 steps: Submit Request → We Match → You Review → Close Exchange. Simple numbered list, no complexity.

### Tab 2: Support

**Support Form** — Same form as current (category, subject, message) but now at the **top** of the tab, which is what the user wanted. Keep exact current form UI.

**Contact Info Card** — Same "Other Ways to Reach Us" card alongside the form (email, phone, hours). Same layout.

**Your Tickets** — Below the form, show the user's past tickets with status badges. Same current UI.

## Technical Approach

Use shadcn `Tabs` component for the two-tab layout. All content stays in a single `Help.tsx` file — no new routes needed.

## Files Changed

1. **`src/pages/client/Help.tsx`** — Rewrite to use Tabs layout, add quick links row, add "1031 Exchange Basics" FAQ category, add platform overview card. Move support form + tickets into the Support tab.

No database changes. No new routes. No sidebar changes.

