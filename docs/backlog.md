# Backlog — planned, not yet built

Captured before deploy so nothing is lost. Not in scope for the current PR.

## Done since this doc was written
- **Brain AI scoring** — shipped (composite `dimension:kind` keys; recompute scores Soul + Brain).
- **Operational data entry** — shipped (`/api/operational` → Finance/Systems/Sales from real metrics).
- **Slider retirement** — shipped (assessments required; AI mirrors into segments; sticky coach override).
- **Zero-temperature scoring** — shipped (`SCORING_TEMPERATURE` env toggle, defaults to 0 → stable run-to-run).
- **Super-admin coach override** — shipped (`isSuperAdmin`; only super admins can override; control hidden otherwise).
- **Phase 2A recurring check-in loop** — shipped (`cadence.ts`, `/api/checkins`, "Your Check-in Rhythm" card on /assessments: monthly pulse, quarterly profit, semi-annual brain, annual soul).

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
