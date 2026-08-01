# Grounding Business Health in Real Data — A Plan

**LifeCharter · 12-Dimension Scoring & AI Assessment Pipeline**
Draft for review · prepared for AmiLynne Carroll
Status: proposal, not yet built

---

## Why this document exists

Today the Business Health number and the twelve dimension scores on the Executive dashboard are not measurements. They are values we set by hand with sliders. An "85" doesn't mean anything happened in the business to earn an 85 — it means someone dragged a control to 85. That is fine as scaffolding while we built the dashboard, but it cannot ship to real business owners, and it works against the whole premise of LifeCharter: that the numbers reflect *your* reality.

The goal of this plan is to replace invented numbers with scores that come from real input the client actually gives — through AI-guided assessments and check-ins — and to do it in a way that is transparent (you can always see *why* a score is what it is), respectful (the assessments touch deeply personal territory), and durable (scores update over time as the business changes).

You asked three questions. This document answers all three: does the approach make sense (yes), is it how things are set up today (partly, and disconnected), and what it would take to get there (the roadmap below).

---

## Where things actually stand today

There are two separate systems inside the app right now, and they do not talk to each other.

**System one — the dashboard.** Everything you've been testing reads from a single table of dimension scores. There are 180 rows in it (15 business segments × 12 dimensions). Every one of those values is a manual slider setting. When the dashboard shows an overall of 79, it is averaging those sliders. Nothing behind them.

**System two — the assessments.** Separately, a substantial assessment engine already exists in the codebase: a Soul assessment (264 questions), a Brain assessment, a Profit assessment, and an 18-question Quick Pulse "check-in." Alongside them sit tables designed to store every answer, roll answers up into a client "master plan" with twelve domain scores, generate insights, and even auto-create action items for weak areas. This is most of the architecture you were picturing — it's genuinely already sketched out.

But three facts about system two matter:

1. **It has never been used.** Every assessment-related table is empty. Zero responses, zero master plans, zero insights. None of that machinery has ever produced a real number.
2. **It is not AI-driven yet.** The assessments are fixed question banks — a hardcoded list the client clicks through. The "generate insights" endpoint doesn't call an AI to analyze anything; it just stores whatever it's handed. The adaptive, AI-guided experience you described is the *intended* design, not the current behavior. (The one piece of live AI is Mariposa, the assistant, which is unrelated to scoring.)
3. **It feeds the wrong place.** Even if a client completed every assessment, the results would land in the master-plan table — a *different* table than the one the dashboard reads. So the dashboard would still show the sliders.

In one sentence: **the assessment system and the dashboard are two islands, and the bridge between them was never built.** Your instinct that the health numbers are "created out of thin air" is exactly right.

---

## What "real, AI-informed scoring" should mean

Before the how, four principles that should govern the whole thing:

**Every score traces to evidence.** A dimension score of 62 should be openable — "here's the check-in from March, here's what you said, here's the operational data that fed this." No number without a source.

**Business owners don't self-rate 1–100 — so we don't ask them to.** People can answer "How confident are you in your business decisions this week?" on a 1–5 scale with plain-language descriptions, or answer an open question in their own words. The *conversion* to a 0–100 dimension score is our job, not theirs. That's the core insight behind making this AI-driven rather than a slider.

**Prefer hard data over self-report wherever it exists.** For some dimensions we don't have to ask at all — we can compute. Finance can come from actual revenue, margin, and cash runway. Systems can come from hours worked vs. target, SOPs documented, tasks delegated. Self-report fills the dimensions where no operational signal exists (Vision, Leadership, Purpose). A blend is stronger than either alone.

**Scores decay and refresh.** A number from a six-month-old assessment is stale, and the UI should say so and invite a check-in. Health is a moving picture, not a one-time grade.

---

## The target architecture

The shape we're building toward:

**Assessments and check-ins** (AI-guided) collect real input from the client — some scaled answers, much of it open-ended prose.

An **AI scoring layer** reads those responses and produces, per dimension, a 0–100 score *plus a written rationale and the specific evidence behind it*. This is the piece that turns "what did you love before the world told you what was practical?" into a defensible Vision/Purpose contribution — only a language model can read prose like that and score it meaningfully.

Those scores roll into the **client master plan** (the per-client record that already exists), which holds the twelve domain scores, insights, strengths, and gaps.

The **dashboard reads from the master plan** — the bridge we need to build — optionally blended with operational data for the dimensions that have it, and with a manual override still available for you as the coach.

**Check-ins** are short, recurring, AI-led conversations that nudge the scores over time and feed the health-trend line.

---

## The scoring model (the heart of it)

This is the piece that does not exist today and matters most, because it's what makes a score defensible instead of arbitrary. It has two parts.

**A dimension map.** Each of the twelve dimensions — Marketing, Sales, Operations, Finance, Team, Systems, Leadership, Vision, Product, Client Experience, Legal, Sustainability — needs a defined set of sources that feed it: which assessment questions, which check-in items, and which operational metrics (where they exist) roll up into that dimension, and how heavily each counts. Building this map is a content and design exercise as much as an engineering one, and it's where your expertise as the person who designed the assessments is essential.

