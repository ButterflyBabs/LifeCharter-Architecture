# Backlog — planned, not yet built

Captured before deploy so nothing is lost. Not in scope for the current PR.

## Done since this doc was written
- **Brain AI scoring** — shipped (composite `dimension:kind` keys; recompute scores Soul + Brain).
- **Operational data entry** — shipped (`/api/operational` → Finance/Systems/Sales from real metrics).
- **Slider retirement** — shipped (assessments required; AI mirrors into segments; sticky coach override).
- **Zero-temperature scoring** — shipped (`SCORING_TEMPERATURE` env toggle, defaults to 0 → stable run-to-run).
- **Super-admin coach override** — shipped (`isSuperAdmin`; only super admins can override; control hidden otherwise).
- **Phase 2A recurring check-in loop** — shipped (`cadence.ts`, `/api/checkins`, "Your Check-in Rhythm" card on /assessments: monthly pulse, quarterly profit, semi-annual brain, annual soul).
- **AI-driven per-client Business/Marketing/Sales plans** — shipped (`client_plans` + `client_plan_goals`, versioned; `generatePlan.ts`; `/api/plans` + `/api/plans/generate`; PlanView on the three plan pages, replacing the static mockups). Grounded in the client's own scores + answers; sensitive dropped; zero-temp.
- **Baseline snapshot + progress tracking** — shipped (`client_score_snapshots`, first = immutable baseline, captured on recompute; `/api/progress` two axes: score-delta vs baseline + plan-goal execution; `/progress` page). Verified deltas render real movement.

- **Goal status + check-in flow** — shipped (`/api/plans/goals` status updates with per-goal selector in PlanView; `/api/checkins/snapshot` records a dated 'checkin' point, wired into quick-pulse completion). Execution axis now live on /progress.
- **Subscription tiers + catalog** — shipped (plans/subscriptions/capability_usage tables + functions applied; catalog set to Starter/Growth/VIP with AI caps 10/50/unlimited, businesses 1/5/unlimited, seats 1/5/unlimited, automations dropped, workspaces=1/roadmap; prices are draft placeholders). Owner granted VIP (unlimited, free, no expiry).
- **AI-action gating** — shipped (`lib/capabilities.ts`; `/api/plans/generate` and `/api/scoring/recompute` enforce the monthly ai_actions cap: 402 over-cap, usage recorded on success; AI guide unmetered; owner/unlimited always pass; fails open on errors). Verified: VIP allowed, no-subscription denied, usage tracked.

## Before selling Starter/Growth to real clients
- **Seat & business gating** — the catalog defines seats (1/5/∞) and businesses (1/5/∞) but only AI actions are enforced so far. Wire capability checks into the create-business and invite-user flows when those exist.
- **Payments (Stripe)** — plans/subscriptions tables exist and there are stripe checkout/webhook routes, but the paid-signup → active-subscription flow needs verifying/finishing before real money changes hands. (Owner is comped, so this doesn't block internal use.)
- **Auto-recompute vs. cap (UX)** — the post-assessment auto re-score now counts as an AI action; a capped client who's at their limit would complete an assessment without a score refresh. Decide whether to exempt the auto-recompute or only meter user-initiated builds. (No impact on the owner — unlimited.)
- **Tier pricing** — dollar figures ($297/$497/$997 + onboarding) are still draft placeholders pending final confirmation.
- **Not-yet-built tier features** (roadmap, keep as "coming soon" in copy): branded client portal, white-label, custom AI agents, operations/review center, true separate workspaces, automations.

## Auth cutover — DONE on Preview (2026-08-01)
- Owner Supabase auth user created + confirmed; `AUTH_ENABLED`, `ALLOWED_EMAIL`,
  `SUPER_ADMIN_EMAILS` set on **Preview only** (Production untouched). Owner
  signed in; auth gate verified (unauth → /login). The 'Primary' master plan is
  claimed by the owner's account (profile row created; user_id set), so all
  existing data — assessments, plans, goals, baseline, trend — is owned by the
  owner. resolveMasterPlanId now upserts the profile on sign-in for future
  clients. TO DO on Production when ready: set the same three env vars on the
  Production env and merge the PR.

## Remaining Phase 2 work
- **Client-respective foundation — shipped; Production cutover pending (see above).** `resolveMasterPlanId` (per-user plan with owner-claim), gather scoped per-plan, owner RLS policies applied. All backward-compatible: no change while `AUTH_ENABLED` is off. CUTOVER (with the owner, on Preview first): 1) create the Supabase auth user (email + password) in the Supabase dashboard; 2) set `AUTH_ENABLED=true`, `ALLOWED_EMAIL=<owner email>`, `SUPER_ADMIN_EMAILS=<owner email>` on the Preview env; 3) redeploy Preview; 4) sign in at /login — first sign-in auto-claims the 'Primary' plan so all existing data becomes the owner's; 5) verify, then repeat on Production.
- **Quick-pulse client-side writes** — the quick-pulse page writes to Supabase with the browser (anon) client; with RLS enabled + no anon policy those writes are denied. Move them to a service-role API route (like /api/assessments/save) so pulse check-ins persist under auth. (Pre-existing; surfaced during the RLS work.)
- **Progress deltas over time** — snapshots now accumulate; a "since last check-in" view (not just since baseline) and a trend line are a natural follow-on once there are several dated points.

