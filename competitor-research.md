# Competitor Research

_Research conducted August 2026._

## Summary verdict

No single product does exactly what this one proposes. The market is fragmented across three categories: AI OSCE/virtual-patient practice (crowded), medical education platforms (established incumbents), and clinical logbooks/portfolios (often administrative, not intelligent). The opportunity is in connecting the latter two: understanding a student's real clinical experience and continuously deciding what they should practise next.

> **Existing products help students practise. Existing logbooks record what students have done. This product understands a student's real clinical experience and continuously decides what they should practise next.**

---

## Category 1 — AI OSCE / virtual patient (most crowded, do not enter here)

| Company | Notes | Threat |
|---|---|---|
| [MEKSI](https://meksi.com) | AI virtual-patient consultations, structured feedback, cohort analytics | 🔴 Tier 1 — watch closely |
| [MLAbuddy](https://www.mlabuddy.co.uk/ai-osce-practice) | Voice-based AI OSCE, UKMLA-mapped, 6,000+ UK students | 🔴 Tier 1 — UK focus |
| [Virtual Medic](https://virtualmedic.uk) | UK-based, voice consultations, university cohort analytics | 🔴 Tier 1 — institutional angle |
| [TalkOSCE](https://talkosce.co.uk) | Real-time voice AI patients, examiner grading, progress dashboards | 🔴 Tier 1 |
| [Oscer](https://www.oscer.ai/uk) | Clinical reasoning + OSCE-style consultations, immediate scoring | 🟡 Moderate |
| [OSCE AI Pro](https://osceaipro.com) | Personal coaching, weakness identification, spaced review | 🟡 Moderate — closest language to our pitch |
| OSCEsetGo, OSCEmed, OSCELab | Various AI patient + practice + analytics combinations | 🟡 Commodity tier |

**Conclusion:** "AI OSCE practice with personalised feedback" is already table stakes. Some competitors explicitly say weakness identification + recommendations. Do not position on this feature set.

---

## Category 2 — Medical education platforms / qbanks

Established incumbents: AMBOSS, Geeky Medics, Quesmed, PassMedicine. They already own parts of the student's learning workflow. Not direct competitors to the v1 wedge, but relevant once scale is reached.

---

## Category 3 — Clinical logbooks, portfolios, competency tracking (strategically important)

This is the under-researched category. Traditional approach: "log what you did" (saw patient with COPD ✓, attended ward round ✓). Useful but administrative — not intelligent.

A 2026 paper (ScienceDirect) validates demand for clinical competency logbooks in competency-based medical education. The institutional layer (ePortfolio providers, university clinical logbook systems, workplace-based assessment software, digital placement management) may already own the student's clinical data — making them potential acquirers, partners, or blockers.

**To research further:** specific ePortfolio and placement-management vendors.

---

## The competitor matrix

| Feature | Already exists? |
|---|---|
| AI virtual patient | Yes, extensively |
| AI OSCE feedback | Yes |
| Personalised next-practice recommendations | Yes (surface-level) |
| Competency tracking | Yes (administrative) |
| Clinical logbooks | Yes (administrative) |
| **Real encounters → AI extraction → longitudinal gap model → trajectory-aware next action** | **Not obviously, in this combination** |

---

## Differentiation to defend

**MEKSI / OSCE platforms:** "Practise this simulated patient."
**Traditional logbook:** "Record that you saw this patient."
**This product:** "Because you saw this patient — and based on your last ten notes — here is what you should do next."

The trajectory-aware recommendation (Approach B in the design spec) is the one piece that isn't a commodity. It requires accumulating real student history; competitors who only react to one session at a time cannot replicate it without fundamentally redesigning their data model.

---

## Risks

1. **Extraction quality is the whole product.** A hallucinated gap is worse than a blank logbook — the student trusts a wrong signal about their own competence.
2. **Monetisation path.** Self-directed students are time-poor and price-sensitive. The winning move for most competitors was going institutional. A trajectory model may be more valuable to a medical school (cohort-level patterns) than to individuals alone.
3. **Acqui-hire / integration risk.** If the logbook/ePortfolio incumbents ship an LLM-extraction layer on top of their existing placement data, they have the history we'd need years to accumulate.
