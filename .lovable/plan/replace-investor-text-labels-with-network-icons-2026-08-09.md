# Replace Investor Text Labels with Network Icons

## Goal
Update the radial network diagram on the homepage so it no longer uses "Investor A–F" text labels. Instead, it should show a larger, growing network of minimalistic icons representing investors, agents, and properties.

## What to change
- Remove the six text labels ("Investor A" through "Investor F") from the `NbMonitorSteps` radial diagram in `src/pages/Home.tsx`.
- Render a larger number of orbiting nodes (8–12) to visually communicate a growing, multi-party network.
- Use three icon categories, each with a minimalistic line icon:
  - **Investors**: person / user icon
  - **Agents**: briefcase or professional badge icon
  - **Properties**: building or house icon
- Mix the categories evenly across the orbit so the hub feels populated by all three participant types.
- Keep the central hub and the inward/outward arrow concept intact.
- Maintain the existing navy background and green/white color scheme.

## Design constraints
- Icons must remain legible at the small orbit-node size.
- No text labels on the orbit nodes by default (tooltips or hover labels can be considered for accessibility).
- Keep the diagram within the current viewport fit - no vertical expansion.

## Implementation notes
- Icons can be sourced from `lucide-react` (already in the project), e.g., `User`, `Briefcase`, `Building2`.
- The node positions are computed from angles/orbit radius; update the angles array to match the new node count.
- The node legend and "Investors list properties / Opportunities flow back" label should be updated to reflect the mixed network.
- Update surrounding copy if needed so it refers to the broader network rather than only investors.

## Verification
- Screenshot the updated homepage hero/network section at desktop and mobile.
- Confirm all icons render clearly and the diagram still fits without scrolling.