## Phase 2B — adaptive AI assessments (next)
Turn the static 264-Q Soul / 325-Q Brain forms into AI-guided conversations that
adapt to the client's answers (skip irrelevant branches, ask follow-ups, keep the
same per-dimension scoring). Design decision still open — see the assistant's note
(conversational rewrite vs. adaptive branching over the existing bank vs. an AI
follow-up layer on top of the current forms).

## Multi-account / multi-provider email & calendar
Today the integration connects exactly ONE Google account (google_credentials
keyed account_key='primary') and reads Gmail + Google Calendar only. Planned:

- **Multiple Google accounts** — generalize the single 'primary' credential to
  many rows; Inbox/Schedule aggregate across them. Small change, same OAuth flow
  per account. (Straightforward.)
- **Non-Google email (e.g. GoDaddy)** — add a second connector alongside Gmail.
  Path depends on the account type:
  - *GoDaddy = Microsoft 365* (their "Business Email"): connect via Microsoft
    Graph OAuth → Outlook mail + calendar. Clean, mirrors the Google flow.
  - *GoDaddy "Professional Email"* (in-house / Open-Xchange): IMAP + SMTP for
    mail, CalDAV for calendar, authenticated with a username + app password.
- **UI decision (open):** one unified inbox across all accounts, or separate
  cards per account.
- **Security:** IMAP/password providers require storing an app password
  (encrypted at rest); the user pastes it into a secure field — never entered by
  the assistant, never stored in plaintext.
- **Open question for AmiLynne:** is the GoDaddy email Microsoft-365-backed or
  GoDaddy Professional Email? Determines the connector.

Architecture note: introduce an `email_accounts` table (account, provider type,
credentials) and a provider interface with Gmail / Microsoft / IMAP
implementations, replacing the single-tenant google_credentials.

## Scoring follow-ons
- **Brain AI scoring** — extend /api/scoring/recompute + the engine to score the
  Brain assessment's open-ended answers per dimension (currently Soul only). Needs
  the engine's brain sources to consume AI scores (key aiScores by dimension+kind
  so Soul and Brain don't collide).
- **Profit "Sustainability" domain wording** — the Profit assessment frames it as
  environmental/social; AmiLynne defined Sustainability as PERSONAL energy. Reword
  those 5 Profit questions (or lean the dimension on Soul + Pulse).
- **Legal question set** — Legal is scored from 5 self-report Profit questions
  only. Add a dedicated Legal question set if it's to be a real dimension.
- **Operational data entry** — Finance and Systems can score from real monthly
  metrics (revenue/margin/runway, hours/SOPs/delegation). Wire the monthly-review
  entry so those dimensions use hard data instead of redistributing weight.

## Auth (scoped earlier, not yet on)
- Turn on Supabase Auth + middleware gating (AUTH_ENABLED, ALLOWED_EMAIL) once
  ready; create the user, flip flags on Preview before Production.

## Auth pages shipped (2026-08-02)
- **Branded login** — two-panel /login (quote carousel + email/password), brand fonts scoped, chrome-free via AppLayout BARE_ROUTES. SSO button hidden until a Supabase OAuth provider is configured.
- **Password reset flow** — /forgot-password (resetPasswordForEmail) → /auth/callback (exchangeCodeForSession) → /reset-password (updateUser). Public routes in middleware; branded AuthShell. Supabase redirect allow-list: added `https://lifecharter-architecture-git-47bff9-amilynne-carrolls-projects.vercel.app/**` (Preview). TO DO for Production: add the prod domain `/auth/callback` (or `/**`) to the same allow-list, and set Site URL off localhost. Consider custom SMTP + branded reset-email template for real volume (default Supabase email is rate-limited / may land in spam).
