## Issues

The Edit Listing page (`/agent/exchanges/:id/edit`) feels disconnected from the rest of the app:

1. The top nav's **Listings** item is not highlighted while editing a listing, because the route is under `/agent/exchanges/…/edit`, not `/agent/listings`.
2. There is **no way back** to the listing / preview from the edit page.
3. The page is titled "Edit Exchange" and on save it navigates to `/agent/workspace/:id`, which is the removed workspace area.

## Fix

### 1. `src/components/layout/AgentTopNav.tsx` — highlight Listings on edit routes

Add an `activeMatch?: RegExp` field to the `NavItem` shape. For the Listings item, set `activeMatch: /^\/agent\/(listings|exchanges\/[^/]+\/edit)/`.

In the rendered nav, read `useLocation()` and, when an item has `activeMatch`, force the active classes manually instead of relying on `NavLink`'s built-in match:

```tsx
const { pathname } = useLocation();
// inside map:
const forcedActive = item.activeMatch?.test(pathname);
<NavLink
  to={item.url}
  end={item.end}
  className={cn("rounded-md px-3 py-1.5 ...", forcedActive && "bg-primary/10 text-primary")}
  activeClassName="bg-primary/10 text-primary"
>
```

(Mobile sheet nav gets the same treatment.)

### 2. `src/pages/agent/EditExchange.tsx` — wire it back into Listings

- Rename header from "Edit Exchange" → **"Edit listing"**; subtitle stays.
- Add a top breadcrumb / back link above the header:
  `← Back to listings` → `Link to="/agent/listings"`.
- After successful save (`handleSubmit`), navigate to `/agent/listings` instead of `/agent/workspace/${id}`.
- `onCancel` from `StepReview` → navigate to `/agent/listings`.
- On "Exchange not found" toast, navigate to `/agent/listings` instead of `/agent/exchanges`.

No schema or routing changes.

## Files

- `src/components/layout/AgentTopNav.tsx`
- `src/pages/agent/EditExchange.tsx`