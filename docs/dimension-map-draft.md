# The Dimension Map — First Draft

**How each assessment answer becomes a 12-dimension health score**
Draft for your red-lining · prepared for AmiLynne Carroll
Companion to *Grounding Business Health in Real Data — A Plan*

---

## How to read this

This is the missing piece that turns your assessments into defensible scores instead of sliders. For each of the twelve dimensions it names where the score comes from, how heavily each source counts, and how a raw answer converts to a number from 0 to 100.

It's a **starting hypothesis, not a decision.** Mark it up freely — change weights, move a source, tell me a mapping is wrong. You designed these assessments; you'll see things I can't. At the end there's a short list of specific questions where your call decides the design.

One genuinely good discovery up front: your **Profit assessment is already built as a 12-dimension scorer.** It has exactly five questions per dimension, and its twelve domains line up one-to-one with the dashboard's twelve. That makes it the natural spine of the whole model, and it means we're connecting existing pieces rather than inventing from scratch.

---

## The four sources, and what each is good for

**Profit assessment — the spine.** 60 questions, five per dimension, mostly 1–5 scale plus a few multiple-choice with built-in scores. Its domains *are* the twelve dimensions. This is the backbone score for every dimension.

**Brain assessment — operational depth.** 535 questions across twelve business *systems* (Business Identity, Model, Vision/Strategy, Ideal Clients, Offers, Messaging/Brand, Sales System, Marketing System, Customer Journey, Operations, Team, Tech Stack). Richer and more concrete than Profit on the operational dimensions — the "how does the business actually run" evidence.

**Soul assessment — the human dimensions.** 263 narrative, open-ended questions about identity, purpose, values, voice, and story. These can't be averaged like a 1–5 scale — they need AI scoring against a rubric. Soul is where Vision, Leadership, and Sustainability get their depth. It's also the most sensitive material and carries special handling (see below).

**Quick Pulse check-in — the recurring signal.** 18 questions (6 Brain, 6 Soul, 6 Profit), each already tagged to a theme. This is what keeps scores current between full assessments and drives the health-trend line. It re-scores a subset of dimensions quickly and often.

**Operational data — hard signal (no questions at all).** For a few dimensions we can compute from what the business actually did — revenue, margin, cash runway, hours worked, SOPs, delegation. Already coded; just needs wiring. Where this exists it should outweigh self-report.

---

## The map, dimension by dimension

Weights are a starting proposal. "AI-scored" means an LLM reads prose answers and returns a number plus rationale; "scale" means arithmetic from 1–5 answers; "formula" means computed from operational data.

### 1. Marketing
- **Profit** — Marketing domain, 5 Qs (scale) · **40%**
- **Brain** — Marketing System (81 Qs) + Messaging/Brand (53 Qs), AI-scored/scaled · **35%**
- **Quick Pulse** — "Marketing Effectiveness" · **25%**
- Operational data: none today (could add lead-source data later)

### 2. Sales
- **Profit** — Sales domain, 5 Qs (scale) · **35%**
- **Brain** — Sales System (50 Qs) · **25%**
- **Operational data** — leads, conversion rate (from monthly review) · **20%**
- **Quick Pulse** — "Sales Confidence" + "Pricing Power" · **20%**

### 3. Operations
- **Profit** — Operations domain, 5 Qs (scale) · **40%**
- **Brain** — Operations & Internal Systems (45 Qs) · **35%**
- **Quick Pulse** — "Operational Stress" (inverted) · **25%**

### 4. Finance
- **Operational data** — revenue vs. goal, margin, cash runway *(existing formula)* · **50%**
- **Profit** — Finance domain, 5 Qs (scale) · **30%**
- **Quick Pulse** — "Financial Visibility" + "Revenue Stability" · **20%**
- *Note: strongest dimension for hard data — self-report should be the minority here.*

### 5. Team
- **Profit** — Team domain, 5 Qs (scale) · **45%**
- **Brain** — Team and Roles (35 Qs) · **35%**
- **Quick Pulse** — "Team Capacity" · **20%**

### 6. Systems
- **Operational data** — hours vs. target, SOPs documented, tasks delegated *(existing formula)* · **45%**
- **Brain** — Tech Stack & Access Map (30 Qs) + Operations systems · **30%**
- **Quick Pulse** — "Systems Clarity" · **25%**

### 7. Leadership
- **Soul** — Values & Standards (30 Qs) + Emotional Texture & Presence (27 Qs), AI-scored · **50%**
- **Brain** — Vision, Strategy & Priorities (47 Qs) · **25%**
- **Quick Pulse** — "Decision Making" + "Shadow Work" · **25%**

### 8. Vision
- **Soul** — Calling, Purpose & Sacred Why (23 Qs) + Core Identity (20 Qs), AI-scored · **50%**
- **Profit** — Vision domain, 5 Qs (scale) · **20%**
- **Quick Pulse** — "Mission Connection" + "Growth Trajectory" · **20%**
- Business-plan completeness (documented vision) · **10%**