**A conversion method per source.** Scaled answers (1–5) convert arithmetically. Open-ended prose is scored by the AI layer against a rubric — e.g., "clarity of vision," "evidence of aligned action" — returning a number *and* a short justification. Operational metrics convert by formula (the finance and systems calculations for this already exist in the code and just need to be wired in).

A rough sketch of how sources split across dimensions, to make this concrete — subject entirely to your revision:

| Dimension | Primary source(s) |
|---|---|
| Finance | Operational data (revenue vs. goal, margin, cash runway) |
| Systems | Operational data (hours vs. target, SOPs, delegation) + Brain |
| Operations | Brain assessment + operational signals |
| Sales | Operational data (leads, conversion) + Brain |
| Marketing | Brain + Profit |
| Team | Brain + Profit |
| Product | Profit + Brain |
| Client Experience | Profit + Soul |
| Leadership | Soul + Brain |
| Vision | Soul (purpose, alignment) + business-plan completeness |
| Legal | Profit + a small targeted question set (thin today) |
| Sustainability | Soul + Profit |

The mapping above is a starting hypothesis, not a decision — reworking it with you is Phase 1 work.

---

## The AI layer

Making this truly "AI-driven" is three distinct jobs, not one:

**Adaptive questioning.** Rather than marching a client through a fixed 264-item form, an AI conducts the assessment — asking the next most useful question, following up when an answer is thin, skipping what's already known. This matters most for the Soul assessment, which is almost entirely open-ended and exhausting as a static form. (We can start with the existing question bank as the AI's "menu" and make it adaptive from there, rather than inventing questions from scratch on day one.)

**AI scoring of responses.** An AI reads the answers for a dimension and returns a score with a rationale and cited evidence. This is what replaces the slider. It's also what makes the number trustworthy: the client (and you) can read *why*.

**AI insights and check-ins.** The insight engine currently just stores; we add the step where an AI actually reads the responses and writes the insights, strengths, and gaps. And the check-in becomes a short recurring AI conversation — a few questions, scored, updating the trend — rather than another long form.

Good news on feasibility: the AI plumbing is partway there. Mariposa already runs on a live model, so this is adding capability, not starting from zero.

---

## Privacy and sensitivity — a design constraint, not an afterthought

The Soul assessment deliberately asks about painful and private territory — childhood, loss, betrayal, "what did you learn too early." Several questions are already flagged in the code as *"should never be referenced by AI-generated content."* Any AI scoring or insight layer has to honor those flags: a response can inform a private score without ever surfacing in generated copy, coaching prompts, or anything client-facing. This needs to be built in from the first line, not retrofitted, and it's worth an explicit review of which answers are allowed to travel where. Handled well, this is actually a trust feature — proof that the tool respects what people share.

---

## Roadmap

Sequenced so that value lands early and each phase stands on its own.

**Phase 1 — Make the numbers real (no AI required yet).**
Build the dimension map and scoring rubric with you. Wire the existing operational calculations (Finance, Systems) into the dashboard so at least those dimensions reflect actual data immediately. Bridge the assessment master-plan table to the dashboard so completed assessments — even the current static ones — drive the scores. Add source/date transparency to every score. *Outcome: the health numbers stop being invented and become traceable, even before anything is adaptive.*

**Phase 2 — AI scoring.**
Add the AI layer that reads assessment and check-in responses and produces per-dimension scores with rationale and evidence. This is the step that makes open-ended, human answers scorable. *Outcome: the prose-heavy assessments (especially Soul) finally count, with defensible numbers.*

**Phase 3 — Adaptive assessments and living check-ins.**
Turn the static questionnaires into AI-guided conversations, and stand up the recurring check-in loop that keeps scores current and feeds the trend line. *Outcome: the full experience you described — AI-driven assessments and check-ins per client, scores that evolve.*

**Cross-cutting — identity.**
The master-plan system is built to be one plan per client and is login-gated. Turning it on per-client ties into the auth work we already scoped, and should land alongside Phase 1 so scores attach to real people.

Two clean entry points, depending on appetite: start with **Phase 1 only** (smaller, makes the numbers honest and traceable fast), or commit to **Phase 1→2** as a block (numbers become both real and AI-scored). Phase 3 is the natural follow-on either way.

---

## Open decisions for you to react to

1. **Scope to start** — Phase 1 alone, or Phase 1→2 together?
2. **The dimension map** — do you want to draft the question-to-dimension mapping yourself (you designed the assessments), or have me propose a full first draft for you to correct?
3. **Blend vs. replace** — when a dimension has both operational data and self-report, which wins, and should you as coach always be able to override a score manually?
4. **Segments vs. whole business** — today scores live per business segment. Should assessments score the *person/business* as a whole, the segment, or both? This affects the data model.
5. **Which check-in cadence** — weekly Quick Pulse, monthly, or client-chosen?
6. **Sensitivity rules** — do you want to personally review which Soul answers are allowed to feed scores vs. insights vs. client-facing copy before we build the scoring?

---

## What I'd need from you to start Phase 1

Your call on scope (decisions 1–2 above), an OpenAI API key added to the environment when we reach the AI layer (not needed for Phase 1's operational-data wiring), and an hour of your thinking on the dimension map — that's the part only you can anchor. Everything else is build work on my side.
