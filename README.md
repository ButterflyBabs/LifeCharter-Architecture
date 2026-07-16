# LifeCharter Architecture

A clear, evidence-based business consulting and management system that helps each client understand the whole business, identify the few priorities that matter now, take aligned action and review progress over time.

## Product Boundary

**This is a standalone product.** It has its own GitHub repository, Supabase environments, and Vercel project. It is not merged into, developed inside, or structurally dependent upon the LifeCharter Command Suite or the existing Profit Architecture application.

The application remains integration-ready through documented APIs and events, but its users, workspaces, assessments, dashboard data, plans, reviews, AI context and audit history are owned by this new application.

## Tech Stack

- **Framework:** Next.js 14+ with App Router
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS with custom design tokens
- **UI Components:** Custom components matching approved prototypes

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Local | Development | http://localhost:3000 |
| Development | Shared development | TBD |
| Staging | Release candidates | TBD |
| Production | Live application | TBD |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

## Project Structure

```
LifeCharter-Architecture/
  app/                    # Next.js App Router routes
  components/
    dashboard/            # Dashboard modules per approved prototype
    assessments/          # Assessment flows
    ai-guide/             # AI Business Guide interface
    reviews/              # Review workflows
    ui/                   # Primitives and design tokens
  lib/
    auth/                 # Authentication utilities
    supabase/             # Supabase client and queries
    assessments/          # Assessment logic
    scoring/              # Domain scoring algorithms
    recommendations/      # Priority generation
    ai/                   # AI integration
    analytics/            # Usage and business analytics
  supabase/
    migrations/           # Version-controlled migrations
    seed/                 # Seed data
    tests/                # Database tests
    functions/            # Edge functions
  public/
    brand/                # Brand assets
    icons/                # Icon library
  tests/
    unit/                 # Unit tests
    integration/          # Integration tests
    e2e/                  # End-to-end tests
    security/             # Security tests
    visual/               # Visual regression tests
  docs/
    product-reference/    # Prototypes and brand assets
    adr/                  # Architecture Decision Records
    decisions/            # Product decisions
    runbooks/             # Operational runbooks
  scripts/                # Utility scripts
  .github/
    workflows/            # CI/CD workflows
```

## Design Reference

Visual source of truth:
- `/docs/product-reference/prototypes/LifeCharter-Architecture_Light_Mode_Prototype.png`
- `/docs/product-reference/prototypes/LifeCharter-Architecture_Dark_Mode_Prototype.png`
- `/docs/product-reference/LifeCharter_Brand_Board.png`

## License

Proprietary - Sacred Kaleidoscope Community LLC