### 9. Product
- **Profit** — Product domain, 5 Qs (scale) · **50%**
- **Brain** — Offers, Products & Services (50 Qs) · **50%**
- *Note: no Quick Pulse item today — a candidate for a new check-in question.*

### 10. Client Experience
- **Profit** — Client domain, 5 Qs (scale) · **40%**
- **Brain** — Customer Journey & Client Experience (40 Qs) · **30%**
- **Soul** — Client Transformation (39 Qs) + Voice & Communication (30 Qs), AI-scored · **15%**
- **Quick Pulse** — "Client Quality" · **15%**

### 11. Legal
- **Profit** — Legal domain, 5 Qs (scale) · **100%**
- *Note: this is the thinnest dimension. Only Profit touches it, and lightly. Flagged as needing a dedicated question set — see red-line questions.*

### 12. Sustainability
- **Soul** — Beliefs & Worldview (35 Qs) + Story Library (25 Qs), AI-scored · **40%**
- **Profit** — Sustainability domain, 5 Qs (scale) · **35%**
- **Quick Pulse** — "Energy Levels" + "Inner Peace" + "Joy & Fulfillment" · **25%**
- *Note: "sustainability" here reads as personal/energetic sustainability (burnout, longevity), not environmental. Confirm that's your intent — it changes the sources.*

---

## How raw answers convert to 0–100

**Scale questions (1–5).** Linear: 1→0, 3→50, 5→100, averaged across the dimension's questions. Simple and transparent.

**Multiple-choice questions.** Several already carry explicit scores per option (e.g. a referral-based marketing channel scores higher than paid ads). We use those as-authored.

**Prose questions (Soul, and open Brain items).** An AI reads the answer and scores it against a short rubric per dimension — e.g. for Vision: clarity of purpose, specificity, evidence of aligned action. It returns a number *and* a one-line rationale *and* the quote it keyed on, so the score is never a black box.

**Operational formulas.** Finance and Systems already have real formulas in the code (revenue achievement, margin, runway; delegation ratio, documentation, hours efficiency). These plug straight in.

**Blending.** Each dimension's final score is the weighted average of whichever sources have data. If a source is missing (assessment not taken yet), its weight redistributes to the sources that do exist, and the UI notes the score is partial.

---

## Staleness and refresh

Each source carries a date. A default proposal: full assessment scores are "fresh" for ~90 days, Quick Pulse for ~14 days, operational data for one review cycle. Past that, the dimension is flagged stale and the client is nudged to a check-in. Weights can also *decay* — an old full assessment gradually yields influence to recent check-ins — so the number tracks reality instead of anchoring to a first impression. (Whether to decay or hard-expire is a red-line question.)

---

## Soul sensitivity — special handling

The Soul assessment asks about childhood, loss, betrayal, and private history. Some questions are already flagged in the code as *"should never be referenced by AI-generated content."* The map treats Soul answers in three tiers:

- **Scoreable and quotable** — may inform a score *and* be cited as evidence in the UI.
- **Scoreable, private** — may nudge a score, but the underlying answer is never surfaced, quoted, or fed to any client-facing generation.
- **Excluded** — flagged answers that inform nothing automated at all; they belong to the human coaching relationship only.

Which questions fall in which tier is yours to set. My proposal is to default the flagged-sensitive questions to "excluded," and everything in Origin Story / Emotional Texture to "scoreable, private" unless you say otherwise. This is the one area I'd rather over-protect than under-protect.

---

## Where the map is thin (honest flags)

**Legal** is barely covered — five self-report questions and nothing else. If Legal is going to be a real dimension, it likely needs its own short question set (entity/contracts/IP/compliance basics).

**Product** has good coverage but no recurring pulse item, so it won't move between full assessments. A single new check-in question would fix that.

**Sustainability** hinges on what you mean by the word (personal energy vs. environmental vs. business durability). The sources change completely depending on your intent.

---

## Red-line questions — where your call decides the design

1. **Weights** — the percentages above are my starting guess. Any that feel wrong to you?
2. **Soul tiers** — comfortable with "flagged questions excluded, Origin Story / Emotional Texture private-but-scoreable"? Or do you want to walk the sensitive sections yourself first?
3. **Operational vs. self-report** — for Finance and Systems I've made hard data the majority. Agree, or should self-report carry more?
4. **Sustainability definition** — personal/energetic, business durability, or environmental? This one genuinely changes the map.
5. **Legal** — leave it thin for now, or add a dedicated Legal question set as part of this build?
6. **Staleness** — decay weights gradually, or hard-expire and force a fresh check-in?
7. **Scope of the score** — score per business segment (as today), per whole person/business, or both? Affects how assessments attach to data.

Answer as many or as few as you like — even "weights look fine, Sustainability = personal energy, exclude flagged Soul questions" is enough for me to lock the model and start building Phase 1.
