

# Add Page Preloader

## Problem
When the page first loads, there's a flash of unstyled/old template content before the app renders.

## Solution
Add an inline preloader in `index.html` that covers the screen until React mounts, then fade it out.

### Changes

**1. `index.html`** — Add a full-screen preloader div inside `<body>` before `<div id="root">`:
- White background overlay with `position: fixed; inset: 0; z-index: 9999`
- Simple CSS spinner or pulsing logo text "1031ExchangeUp"
- Inline `<style>` for the loader (no external CSS dependency)
- The loader has `id="preloader"`

**2. `src/main.tsx`** — After React mounts, fade out and remove the preloader:
- In a `setTimeout` or `requestAnimationFrame` after `createRoot().render()`, find `#preloader`, add opacity transition, then remove from DOM after transition ends

### Technical details
- Preloader is pure HTML/CSS in index.html — renders instantly before any JS
- Removed after React hydrates (~200ms fade out)
- No new dependencies

