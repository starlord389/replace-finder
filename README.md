# 1031 Exchange Up

A private, off-market marketplace where real-estate agents find 1031-exchange
replacement properties for their clients — before those properties are ever
publicly listed.

## How it works

1. **Agents add clients** who are in (or considering) a 1031 exchange.
2. **Agents pledge the client's current property** and set replacement
   criteria, creating an exchange listing.
3. **The match engine scores every property in the network** against each
   exchange across eight factors (price, geography, asset type, strategy,
   financial fit, timing, debt fit, scale).
4. **Agents review matches and open private connections** with the
   counterparty agent to move a deal forward.

## Tech stack

- **Frontend:** React 18 + TypeScript + Vite, shadcn/ui, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Edge Functions) — schema in
  `supabase/migrations/`, functions in `supabase/functions/`
- **Sync:** This repo is two-way synced with [Lovable](https://lovable.dev).
  Pushes to `main` appear in Lovable; Lovable edits commit back here.
  Publishing/deployment happens from Lovable.

## Development

```sh
npm install
npm run dev        # dev server on http://localhost:8080
npm run test       # vitest unit tests
npm run lint       # eslint
npm run build      # production build
```

## Project layout

- `src/pages/` — route-level pages (public, auth, agent, admin)
- `src/features/` — domain logic by feature (exchanges, matches, clients, …)
- `src/components/` — shared UI components
- `src/app/routes/` — route manifest and guards
- `docs/production-readiness-checklist.md` — launch checklist
