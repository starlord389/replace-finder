# Add Lyv Realty + Aluxety to the logo slider

## Goal
Add two new brand logos — **Lyv Realty** and **Aluxety** — to the marquee on both `Index.tsx` (home) and `ForAgents.tsx` (agents landing). The new logos should look like they belong: same greyscale treatment, similar optical weight, and balanced spacing with the existing four (Compass, Churchill, Keller Williams, eXp).

## Assets
Save as transparent PNGs at the existing `public/logos/` path so they sit alongside the current SVGs:

- `public/logos/lyv-realty.png`
- `public/logos/aluxety.png`

Source order of preference:
1. **User-attached images** — run through `imagegen--edit_image` with `transparent_background=true` to strip backgrounds. Lyv's mark is already solid black so it will desaturate cleanly. Aluxety's navy + gold will flatten to a uniform mid-grey via the existing `grayscale(1)` filter.
2. **Web fallback** — only if a clean cutout isn't achievable from the attachments, fetch the official wordmark from each brand's site (`lyvrealty.com`, `aluxety.com`) and repeat the background-removal step.

No CSS changes — the existing `filter: grayscale(1) contrast(0.92) brightness(1.05)` on the marquee handles the greyed-out look automatically.

## Code changes

### `src/pages/Index.tsx` — `brands` array
Append two entries sized to sit between Compass (22) and Churchill (52):

```ts
{ name: "Lyv Realty",   src: "/logos/lyv-realty.png", height: 30, mobileHeight: 22, blend: false },
{ name: "Aluxety",      src: "/logos/aluxety.png",    height: 34, mobileHeight: 26, blend: false },
```

### `src/pages/ForAgents.tsx` — `brands` array
Slightly larger to match that page's scale:

```ts
{ name: "Lyv Realty", src: "/logos/lyv-realty.png", height: 34, mobileHeight: 26 },
{ name: "Aluxety",    src: "/logos/aluxety.png",    height: 38, mobileHeight: 30 },
```

Heights are starting values — will be nudged ±4px after a visual check so neither logo dominates or shrinks beside its neighbors.

## Verification
1. Load `/` and `/for-agents` in the preview.
2. Confirm both logos appear in the marquee loop, render fully greyscale, and have visual weight comparable to Compass/eXp.
3. If Lyv or Aluxety look too tall/short or too dense, adjust the corresponding `height`/`mobileHeight` and recheck.

## Out of scope
- No changes to marquee animation, spacing CSS, or duplication logic.
- No new dependencies.
- No edits outside the two `brands` arrays + two new asset files.
