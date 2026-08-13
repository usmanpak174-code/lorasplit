---
name: Polar.sh checkout
description: Correct Polar API endpoint and body format for creating checkouts
---

# Polar.sh Checkout Integration

## Rules
- Endpoint: `POST https://api.polar.sh/v1/checkouts/` (trailing slash required — 307 redirect without it)
- Body field: `product_price_id` (NOT `product_id` — that caused 422 errors with newer Polar API version)
- Email: Polar validates that the domain actually accepts email — `test@test.com` fails, use real domains for testing
- `products` array format also exists but `product_price_id` is simplest for single-price checkouts

**Why:** `product_id` stopped working in Polar API v2026-04 — switched to `product_price_id` which works reliably.

## Plan → Price ID Mapping (PortaSplit project)
- week (€4.90): product `197b7170-185b-4fa9-89e1-659fd5828502`, price `d41e5c07-05cc-4302-b796-fa6a6bd8d0f1`
- month (€9.90): product `a076954a-18cc-4063-99b6-b5694a52807d`, price `7697fca2-55dd-47aa-b435-d07c1e6fa1a6`
- two-months (€14.90): product `aec4bb6f-a89b-4a32-8065-cb5041c4bccd`, price `4fbdb18e-7538-4ca8-8a65-1402b4d26ecb`
