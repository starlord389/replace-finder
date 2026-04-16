

# Redesign Homepage — Zova SaaS Style

## Overview
Rewrite the Navbar as a floating pill, rebuild the homepage hero with marquee stats bar and dashboard preview card, and add CSS animation keyframes. 4 files changed.

## Changes

### 1. `src/components/layout/Navbar.tsx` — Floating pill navbar
- Remove `sticky top-0 w-full border-b` full-width style
- Replace with: `fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-4xl w-[calc(100%-2rem)]`
- Pill shape: `rounded-full bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.04)]`
- Logo left, nav links center (How It Works + conditional auth links), CTA right
- CTA: `bg-gray-900 text-white rounded-full px-5 py-2 text-sm font-medium` with arrow icon
- Nav links: `text-sm font-medium text-gray-500 hover:text-gray-900`
- Mobile: keep hamburger, dropdown panel styled to match pill aesthetic
- Logged-in state: Dashboard link + Sign Out replace Log In / CTA

### 2. `src/pages/Index.tsx` — Complete rewrite
Keep all existing sections (Stats, How It Works, Features, Comparison, CTA) but rebuild the hero:

**Hero section:**
- Extra top padding (pt-32) to clear floating navbar
- Pill badge: `rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-600` with blue dot, text "The 1031 Exchange Agent Network"
- Headline: `text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05] text-center`
- Subheadline: `text-lg text-gray-500 max-w-2xl mx-auto text-center mt-6`
- Two CTA buttons centered:
  - Primary: `bg-gray-900 text-white rounded-full px-8 py-3 text-base font-medium` with arrow
  - Secondary: `bg-white border border-gray-200 text-gray-700 rounded-full px-8 py-3`
- Sub-CTA text: `text-sm text-gray-400 mt-4`
- Remove floating icon cards (not in Zova style)

**Marquee stats bar** (replaces static stats section):
- `overflow-hidden` container with `border-y border-gray-100 bg-gray-50/50`
- Inner div with `animate-marquee` class, duplicated content for seamless loop
- Stats: "50+ Active Agents · 120+ Properties Pledged · 800+ Matches Generated · 25+ Exchanges Completed" repeated
- Text in `text-sm text-gray-400 font-medium` with dot separators

**Dashboard preview card:**
- Keep the existing mock dashboard but wrap in a container with more dramatic styling
- `rounded-2xl border border-gray-200 shadow-xl` on a subtle gradient bg
- Add perspective/tilt effect via CSS or just clean flat card

**Remaining sections** (How It Works, Features, Comparison, CTA):
- Add `data-animate` attributes for fade-in-up on scroll
- Add a `useEffect` with IntersectionObserver to add `.animate-fade-in-up` class when sections enter viewport
- Keep all existing content and structure, just add the scroll animation wrapper

### 3. `src/index.css` — Add animation keyframes
Add to `@layer utilities` or after base styles:

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
[data-animate] { opacity: 0; }

@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

### 4. `src/components/layout/PublicLayout.tsx` — Adjust for floating nav
- Footer is already imported and rendered — no change needed
- Add `pt-0` to main since navbar is now floating/fixed (hero handles its own top padding)

## Technical details
- 4 files: Navbar.tsx, Index.tsx, index.css, PublicLayout.tsx (minor)
- No new dependencies
- IntersectionObserver in Index.tsx useEffect for scroll animations
- Marquee uses CSS animation with duplicated content trick
- Navbar switches from sticky full-width to fixed centered pill

