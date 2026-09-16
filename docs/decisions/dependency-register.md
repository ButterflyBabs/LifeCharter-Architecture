# Dependency Register

> This is an early scaffolding doc and isn't actively maintained day to day —
> for current build status, decisions, and what's actually shipped, the
> pre-launch punch list is the source of truth. The tables below are corrected
> as of Sept 16, 2026 so this file stops actively misleading anyone who reads it.

## External Dependencies

| Dependency | Version | Purpose | Risk Level |
|------------|---------|---------|------------|
| Next.js | 14+ | Framework | Low |
| React | 18+ | UI Library | Low |
| TypeScript | 5+ | Language | Low |
| Supabase | Latest | Database/Auth | Low |
| Tailwind CSS | 3+ | Styling | Low |
| OpenAI API | Latest | AI Business Guide | Medium |

## Internal Dependencies

| Dependency | Status | Blocked By |
|------------|--------|------------|
| Design tokens | Shipped | — |
| Auth system | Shipped (Supabase Auth, magic links, 2FA, restricted roles) | — |
| Assessment engine | Shipped (Business Command Audit + scoring) | — |
| Dashboard | Shipped | — |

## Integration Points

| System | Integration Type | Status |
|--------|-----------------|--------|
| Global Control (CRM) | API | Live — tagging, custom fields, contact lookup |
| Stripe | API | Live — Payment Links + Checkout, webhooks |
| Zoom | API (Server-to-Server OAuth) | Live — MasterClass registrant sync |
| Resend / system transactional email | API (future) | Still planned — see punch list |
