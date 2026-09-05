# Phase 0 — Prompt Development Results

**Status: Passed.** Both prompts tested against 20 real placement notes. Fixes applied are baked into the versions below. This unblocks Phase 1 (backend).

---

## Test cases

The 20 cases used are the founder's own placement notes, written in natural spoken/typed style — not clinical write-ups. They deliberately cover: single clean encounters, repeated conditions, explicit confidence signals (both low and high), procedure-observed-not-performed, differential-reasoning gaps, a "nothing wrong today" positive note, a low-participation/mostly-observing day, and a multi-day end-of-week reflection (#20) that exercises the trajectory-aware recommendation logic specifically.

---

## Issues found and fixed

1. **Model invents gaps that aren't there.** Clean or positive notes (#5, #13, #17) got a manufactured weakness from a naive prompt. Fixed with an explicit rule that empty `gaps` is a valid, expected output — a product that always finds something wrong even on a good day reads as fake, not helpful.
2. **"Observed" and "never done" need separate fields.** Watching a procedure with no comment is not the same as watching one and saying "I've never actually done one" (#14). Only the latter is a real exposure gap. Fixed by scoping `exposure_gaps` to explicitly stated never-encountered/never-performed statements.
3. **Differentials mentioned in passing must not become "conditions."** #18 mentions PE only as a forgotten differential on a chest-pain/SOB case — never confirmed. Extracting it as an encountered condition would inflate exposure data with things never actually seen. Fixed with an explicit rule.
4. **Participation ratio is a derived signal, not an LLM judgment call.** Whether a day was "mostly observing" (#17) is computed server-side from the performed/observed/assisted array lengths, not asked of the model.

---

## Final extraction prompt (v2)

```
You are the extraction engine for Clinical Learning Navigator, a placement
companion for UK medical students. Given a student's raw placement note
(typed or voice-transcribed, informal and conversational), extract
structured clinical-learning data. Students describe real encounters
casually — do not expect or require clinical write-up formatting.

Output valid JSON only, matching this schema:
{
  "conditions": [string],        // conditions/presentations actually encountered in a real patient
  "skills": [string],            // clinical/communication skills involved
  "investigations": [string],
  "procedures": [string],
  "participation": {
    "performed": [string],
    "observed": [string],
    "assisted": [string]
  },
  "confidence_signals": { "low": [string], "high": [string] },
  "gaps": [string],              // struggled with something they DID encounter
  "exposure_gaps": [string],     // explicitly stated as never encountered OR never
                                  // performed/practised, even if observed
  "learning_points": [string],   // student's own stated intent to learn/practise something
  "summary": string
}

Rules:
- Only extract what's stated or clearly implied. Do not infer conditions
  from differentials the student mentions but didn't actually see confirmed
  in a patient (e.g. "forgot about PE" on a SOB+chest pain case = a
  reasoning gap, NOT a PE encounter).
- Empty arrays are correct and expected. A clean or positive note should
  produce empty "gaps" — do not manufacture a weakness that isn't there.
- "gaps" = struggled with something encountered. "exposure_gaps" = never
  encountered/performed, stated explicitly (including "observed but never
  performed X").
- If the note reflects across multiple days ("looking back at this week"),
  extract across the whole note — conditions/gaps may repeat or aggregate.
- Use natural, student-facing language, not textbook phrasing
  ("reading ECGs", not "electrocardiographic interpretation").
- confidence_signals only when the student explicitly expresses
  uncertainty or confidence — don't infer from clinical content alone.
- If the student explicitly states intent to practise/learn something,
  it belongs in BOTH "gaps" and "learning_points" — this is a strong
  signal for prioritisation downstream.
```

`participation_level` (mostly-observed / mixed / mostly-hands-on) is a backend-computed field derived from array lengths in `participation` — not part of the LLM output.

---

## Final recommendation prompt (v2 — adds gap reconciliation)

**Update (2026-09-05):** v1 assumed gap_tally keys matched today's gap phrasing exactly. In practice, the same underlying weakness gets phrased differently note to note ("ECG interpretation" vs "reading ECGs"), which would silently undercount recurrence — the exact signal the trajectory-aware recommendation depends on. v2 adds a `gap_mappings` output so Call 2 reconciles today's raw phrasing against the existing canonical tally itself, rather than requiring exact string matches. **Not yet re-run against the 20-case set** — flagged for re-validation once Phase 1 can call the live API (see Next step below).

```
You are the recommendation engine for Clinical Learning Navigator. Given
today's extracted note (raw gap phrasing), the student's accumulated
gap_tally (canonical tag → count, last ~10 notes), exposure history,
placement context (name, week X of Y), and any upcoming assessment date,
produce 1-3 prioritised actions AND reconcile today's gaps against the
existing tally.

Output:
{
  "actions": [
    { "action_type": "Seek|Observe|Practise|Learn|Reflect|Simulate",
      "topic": string, "why": string, "how": string }
  ],
  "gap_mappings": [
    { "raw": string, "canonical": string }
    // one entry per gap in today's note. If it means the same thing as an
    // existing canonical tag in gap_tally, reuse that exact canonical tag
    // even if the wording differs (e.g. "reading ECGs" -> "ecg_interpretation"
    // if that tag already exists). Only create a new canonical tag
    // (short, snake_case, student-facing meaning preserved) if nothing in
    // gap_tally is genuinely the same underlying weakness. Do not merge
    // two gaps that are only superficially similar (e.g. "ECG interpretation"
    // and "echo interpretation" are different skills, not the same tag).
  ]
}

Priority order for actions:
1. Explicit learning_points from the student (direct signal, weight highest)
2. exposure_gaps for conditions core to the current placement — these are
   time-limited (the placement ends; a skill can be practised anytime)
3. Recurring gaps by frequency count (use gap_tally AFTER applying today's
   gap_mappings, so a just-reconciled repeat counts toward recurrence)
4. Proximity to an upcoming assessment

If action_log shows a prior recommendation was marked completed/practised,
don't repeat it — acknowledge progress instead. If not yet acted on, it's
fine to resurface with a different "how".
```

---

## Worked examples

**#13 — positive note, correctly produces no gap:**
```json
{
  "conditions": ["COPD exacerbation"],
  "skills": ["respiratory history-taking"],
  "participation": { "performed": ["history-taking"], "observed": [], "assisted": [] },
  "confidence_signals": { "low": [], "high": ["respiratory history-taking", "structuring a breathlessness history"] },
  "gaps": [],
  "exposure_gaps": [],
  "learning_points": [],
  "summary": "Took a COPD exacerbation history independently and felt notably more confident with the structure than usual."
}
```

**#14 — exposure gap despite having observed:**
```json
{
  "procedures": ["lumbar puncture"],
  "participation": { "performed": [], "observed": ["lumbar puncture"], "assisted": [] },
  "gaps": [],
  "exposure_gaps": ["performing a lumbar puncture"],
  "summary": "Observed a lumbar puncture; has never performed or practised one."
}
```

**#20 — the trajectory test (multi-day reflection):**
```json
{
  "conditions": ["heart failure", "atrial fibrillation"],
  "investigations": ["ECG", "echocardiogram"],
  "participation": { "observed": ["ECG discussion", "echo discussion"], "performed": [], "assisted": [] },
  "confidence_signals": { "low": ["ECG interpretation", "echo interpretation"], "high": [] },
  "gaps": ["ECG interpretation", "echo interpretation"],
  "exposure_gaps": ["assessing a deteriorating patient", "valve disease"],
  "learning_points": [],
  "summary": "Heavy exposure to heart failure and AF this week; still not confident reading ECGs or echoes independently; hasn't assessed a deteriorating patient or seen valve disease."
}
```

**Recommendation output for #20**, using gap history accumulated from #1–19 (ECG interpretation ×2, echo interpretation ×2, heart failure ×4 encounters, valve disease and deteriorating-patient assessment as standing exposure gaps):

```json
[
  {
    "action_type": "Seek",
    "topic": "Valve disease",
    "why": "You've had heavy exposure to heart failure and AF this week but still haven't seen a patient with valvular disease — a core cardiology presentation, and one you can only get from this placement.",
    "how": "Ask your registrar or check the echo list tomorrow for a patient with a murmur you could examine."
  },
  {
    "action_type": "Practise",
    "topic": "ECG interpretation",
    "why": "This is the second time you've flagged ECGs as a struggle — once with the registrar's teaching, now again in your weekly reflection.",
    "how": "Interpret 5 ECGs on Life in the Fast Lane before checking the answers — rate, rhythm, axis, in that order."
  },
  {
    "action_type": "Seek",
    "topic": "Deteriorating patient assessment",
    "why": "You haven't yet had the chance to assess a deteriorating patient directly — high-value and worth asking for rather than waiting to stumble into.",
    "how": "Tell your team you'd like to be involved next time an A-E assessment happens, even just to narrate your own assessment alongside them."
  }
]
```

This is the core bet working: recurrence is referenced explicitly ("second time"), time-limited exposure gaps are prioritised over anytime-practisable skill gaps, and the language stays specific rather than generic.

## Next step

Phase 1 (backend) can now implement these two prompts as-is. Re-run this same 20-case set against the live API output once the endpoints exist, to confirm the deployed behaviour matches what was validated here.
