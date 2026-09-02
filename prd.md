# Product Requirements Document
## Clinical Learning Navigator — MVP v0.1

**Version:** 0.1  
**Stage:** Validation / prototype  
**Platform:** Mobile-first web application  
**Target:** Medical students on clinical placement, initially UK  

---

## 1. Vision

Clinical education is fragmented. Students attend placements, encounter patients, practise skills, receive teaching and complete assessments — but there is rarely a system that understands all of these experiences together and tells the student what to do next.

Clinical Learning Navigator is that system. It is not a portfolio. It is not a question bank. It is a navigation system for clinical development.

Instead of asking "what have I logged?" or "what should I revise?", the product asks:

> **Given everything this student has experienced so far, what is the most valuable thing they should do next?**

That is the core differentiator. Every decision about what to build should be tested against it.

---

## 2. Problem

Medical students have limited control over the clinical experiences they encounter. Two students can complete the same placement but leave with very different development. A student may:

- Repeatedly encounter the same conditions while missing important presentations
- Observe a procedure many times without ever performing it
- Understand theory but lack the clinical exposure to apply it
- Repeatedly struggle with the same skill without recognising the pattern
- Discover gaps only when an exam or assessment exposes them

**Existing tools don't solve this.** Learning platforms provide content. Simulation platforms provide artificial practice. Portfolios record evidence. Placement systems manage logistics. None connect these around the individual learner's real experience.

---

## 3. Hypothesis

> If medical students can quickly record their real clinical experiences and receive personalised recommendations about what to seek, practise or learn next, they will become more intentional about their clinical education — and use the product repeatedly throughout placements.

The MVP exists to test this hypothesis. Nothing else.

---

## 4. Target user

**Primary:** UK medical students in clinical years.

**Ideal early user:**
- Actively uses medical education resources (Geeky Medics, Quesmed, etc.)
- Wants to improve clinical skills, not just pass exams
- Feels placement exposure is inconsistent or unclear
- Already tries to track or reflect on clinical experiences (Notion, Notes app, nothing)
- Preparing for OSCEs or clinical assessments

**User personas:**

**The organised student** — already tracks in Notion or Excel. Pain: tedious and doesn't know what to prioritise. Opportunity: automate the tracking, add intelligence on top.

**The overwhelmed student** — attends placement but doesn't know what to focus on. Pain: "I don't know what I'm supposed to be getting out of this." Opportunity: clear daily priorities.

**The exam-focused student** — strong on theory, weak on clinical confidence. Pain: "I know the content but don't feel competent." Opportunity: connect real encounters with deliberate practice.

---

## 5. Core user journey (MVP)

### Onboarding
Student enters: year, medical school, current placement, relevant curriculum or upcoming assessment.  
System creates an initial placement map from that context.

### Placement setup
Student selects or creates a placement (e.g. Cardiology, 4 weeks).  
System surfaces the conditions, skills and competencies relevant to that placement.

### Daily capture
Student opens the app and answers: **"What did you see today?"**  
Text or voice. Target: under 60 seconds.

### AI processing
System extracts structured data from the narrative:
- Condition, presentation, investigation, procedure
- Clinical skill, communication skill
- Level of participation (observed / assisted / performed)
- Self-reported confidence or uncertainty
- Learning points

### Gap analysis
System updates the learner model. Compares today's experience against accumulated history to identify what's recurring, what's missing, what's improving.

### Recommendation
Student receives 1–3 prioritised actions:

> **Practise ECG interpretation**  
> You've encountered several cardiac patients but ECG interpretation has come up as a weakness twice. It's a core cardiology assessment skill.  
> *Ask to interpret the next ECG before seeing the consultant's read.*

### Follow-through
Student marks whether they sought, observed, performed, or completed the recommended action.  
This feeds back into the learner model.

---

## 6. Functional requirements

**FR1 — Accounts**  
Students create individual accounts with email and password.

**FR2 — Student profile**  
Stores: year of study, medical school, current placement, learning objectives, assessment dates, personal goals.

**FR3 — Placement creation**  
Student creates or selects a placement with name and duration.

**FR4 — Experience capture**  
Text and voice input (browser-native Speech API, typing fallback). Submission should take under 60 seconds.

**FR5 — AI structuring**  
Extracts: condition, presentation, investigation, procedure, clinical skill, communication skill, participation level (observed/performed), self-reported confidence, learning point.

**FR6 — Learner model**  
Maintains a dynamic profile of: exposure, skills, knowledge gaps, competency progress, confidence, evidence across time.

**FR7 — Gap detection**  
Identifies gaps by type:
- *Exposure gap* — not yet encountered
- *Skills gap* — observed but not performed, or performed once
- *Knowledge gap* — repeatedly struggled with
- *Confidence gap* — low reported confidence despite reasonable exposure
- *Assessment gap* — competency without evidence yet

