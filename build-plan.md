# Build Plan
## Clinical Learning Navigator — MVP

This document describes how to build the MVP in the right order, what each phase delivers, and how to stay unblocked. The goal is to have something real to use during an actual placement week as quickly as possible.

---

## Principles

**Build the loop before the interface.** The core value is extraction + trajectory-aware recommendation. That needs to work and produce good output before the UI is polished. If the AI output isn't useful, a beautiful dashboard doesn't save it.

**Use it yourself first.** The first real user is you. Every placement week before external launch is a free validation cycle. If you don't reach for it, ask why — that's the product problem to fix.

**Defer everything that doesn't test the hypothesis.** The hypothesis is: students return repeatedly because the recommendations are useful. Anything that doesn't test that gets cut.

---

## Phase 0 — Prompt development (before any code)
**Duration:** 3–5 days  
**Who does the work:** Founder (you), not a developer

This phase happens before a line of code is written. It's the most important phase and the one most likely to be skipped. Don't skip it.

**What to do:**
1. Write out 15–20 real placement experiences in natural language. Use your own notes, memory, or reconstruct from recent weeks. These are your test cases.
2. Open Claude (or the API Playground) and iterate on the extraction prompt until it reliably produces clean structured JSON from those 15 inputs — conditions, skills, gaps, participation level, confidence signals.
3. Do the same for the recommendation prompt. Feed it extracted gaps + a fake gap history. Does it produce 1–3 recommendations that feel genuinely useful — specific, actionable, and clinically realistic?
4. Write down which inputs caused failures or weird output. These edge cases will inform error handling later.

**Output:** Two working prompts (extraction + recommendation) that you trust. A set of 15–20 test cases with expected outputs.

**Why this comes first:** The prompts are the product. If they produce bad output, no amount of engineering fixes it. Getting them right in a playground costs nothing and takes days, not weeks.

---

## Phase 1 — Core loop backend
**Duration:** 1–2 weeks  
**Deliverable:** A working API you can call from the command line or Postman

Build in this order:
1. Database schema: Student, Placement, Note, LearnerModel tables
2. Auth: signup, login, session — individual student accounts
3. `POST /notes` endpoint: accepts raw_text → runs extraction call → runs recommendation call → saves Note → updates LearnerModel gap_tally → returns structured result
4. `GET /learner-model` endpoint: returns current gap_tally, exposure summary
5. `GET /notes` endpoint: returns history list with extracted tags

Test each endpoint manually. Run unit tests for gap-tally aggregation and JSON parsing before moving on.

**Done when:** You can POST a raw placement note and get back a structured result with recommendations — entirely via API, no UI yet.

---

## Phase 2 — Minimum UI (capture + result)
**Duration:** 1–2 weeks  
**Deliverable:** A page you can actually use on your phone during a placement day

Build in this order:
1. Capture screen: text area + submit button. No voice yet, no styling.
2. Result panel: shows extracted tags and recommendations after submit. Doesn't need to be beautiful — it needs to be readable.
3. Auth screens: signup and login. Functional, not designed.
4. Wire to the Phase 1 API.

Add voice input (Web Speech API mic button) here — it's 20 lines of JS on top of the text area that already exists.

**Done when:** You can open the app on your phone, speak or type a placement note, and read back useful extracted data and 1–3 recommendations within 60 seconds.

**Then:** Use it for a real placement week before building anything else. This is the first real validation point.

---

## Phase 3 — Placement setup + dashboard
**Duration:** 1–2 weeks  
**Deliverable:** A complete MVP with onboarding, daily capture, and a progress view

Build in this order:
1. Onboarding flow: year, medical school, placement — one field per step
2. Placement setup: name + duration → AI generates PlacementMap → student reviews and edits
3. Dashboard: placement progress (conditions X/Y, skills X/Y), strong/developing/gap areas, history list, recurring-gaps panel
4. Follow-through: "Did you act on this?" prompt for previous day's recommendations
5. Placement summary: end-of-placement report generated from LearnerModel

**Done when:** A new student can sign up, set up their placement, use it for a week, and see a meaningful dashboard reflecting their real experience.

---

## Phase 4 — Pilot with a small group
**Duration:** 2–4 weeks of observation  
**Deliverable:** Evidence for whether the core loop is working

Recruit 5–10 students from your own year or network. Give them the link. Watch what happens:
- Do they come back after day one?
- Do the recommendations feel useful or generic?
- What input formats cause bad extraction?
- Where does the product feel slow or confusing?

Fix the things that block return visits. Do not add features yet.

**Done when:** At least 3–5 students are using it multiple times per week voluntarily.

---

## Timeline estimate

| Phase | Duration | Milestone |
|---|---|---|
| 0 — Prompt development | ~1 week | Working prompts, 15 test cases |
| 1 — Backend | ~1–2 weeks | API working end-to-end |
| 2 — Minimum UI | ~1–2 weeks | Usable on a phone during placement |
| 3 — Full MVP | ~1–2 weeks | Complete onboarding, dashboard, summary |
| 4 — Pilot | ~4 weeks | Return-visit validation |

**Realistic total: 8–12 weeks from start to early pilot signal.**

This assumes a developer working on it part-time alongside medical school. Full-time cuts it roughly in half.

---

## What to do if the recommendations aren't useful

This is the most likely failure mode. Signs:
- Recommendations are generic ("review heart failure")
- Recommendations repeat regardless of history
- Extraction misses what the student actually said was hard

Fix by going back to Phase 0 — not by adding more features. The problem is almost always in the prompts, not the product structure. Spend a day iterating on the prompts with your real failing examples before touching any code.

---

## What not to build during pilot

If a pilot user asks for any of these, note it down and do not build it:
- Supervisor sign-off or approval flows
- Sharing or export features
- Reminders or push notifications
- A question bank or study content
- Social features
- Analytics exports

The question is not "would this be useful?" — it obviously would. The question is "does the core loop work without it?" If yes, defer it. The pilot exists to answer that single question.
