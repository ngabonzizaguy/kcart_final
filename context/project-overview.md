# Project Overview

## What this repository is

This is a **Next.js 14 + TypeScript** SaaS platform named **DeliGo** for food vendors.
It provides:

- vendor onboarding and dashboard
- customer storefront and checkout
- admin platform operations
- bilingual UX (English + Kinyarwanda)
- real-time order and metrics updates via Supabase

## Primary user roles

1. **Vendor**
   - Sets up business profile, media, location, and contact details
   - Manages menu and orders
   - Tracks business metrics in dashboard
2. **Customer**
   - Browses vendor storefront
   - Adds menu items to cart and checks out
   - Tracks order status
3. **Admin**
   - Manages vendors, orders, payouts, logs, analytics, and platform settings

## Core product flows

- **Auth + onboarding**: signup/login -> onboarding steps -> dashboard access
- **Storefront ordering**: vendor slug page -> cart -> checkout -> order tracking
- **Vendor operations**: dashboard metrics -> order status updates -> profile/settings
- **Admin operations**: protected `/admin/*` routes -> analytics/vendors/orders/payouts/logs

## Repository shape (high-level)

- `app/` - App Router pages + API route handlers
- `components/` - shared and domain-specific UI components
- `lib/` - shared services/utilities (Supabase clients, Prisma, auth helpers, validation, payments)
- `prisma/` - database schema
- `public/locales/` - i18n translation resources
- `scripts/` - utility scripts

## Current implementation profile

- Mature MVP with most end-to-end flows implemented
- Strong focus on mobile-first UX and operational admin tooling
- Remaining work is mostly UX polish and incremental feature completion (for example review UI, category UX refinements)

## Agent guidance for this repo

- Respect role boundaries across `app`, `components`, `lib`, and `prisma`.
- Preserve authentication and route protection behavior.
- Keep bilingual and mobile-first requirements in mind for UI changes.
- Update context and memory docs after every meaningful change.
