

# Design Overhaul Part 1: Global Design System + Homepage

## Overview
Update the global CSS variables, Navbar, Footer, Homepage (Index.tsx), and How It Works page to achieve a premium, modern SaaS aesthetic inspired by Linear/Vercel — light theme, strong typography hierarchy, generous whitespace, subtle borders, professional blue accent.

## Changes

### 1. `src/index.css` — Updated CSS Variables
Refine the light theme variables for a more premium feel:
- Background: pure white (`0 0% 100%`) instead of 99%
- Foreground: darker (`222 47% 11%`) for stronger contrast
- Muted: softer gray (`210 40% 96%`)
- Muted-foreground: medium gray (`215 16% 47%`)
- Border: lighter (`220 13% 93%`) for subtlety
- Card: white with very subtle card-foreground
- Keep primary at blue-600 (`220 70% 50%`)
- Sidebar variables updated to match

### 2. `src/components/layout/Navbar.tsx` — Premium Navbar
- Taller navbar (h-16 / h-18) with more breathing room
- Logo text slightly larger, tighter tracking
- Nav links with subtle hover underline effect (not bg change)
- CTA button ("Start Your Search") with slightly rounded corners, solid primary
- Cleaner mobile menu with more padding

### 3. `src/components/layout/Footer.tsx` — Minimal Footer
- More spacious padding (py-12)
- Add a few more footer links (Privacy, Terms as placeholder text)
- Lighter, more refined typography
- Optional: add a subtle top-border gradient or just keep clean border-t

### 4. `src/pages/Index.tsx` — Complete Homepage Rebuild (~250 lines)
Sections inspired by the reference screenshots:

**Hero Section:**
- Much larger heading (text-5xl to text-7xl), bold, tight line-height
- Subtle pill/badge above heading ("Private 1031 Exchange Matching")
- Subheading in muted-foreground, max-w-2xl
- Two CTAs: primary filled + secondary outline
- Subtle gradient background wash (very light blue-to-transparent)

**Social Proof / Trust Bar:**
- Horizontal row of trust signals: "Trusted by 50+ agents" or logos-style text badges
- Light gray background band

**How It Works (3-step):**
- Large section heading, centered
- 3 cards in a grid with icon, step number, title, description
- Cards: white bg, border-gray-100, shadow-none or shadow-sm, rounded-xl
- Step numbers as small muted labels above titles

**Why Choose Us / Comparison Section** (inspired by the Lander OS screenshot):
- Two-column comparison: "1031ExchangeUp" vs "Traditional Search"
- Left column: green checkmarks with benefits
- Right column: red X marks with pain points
- Clean card layout with subtle background tints

**Dashboard Preview:**
- Refined mock dashboard card (same concept, cleaner styling)
- Slightly larger, with more internal padding
- Could add a subtle border-gradient or just clean border

**Final CTA:**
- Full-width band with centered heading + subtext + button
- Light muted background (bg-gray-50)

### 5. `src/pages/HowItWorks.tsx` — Refreshed Design
- Larger page heading (text-4xl to text-5xl)
- Steps with larger icon containers, more spacing
- FAQ section with cleaner typography, slightly more padding between items
- CTA card at bottom with refined styling matching new design system

### 6. `src/App.css` — Remove or empty out
The file contains old Vite boilerplate styles (logo spin, .card padding, etc.) that conflict with the design. Clear it out.

## Technical Details

- No database changes
- No new dependencies
- No route changes
- 6 files modified: `index.css`, `Navbar.tsx`, `Footer.tsx`, `Index.tsx`, `HowItWorks.tsx`, `App.css`
- All changes are visual/CSS — no logic changes
- The comparison section is new content but uses existing components (no new component files needed)
- Keep all existing accessibility attributes (aria labels, semantic HTML, skip-to-content link)

