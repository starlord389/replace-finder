## Goal

Replace the current `ExchangeLogoIcon` in `src/components/layout/Navbar.tsx` with a new mark inspired by the reference: a set of upward arrows with a small house roof sitting on top of one of them. Keep the wordmark "1031 Exchange Up" next to it (the new mark has no built-in text, so per your instructions the text stays).

## Branding colors (reused from the site, not the reference image)

- Charcoal `#1d1d1d` — primary brand color (already used for wordmark, nav pill text, buttons)
- Gold `#FADC6A` — existing accent dot in the current logo
- That's it — no blues, no navy gradient from the reference

## New mark design

Three upward-pointing arrows arranged side by side, ascending in height left → right (short, medium, tall) — echoes "exchange up" and matches the reference's stepped feel without copying it.

- All three arrow shafts: charcoal `#1d1d1d`
- Tallest (right) arrow's arrowhead: gold `#FADC6A` — single accent, mirrors the gold circle in the current logo so the brand DNA carries over
- A small house roof (simple triangle/chevron) sits on top of the tallest arrow's head, in charcoal — this is the "home/property" cue from the reference
- Pure SVG, no raster, no gradients

```text
        /\        <- house roof (charcoal)
        ▲         <- gold arrowhead
   ▲    █
▲  █    █
█  █    █         <- three charcoal shafts
█  █    █
```

## Fit into the navbar — zero layout shift

Current slot: `<ExchangeLogoIcon className="h-8 w-8 shrink-0" />` inside a pill with `h-[58px]`. The new SVG will:

- Use the exact same `h-8 w-8` (32×32) outer box
- Use a square `viewBox` (e.g. `0 0 64 64`) with internal padding so the arrows + roof visually center in the same footprint as today's icon
- Stay `shrink-0` and keep the same gap to the wordmark (`gap-1.5`)

Result: pill height, pill width, wordmark position, and right-side actions all stay pixel-identical. No CSS outside the icon component changes.

## Files touched

- `src/components/layout/Navbar.tsx` — replace the `ExchangeLogoIcon` SVG body only. No changes to the surrounding `<Link>`, wordmark span, classes, or any other navbar code.

## Out of scope

- No favicon / `index.html` `<link rel="icon">` update (can be a follow-up if you want)
- No changes to other pages, footers, or marketing assets
- No new dependencies, no new files

## Open question

Want me to also refresh the **favicon** (`public/favicon.ico` / og image references in `index.html`) to match the new mark in the same pass, or keep this strictly to the navbar?
