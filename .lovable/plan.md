# Goal

Make every navbar across the site visually identical to the front-page (landing) nav, and add a touch more space between the logo and the left edge of the pill.

# Control values (from landing nav)

The injected landing navbar in `src/pages/Index.tsx` (`NAVBAR_STYLE`) defines the reference:

- Pill max width: **752px**
- Pill height: ~**58px** desktop / **52px** min mobile
- Pill border-radius: full (28px on mobile)
- Logo SVG height: **32px** (h-8)
- Logo↔text gap: **5–6px**
- Brand text size: **14px**, weight 500, tracking -0.02em
- Nav link text: **14px** (13px at 810–1199 breakpoint), weight 500, color `#5d5d5d` → `#1d1d1d` on hover
- Primary CTA: `#1d1d1d` pill with white inner circle, 14px / 600
- Horizontal inset of contents inside the pill: roughly **12px left / 8–9px right**

# What's inconsistent today

`src/components/layout/Navbar.tsx` (used by ForAgents, ForLandlords, BookDemo, auth pages via `PublicLayout`):

- Logo mark is `h-9` (36px) → landing is `h-8` (32px)
- Inner padding is `px-3 sm:px-3.5` (12–14px both sides) — feels tight on the logo side
- Brand text inherits default `text-[15px]` from `ExchangeLogoLockup` → landing is 14px

`src/components/layout/AgentTopNav.tsx` is a full-width sticky header (not a floating pill) used inside the authenticated agent shell. It is intentionally a different component, so it's out of scope for "pill consistency" — only the lockup sizing will be touched if needed to match the 32px / 14px lockup defaults.

# Changes

### 1. `src/components/layout/Navbar.tsx` (primary fix)

- Set `<ExchangeLogoLockup markClassName="h-8" textClassName="text-[14px] tracking-[-0.02em]" />` so the lockup matches the landing values exactly.
- Bump inner horizontal padding to `pl-4 pr-2 sm:pl-5 sm:pr-2.5` — gives the logo proper breathing room from the left edge while keeping the right-side CTA flush like the landing.
- Increase the brand `gap` from `gap-1.5` to `gap-2` on the logo `<Link>` to match the landing's logo-to-text spacing.
- Keep `h-[58px]` and `max-w-[752px]` (already correct).
- Mobile menu pill: keep current; only re-verify the closed-state height stays at ~52px to match landing's mobile.

### 2. `src/components/brand/ExchangeLogoLockup` defaults

Optional: change the default `textClassName` from `text-[15px]` to `text-[14px] tracking-[-0.02em]` so every consumer (Navbar, AgentTopNav, AdminSidebar, Footer) gets the consistent 14px brand text without per-site overrides. Existing per-call overrides remain respected.

### 3. Verification

- Visual check at desktop (≥1200), tablet (810–1199), and mobile (<810) on `/`, `/for-agents`, `/for-landlords`, `/book-demo` to confirm the pill, logo size, font size, and edge spacing match the landing nav.

# Out of scope

- `AgentTopNav` (full-width auth shell header) and `AdminSidebar` (sidebar) — these are structurally different from the public pill nav and were not described by the user as inconsistent. Only their lockup font size will inherit the new 14px default if step 2 is applied.
- No business-logic or routing changes.
