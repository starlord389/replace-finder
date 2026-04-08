

# Redesign Hero Section — Alytics-Style Layout

## What changes

**`src/pages/Index.tsx`** — Replace the hero section (lines 15-49) with a new design that matches the Alytics screenshot layout:

### New Hero Structure
1. **Trust badge** — Centered pill with avatar stack + "Trusted by 50+ agents" (like Alytics' "Trusted by 1M+ users")
2. **Large centered headline** — "Every Property Pledged Is a Match for Someone Else" in massive bold text (~text-5xl/6xl), black, tight tracking
3. **Subtitle** — Lighter gray subtext below: "Join a network of agents where your client's property becomes inventory for everyone else's client — and theirs becomes inventory for yours."
4. **Single primary CTA button** — "Join the Network" (blue filled, rounded-full, like Alytics' "Get Started For Free")
5. **Sub-CTA text** — "Free to join · No upfront costs · Fee only on completed exchanges"
6. **Floating icon cards** — 4 decorative cards positioned around the hero (top-left, top-right, mid-left, mid-right) containing Lucide icons (Building2, Target, Zap, Handshake) styled as tilted white cards with shadow — mimicking the floating app icons in the Alytics screenshot
7. **Dashboard preview card** — Below the CTA, a large rounded card with shadow showing a mock agent dashboard UI (built with HTML/Tailwind, not an image). The mock shows:
   - Sidebar with nav items (Dashboard, Clients, Matches, Exchanges)
   - Top stat cards: "Active Matches: 12", "Pending Connections: 3", "Exchange Progress: 78%"
   - A mini client list and a growth/match chart placeholder
   - Styled to look like a real app screenshot, similar to the Alytics dashboard preview

### Background
- Clean white to very subtle gray gradient (`bg-gradient-to-b from-white to-gray-50`)
- The floating cards use `absolute` positioning with slight rotations (`rotate-[-6deg]`, `rotate-[8deg]`)

### What stays the same
- All sections below the hero (Stats, How It Works, Features, Comparison, CTA) remain untouched
- Navbar and Footer unchanged
- Same imports, same `useHead` call

## Technical details
- Single file change: `src/pages/Index.tsx`
- No new dependencies, no images to upload
- Dashboard mock is pure Tailwind markup (not a screenshot)
- Floating cards use absolute positioning within a relative container
- Responsive: floating icons hide on mobile (`hidden lg:block`), dashboard card scales down