**FR8 — Recommendations**  
1–3 prioritised actions per session. Each must include: what, why, how. Action types: Seek, Observe, Practise, Learn, Reflect, Simulate.

Priority weighting: curriculum importance × current gap size × upcoming assessment proximity × previous performance.

**FR9 — Progress dashboard**  
Shows: conditions encountered (X of Y), skills performed, competencies evidenced, strong areas, developing areas, priority gaps. Prioritises actionable information over analytics.

**FR10 — Placement summary**  
End-of-placement report: what was experienced, what developed, what remains weak, what was never encountered, recommended next steps.

---

## 7. Non-functional requirements

**Speed** — Submitting an experience: under 60 seconds end to end including AI processing.  
**Mobile-first** — Used on a phone between ward rounds. Must be fast and thumb-friendly.  
**Usability** — A new student should know what to do without reading instructions.  
**Privacy** — Students must not enter patient-identifiable information. This must be stated at capture and enforced through clear guidance (not blocked technically — the burden of avoiding patient detail is on the user, but the product must make that expectation explicit).  
**Data residency** — UK/EU hosting from day one (UK GDPR applies immediately).

---

## 8. AI requirements

AI is a supporting layer, not the product itself. The product is the learner model and the recommendations it produces.

**AI does:**
- Understand messy, natural student language
- Structure clinical encounters into consistent data
- Map concepts to curriculum areas freeform (no fixed reference in MVP)
- Detect patterns across a student's history
- Generate personalised, specific recommendations
- Summarise development over time

**AI does not:**
- Diagnose patients or recommend treatment
- Replace clinical supervision
- Assert that a student is clinically competent
- Produce content that could be mistaken for clinical decision support

---

## 9. Safety and regulatory positioning

MVP position: **educational software for medical students.**

Not a medical device under MHRA rules at this scope — no diagnosis, treatment recommendation, or clinical decision support for real patients. This must be re-evaluated if the product ever expands into clinician-facing decision support or institutional sign-off.

Privacy notice required from launch. Data processing agreement ready for any institutional pilot.

---

## 10. Success metrics

**Primary metric (the only one that matters for MVP):**  
Weekly active users who submit ≥1 clinical experience and return the following week.

This tests whether the core loop is useful enough to create a habit.

**Secondary:**
- Activation: % of signups who complete placement setup and submit first experience
- Engagement: experiences logged per active user per week
- Completion: % of recommendations marked as acted on
- Qualitative: "Did this help you make better use of your placement?" — track with a simple weekly prompt

**MVP success criterion:**  
Students voluntarily return multiple times per week without being required to. A stronger signal: they say they'd be genuinely disappointed if it disappeared.

Do not optimise for revenue at MVP stage.

---

## 11. What MVP does NOT include

Do not build until the core loop is validated:

- Full university/medical-school integration
- ePortfolio or sign-off functionality
- AI OSCE / virtual patient practice
- Question bank or content library
- Supervisor or faculty accounts
- Cohort analytics for universities
- Social or community features
- NHS or EHR integration
- Automated assessment or competency sign-off
- Native mobile app (responsive web is sufficient)
- Notifications or reminders

---

## 12. Roadmap (post-MVP)

**Phase 1 — Placement Companion (MVP)**  
Capture → extract → gap detect → recommend. Prove the core loop.

**Phase 2 — Personalised Learning Engine**  
Connect recommendations to specific resources: cases, questions, simulations, OSCE practice. Recommendation becomes a link, not just a suggestion.

**Phase 3 — Longitudinal Learner Model**  
Build a continuous profile across all years of medical school. A student's profile carries forward from placement to placement.

**Phase 4 — Institutional product**  
Universities access aggregated, anonymised data to understand clinical exposure patterns, placement quality, curriculum coverage — without individual student surveillance.

**Phase 5 — Postgraduate expansion**  
Foundation doctors → specialty trainees → CPD. The learner model grows with the clinician.

---

## 13. Long-term moat

The long-term defensibility is not the AI model. It is the **longitudinal learner model and the data it accumulates**.

Over time the system understands: what students experience → what they practise → how they perform → where they struggle → what interventions work → how clinical competence develops.

This creates a learning-intelligence layer that becomes increasingly accurate and personalised with use — and that a competitor starting from zero cannot replicate quickly.

---

## 14. Positioning

**Clinical Learning Navigator is not:**
- Another question bank
- Another AI tutor
- Another OSCE simulator
- Another portfolio

**It is:**  
A system that continuously connects a student's real clinical experiences with their educational gaps and tells them what to do next.

**Tagline options:**  
- *Don't just log your placement. Navigate it.*
- *Turn every patient encounter into your next learning opportunity.*
- *The intelligence layer for clinical education.*
