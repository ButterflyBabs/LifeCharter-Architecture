# Living Plans & Progress-Based Check-ins — A Plan

**LifeCharter · Phase 2 design**
Draft for review · prepared for AmiLynne Carroll
Status: proposal, not yet built

---

## What you asked for

Over the last few messages you described, piece by piece, what the app should
become once a client has done their initial assessments:

1. **Check-ins should measure movement, not restate a grade.** Each check-in is
   scored as *improvement or setback* — compared to where the client started and
   compared to the plans we built for them (Business, Marketing, Sales) and to
   their Brain, Soul, and Profit assessments.
2. **Clients should see their gains and their weak spots against their own plan** —
   not an abstract number, but "here's where you've moved on the things we agreed
   you'd work on."
3. **The plans have to be living.** A client adds a new product (and a new revenue
   stream), or starts a community component that didn't exist at the beginning —
   the app has to absorb that and stay meaningful and practical, growing with the
   business instead of measuring it against a stale roadmap.
4. **All of this has to be per-client** — each client's content, context, and
   assessments are their own.

All four make sense, and together they turn LifeCharter from "here is your score"
into "here is your trajectory against the roadmap built for you." This document
lays out how to get there, in the order the pieces have to be built — because they
stack, and the bottom of the stack is not what most people would guess.

---

## The honest starting point

Two facts about the code today shape everything below.

**The data model is already client-respective; the running app is not.** The
`client_master_plans` table carries a `user_id` and a `workspace_id` on every row,
and every downstream table — responses, action items, insights, scores — hangs off
a `master_plan_id`. The separation columns exist. But authentication is turned off,
and the code resolves everything through a single helper that looks up one row
named `"Primary"` and ignores `user_id` completely. In practice that means the
deployed app has **one shared dataset** right now. It's perfect for you testing as
a single owner; it cannot serve two clients without them overwriting each other.
The code comment itself names this as "the seam to swap for a per-user lookup when
multi-user auth lands."

**The plans are presentation, not data.** The Business, Marketing, and Sales plan
pages render structure — sections, targets, review cycles, next steps — but that
content is hardcoded in the page components. There is no stored, structured,
versioned plan with checkable commitments. So "score the check-in against the plan"
currently has nothing concrete to compare to, and "let the client add a new revenue
stream" has nothing to edit.

The good news is that the *progress spine* is largely already there. The unified
memory system persists every assessment answer, rolls them into domain scores,
stores action items with due dates and done/not-done state, and records insights
typed as strength / gap / opportunity / risk / **milestone**. That's most of the
machinery a trajectory needs — it just isn't wired to plans, and it isn't split per
client.

---

## The build order (and why it's this order)

### Foundation — make it client-respective *first*

This is the piece that has to come before the plans work, because building
per-client living plans on top of a single shared "Primary" bucket would bake the
single-tenant assumption in deeper and cost more to unwind later.

Three moves:

- **Turn on authentication**, so every request carries a signed-in user. (This was
  already scoped earlier and left off intentionally; now it's load-bearing.)
- **Replace the `"Primary"` lookup with a per-user master plan** — resolve the
  signed-in user's own plan via the `user_id` column that's already on the table.
  This is the "seam" the code was built to swap.
- **Switch on row-level security**, so each client can only ever read and write
  their own rows. Today the app uses a service-role key that bypasses RLS — fine
  for one owner, unacceptable the moment there are two clients.

One migration detail to plan for: your own current data lives under the shared
"Primary" plan. Part of this step is associating that data to your account so you
don't lose what's already there. And because turning auth on changes how *you* log
in, we flip it on the Preview deployment and confirm it end-to-end before it ever
touches Production.

### Slice 1 — a structured, versioned plan model

Store each plan (Business, Marketing, Sales) as a set of **goals/targets tied to
dimensions**, not prose — each goal something a check-in can mark as progressing,
met, or slipped. Every plan is **versioned**: edits and additions create a new
version rather than overwriting, so history is preserved and we always know which
plan was in force at any past check-in.

This single slice unlocks all three things you asked for: check-ins get something
concrete to score against; plans become editable and evolvable; and a new product,
revenue stream, or community component enters simply as a new goal — with its own
start date, so its progress is measured from *when it was added*, not pretended to
exist from the beginning.

### Slice 2 — the baseline snapshot

At the moment a client finishes their initial assessments, **freeze that first full
result and their initial plan as an immutable baseline.** Today scores recompute
live and overwrite; "compared to where you started" needs a fixed, dated anchor.
Each subsequent check-in then writes a new dated point on top, giving a real trend
line instead of "latest vs. latest."

### Slice 3 — two-axis progress scoring

With the foundation, the plans, and the baseline in place, a check-in is scored on
two axes at once:

- **Score delta vs. baseline** — "Systems 62 → 71, +9 since you started." Automatic;
  we already compute the scores.
- **Execution vs. the *then-current* plan version** — "your marketing plan targeted
  a weekly publishing rhythm and two new offers: one shipped, cadence slipped."

Surfaced together, that's the "gains and weak spots against your own plan" view — a
client seeing exactly where they've moved on what they committed to.

### How evolution stays honest

Because plans are versioned, "progress against the plan" always means progress
against *the plan that was in force at the time* — a moving business doesn't break
the math. When a client adds something new, it starts its own mini-baseline from the
add date, so early check-ins say "since you launched the community in October…"
rather than penalizing them for months before it existed. The baseline anchors the
score-delta axis; the current plan version anchors the execution axis. Nothing goes
stale, and nothing gets scored against a target that no longer applies.

---

## What this means for the earlier assessment-format question

The choice between adaptive-branching, an AI follow-up layer, and a full
conversational rewrite of the assessments still matters — but it's now *downstream*
of this foundation, not the next thing. It shapes how the initial assessment is
captured; the living-plans-and-progress model is what happens with the results
afterward. Parked until the foundation and plan model are in.

---

## Recommended sequence

1. **Client-respective foundation** — auth on (Preview first), per-user master
   plan, RLS, migrate existing "Primary" data to your account.
2. **Structured, versioned plan model** (Slice 1).
3. **Baseline snapshot** (Slice 2).
4. **Two-axis progress scoring** in the check-in loop (Slice 3), surfaced on the
   dashboard and the check-in results.
5. *(Later)* adaptive AI assessment format; multi-account email (backlog).

Each step is shippable on its own and leaves the app working. The foundation is the
one non-negotiable prerequisite; everything after it is additive.
