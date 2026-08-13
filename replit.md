# PortaSplit Stock Alerts

A SaaS platform that monitors Midea PortaSplit AC unit stock availability across 280+ retail stores in France and sends instant email alerts when stock returns — similar to climradar.fr.

## Run & Operate

- `pnpm --filter @workspace/portasplit-alerts run dev` — run the frontend (port 19703)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter (routing)
- Map: react-leaflet + Leaflet.js
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Payments: Polar.sh (checkout URL generation — add API keys to activate)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — DB schema (products, stores, stock, alerts)
- `artifacts/api-server/src/routes/` — Backend routes (products, stores, stock, alerts, plans)
- `artifacts/portasplit-alerts/src/` — React frontend
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation (do not edit)

## Architecture decisions

- Single product focus (Midea PortaSplit) with productId=1 as default — extend by adding more products to the DB
- Stock status enum: `in_stock | low_stock | out_of_stock | reserved` — "reserved" means subscriber-only stock
- Email verification flow: POST /alerts creates pending alert + token; GET /alerts/verify/:token activates it
- Polar.sh checkout URL is a placeholder — add POLAR_ACCESS_TOKEN and real product IDs to activate real payments
- No real web scraping in MVP — stock data is managed via DB (admin can update via SQL or add a scraper service)

## Product

- **Homepage**: Live map of France with color-coded store pins, alert subscription form, store list with filters
- **Email alerts**: Subscribe with email + postal code + radius + plan → get notified on restock
- **Pricing**: 3 one-time plans (1 week €4.90, 1 month €9.90, 2 months €14.90) via Polar.sh
- **Store chains monitored**: Leroy Merlin, Castorama, Brico Dépôt, Optimea, Darty, Fnac, Mr Bricolage, Boulanger, Cdiscount

## User preferences

- App name: PortaSplit Stock Alerts
- Language: English
- Market: France
- Payments: Polar.sh (not Stripe)
- Theme: Premium dark/minimal

## Gotchas

- After any OpenAPI spec change, MUST run: `pnpm --filter @workspace/api-spec run codegen`
- After codegen, run `pnpm run typecheck:libs` if there are cross-package type errors
- The `useToast` hook lives in `@/hooks/use-toast` NOT `@/components/ui/toast`
- Polar.sh checkout URL is currently a placeholder — replace with real Polar.sh API integration

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
