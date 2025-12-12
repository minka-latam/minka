# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MINKA is a crowdfunding/donation platform for social causes in Bolivia, built with Next.js 15, Supabase for authentication and storage, and Prisma ORM with PostgreSQL.

## Commands

```bash
# Development
pnpm dev          # Start development server on localhost:3000
pnpm build        # Production build
pnpm lint         # Run ESLint

# Database
pnpm prisma generate     # Generate Prisma client after schema changes
pnpm prisma db push      # Push schema changes to database
pnpm prisma studio       # Open Prisma Studio GUI
pnpm prisma:seed         # Run database seeder (tsx prisma/seed.ts)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router (React 19)
- **Auth/Storage**: Supabase (auth-helpers-nextjs, ssr)
- **Database**: PostgreSQL via Prisma ORM
- **UI**: shadcn/ui (new-york style), Tailwind CSS, Radix primitives
- **State**: TanStack Query for server state
- **Forms**: react-hook-form + zod validation
- **Icons**: lucide-react

### Path Aliases
`@/*` maps to `./src/*` (configured in tsconfig.json)

### Source Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group (sign-in, sign-up)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes (admin, auth, campaign, donation, etc.)
│   └── campaign/          # Public campaign pages
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── dashboard/         # Dashboard-specific components
│   └── views/             # Page view components
├── hooks/                 # Custom React hooks (use-campaign.ts, use-db.ts, etc.)
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── supabase.ts        # Supabase client + uploadMedia helper
│   └── supabase/          # Supabase server/client utilities
├── providers/
│   └── auth-provider.tsx  # Authentication context provider
└── middleware.ts          # Route protection middleware
```

### Key Patterns

**Authentication Flow**:
- Middleware (`src/middleware.ts`) protects `/dashboard`, `/profile`, `/campaign/create`, `/create-campaign` routes
- AuthProvider wraps app with Supabase session management
- Sign-in redirects authenticated users; protected routes redirect unauthenticated users

**Database Access**:
- Use the Prisma singleton from `@/lib/prisma`
- Schema uses snake_case column names with `@map()` for camelCase TypeScript properties
- Soft deletes via `status: Status` enum (active/inactive)

**API Routes**:
- Located in `src/app/api/[domain]/` (campaign, donation, profile, admin, etc.)
- Typically use Prisma directly for database operations

**React Query Hooks**:
- Domain-specific hooks in `src/hooks/` (use-campaign.ts, use-db.ts, use-saved-campaigns.ts)
- These wrap API calls with TanStack Query for caching and state management

**UI Components**:
- shadcn/ui components in `src/components/ui/`
- Install new components: `npx shadcn@latest add [component]`

### Data Models (Prisma)

Core entities in `prisma/schema.prisma`:
- **Profile**: Users with roles (user, organizer, admin)
- **Campaign**: Fundraising campaigns with media, updates, verification
- **Donation**: Payment records with status tracking
- **CampaignMedia**: Images/videos for campaigns
- **LegalEntity**: Organizations that can run campaigns
- **Notification**: User notifications system

### Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` - Storage bucket name (default: "minka")
