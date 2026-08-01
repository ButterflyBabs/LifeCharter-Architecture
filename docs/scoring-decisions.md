# Scoring Model — Locked Decisions

Source of truth for the assessment-driven scoring build. Encoded in
`src/lib/scoring/dimensionModel.ts`. Updated as AmiLynne rules on open questions.

## Confirmed by AmiLynne (2026-08)
- **Weights**: accepted as drafted in `docs/dimension-map-draft.md`.
- **Sustainability** = *personal / energetic* sustainability (burnout, longevity,
  joy) — NOT environmental. Sources: Soul (Beliefs & Worldview, Story Library) +
  Profit Sustainability domain + Quick Pulse (Energy, Inner Peace, Joy).
- **Soul sensitivity**: questions flagged `sensitive: true` in the Soul assessment
  are **excluded** from all automated scoring and generation. Non-flagged Soul
  answers may be scored; Origin Story / Emotional Texture default to
  "scoreable but private" (may nudge a score, never surfaced or quoted).

## Defaults applied for deferred questions (change anytime)
- **Scope of score**: assessment-derived scores are at the **owner/business level**
  (one `client_master_plans` row). The dashboard's top-line 12-dimension health
  reads from the master plan when present, else falls back to the segment-slider
  average. Per-segment sliders remain as a manual drill-down / override.
- **Operational vs. self-report**: for Finance and Systems, operational data is the
  majority source (50% / 45%). Falls back to self-report weight when no operational
  data exists yet.
- **Legal**: stays thin (Profit domain only) for now; flagged for a dedicated
  question set later.
- **Staleness**: dates stored per source; scores soft-flagged stale past their
  window (full assessment ~90d, Quick Pulse ~14d). No hard expiry yet; weight
  decay is a later enhancement.

## Phase behavior
- **Phase 1** (no LLM): scores computed from Profit (scale), Brain scale questions,
  Quick Pulse, and operational data. Soul + open-ended Brain contribute nothing yet;
  their weight redistributes and the score is marked partial ("AI dimensions pending").
- **Phase 2** (LLM): Soul prose and open Brain answers scored by AI with rationale +
  evidence; excluded/private sensitivity tiers enforced at this layer.

## Known prerequisites (not yet done)
- Soul & Brain assessments currently persist to **localStorage only** — must be wired
  to write `unified_client_responses`.
- Profit / Quick Pulse sync is **auth-gated**; single-user app runs auth-off, so the
  compute path uses the **service-role** server client instead.
