## Plan: Static Logo Grid on Hero Page

### Goal
Replace the animated logo marquee on the homepage hero with a static, centered row of partner logos and add a "Trusted by agents from" title above them.

### What to change
File: `src/pages/Index.tsx`

1. **Remove the marquee animation**
   - Delete the `@keyframes exchangeupLogoMarquee` keyframe block.
   - Remove `animation: exchangeupLogoMarquee 52s linear infinite` from the track CSS.
   - Remove `overflow: hidden`, `mask-image`, and `-webkit-mask-image` from the viewport CSS (no longer needed since there's no scroll).

2. **Remove the duplicated logo group**
   - In `injectLogoSlider`, change the loop from `groupIndex < 2` to a single group.
   - Keep all 6 brand logos in that single group.

3. **Make the layout static and centered**
   - Set `[data-logo-slider-track]` to `justify-content: center` and `width: 100%` instead of `width: max-content`.
   - Remove `gap: 0` on the track; keep the group gap.
   - Adjust responsive breakpoints so the single group stays centered and readable.

4. **Add the title above the logos**
   - Insert an `<h2>` (or `<p>` styled as an eyebrow) inside the slider section, above the viewport div.
   - Text: "Trusted by agents from"
   - Style to match the existing eyebrow pattern on the site (small caps, muted color, centered).

5. **No other files touched.**

### Out of scope
- The "For Agents" page (`src/pages/ForAgents.tsx`) has its own logo marquee; it is **not** part of this change unless explicitly requested.
- Logo files, brand list, and sizing tokens remain unchanged.