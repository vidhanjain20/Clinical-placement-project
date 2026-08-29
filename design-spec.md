# Clinical Learning Loop — v1 Design

**Status:** separate concept from Continuity (which stays parked, untouched, elsewhere in this repo).

**What this is:** a tool that turns a medical student's free-text placement notes into structured learning gaps and one trajectory-aware next action, so the student's real clinical experience — not a question bank in isolation — drives what they study next.

**Who it's for (v1):** individual, self-directed medical students who sign up themselves. No medical school, no institution, no supervisor accounts.

**What it explicitly is NOT (yet):** OSCE/virtual-patient practice, curriculum-mapped (e.g. UKMLA) content, an institutional logbook with sign-off, a spaced-repetition scheduler, or anything integrated with a qbank. Keep it a proof of the loop, not a full platform.

---

## Why this scope (competitive context)

Prior research (see conversation) found the market crowded on two fronts: AI OSCE/virtual-patient practice (MEKSI, MLAbuddy, TalkOSCE, Virtual Medic, etc.) and administrative clinical logbooks. The identified white space is connecting them: understanding a student's *real* clinical experience and continuously deciding what to practise next — a longitudinal competency model, not a diary.

The risk flagged in that research: a single-note "AI diary" (Version A) is easy to copy and not differentiated. The differentiator is that recommendations are informed by a student's accumulating history of gaps, not just today's entry (Version B). This design commits to that distinction as the smallest provable unit — deferring everything else (OSCE practice, curriculum mapping, institution accounts) until the core loop is validated.

---

## 1. Core data model

Two objects, nothing else for v1:

**Student**
- id, email, password_hash, name, created_at

**Note**
- id, student_id, date, raw_text
- topics (json array), skills (json array), gaps (json array) — extraction output
- next_action (text) — recommendation output
- extraction_status (ok / failed) — so a failed LLM call never loses the raw note
- created_at

No institution/supervisor tables, no separate extraction or gap-rollup tables. Gap frequency tallies are computed on read from recent Notes, not stored.

## 2. The core loop (the actual product)

This is the only "smart" part, and it's two LLM calls, not one:

```
1. Student submits raw_text.
2. Call Claude ("extraction prompt"):
   raw_text → { topics: [...], skills: [...], gaps: [...] }
3. Pull the student's last ~10 Notes, collect their gaps.
4. Call Claude ("recommendation prompt"):
   today's gaps + recent gap history → next_action (one string)
5. Save Note with raw_text + topics + skills + gaps + next_action.
```

Step 4 is what makes this a competency model rather than a diary: the recommendation should reference recurrence ("you've now flagged X three times") when the data supports it, not just react to today's note in isolation.

Both calls are freeform extraction — no fixed curriculum reference (e.g. UKMLA content map) in v1. Faster to build, at the cost of not framing gaps against a recognised exam standard yet.

## 3. Screens (v1 = one screen)

A single dashboard, same discipline as Continuity's one-screen v1:
- Text box + submit: "what happened on placement today?" — with an optional mic button using the browser's native Web Speech API (`SpeechRecognition`) to dictate into the same box. Client-side only, no backend change, no cost. Typing stays the always-available fallback (Safari/Firefox support for the API is patchy).
- Result panel (after submit): extracted topics/skills/gaps + this note's next action
- History list: past notes, each showing its extracted tags
- Recurring-gaps panel: simple frequency tally of gap tags across recent notes

No note-detail page, no calendar, no OSCE/virtual-patient practice, no curriculum mapping, no supervisor/institution view, no reminders or notifications. Resist adding these until real usage demands them.

## 4. Error handling

- LLM call fails or times out → the Note is still saved with raw_text and `extraction_status: failed`; UI shows "couldn't process this, retry" with a retry action. The student's raw text is never lost.
- Malformed JSON from the extraction call → retry once with a stricter prompt; if it still fails, same failed-state handling as above.
- Empty or too-short note → blocked client-side before submit is enabled.

## 5. Tech stack

Reuse Continuity's proven stack:
- **Frontend:** React + Vite, single dashboard, no design system needed yet.
- **Backend:** Node/Express.
- **Database:** SQLite (matches Continuity's single-pilot-scale choice).
- **LLM:** Anthropic API (Claude) for the two calls in the core loop.
- **Auth:** real per-student signup (email + password + session) — unlike Continuity's single login per clinic, because v1 users are individuals, not one provisioned account per organisation.
- **Hosting:** Render, Railway, or Fly.io — same reasoning as Continuity, cheap tier fine at pilot scale.

## 6. Testing

- Unit tests for the gap-tally aggregation and the JSON-parsing/fallback logic — deterministic, no LLM involved, same pattern as Continuity's `flagging.test.js`.
- LLM output quality is not meaningfully unit-testable. Validate manually against a handful of real example notes (your own placement experience is the obvious first source) before wider use.

## 7. What "done" looks like for the pilot

- You (and/or a handful of other students) use it across real placement weeks.
- You can show: N notes logged, gaps extracted, and at least one case where a recurring-gap recommendation caught something a single-note diary would have missed.
- That's the evidence for whether the "trajectory-aware" bet is worth building further (OSCE practice, curriculum mapping, institution pilots) — not proof by itself, but a cheap test of the core mechanic.

## 8. Compliance notes (light for v1, don't ignore)

- Notes may reference real patient encounters. Even without names, treat placement notes as sensitive — do not require or store patient-identifying detail, and say so explicitly in a basic privacy notice.
- UK GDPR applies once you store a student's email + name. Use a hosting provider with UK/EU data residency.
- This is a self-reflection/study tool, not a clinical record or a medical device — it does not diagnose, treat, or make clinical decisions about patients. Re-check this framing if scope ever expands toward clinical scoring.

## 9. Explicitly out of scope for v1

- OSCE / virtual-patient practice
- Curriculum mapping (e.g. UKMLA content map)
- Institution or supervisor accounts, cohort views
- Spaced-repetition scheduling
- Qbank integration
- Mobile app
- Notifications/reminders
