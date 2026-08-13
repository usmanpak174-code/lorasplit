---
name: Resend email setup
description: Current state of Resend email integration and limitations
---

# Resend Email Integration

**Rule:** Without a verified domain, Resend only allows sending FROM `onboarding@resend.dev`. To send to real users from a branded address, a domain must be verified at resend.com → Domains.

**Why:** Resend sandbox mode (no domain) restricts the FROM address to `onboarding@resend.dev` only. Real production sending requires adding DNS records for a custom domain.

**How to apply:**
- Current FROM_EMAIL env var: `onboarding@resend.dev` (works for testing/MVP)
- For production: user must verify their domain at resend.com → set FROM_EMAIL to `alerts@theirdomain.com`
- API key is in RESEND_API_KEY secret
- Implementation: `artifacts/api-server/src/lib/email.ts`
- Sends: verification emails (on alert creation) + restock alert emails (TODO: trigger from stock monitor)
- Resend free tier: 3,000 emails/month, 100/day
