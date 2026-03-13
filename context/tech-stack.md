# Tech Stack

## Languages

- **TypeScript** (primary for app/server logic)
- **TSX** (React components/pages)
- **JavaScript/MJS** (Next/PostCSS config files)
- **Prisma schema language** (data model)
- **JSON** (i18n dictionaries and config)
- **CSS** (global styles + Tailwind)

## Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Component primitives**: Radix UI + custom `components/ui`
- **Form handling**: React Hook Form + Zod
- **State**: Zustand (cart and client-side state patterns)
- **Charts/icons**: Recharts, Lucide React
- **i18n**: i18next / react-i18next with locale JSON files

## Backend

- **Server runtime**: Next.js Route Handlers
- **Database access**: Prisma Client
- **Database**: PostgreSQL (Supabase-hosted)
- **Authentication/session**: Supabase SSR + Supabase Auth
- **Validation**: Zod schemas in `lib/validations.ts`

## Tooling

- **Package manager**: npm (`package-lock.json` present)
- **Linting**: ESLint + `eslint-config-next`
- **Type checking**: TypeScript strict mode (`strict: true`, `noEmit: true`)
- **Build**: `next build`

## Observability and platform integrations

- Vercel Analytics
- Vercel Speed Insights

## Repository technology signals

- App Router convention and route handlers indicate a full-stack Next.js architecture.
- Prisma schema indicates relational domain model with operational indexes.
- Supabase integration indicates external managed auth/storage/realtime capabilities.
