# Founder Input Guide
## Where your expertise shapes the product — and how to make it feel real

This document covers the parts of the product that require medical knowledge, lived experience as a student, and clinical judgment — not engineering. These are the areas where your input is irreplaceable and where getting it wrong makes the product feel like it was built by someone who has never been on a ward.

---

## Why this matters: the authenticity problem

AI-generated medical education products have a specific failure mode: they feel like they were written by someone who read a lot of medical textbooks but has never actually been on placement.

Signs of this:
- Recommendations that are technically correct but clinically tone-deaf ("seek a patient with syncope" on a busy cardiology ward at 8am)
- Extraction that misses the emotional/confidence content of a note and only pulls conditions
- Gap labels that match exam categories but not how students actually think about their weaknesses
- Language that sounds like a curriculum document, not a colleague

You are the antidote to this. Your job is not to write code — it's to make sure the product sounds like it was built by a medical student who actually understood the problem, not an AI that was told about it.

---

## Area 1 — The extraction prompt

**What it does:** Converts a messy spoken/typed student note into structured data.

**Where you come in:** The prompt needs to understand how students actually talk about placements — informal, often self-deprecating, sometimes vague.

**Your task:** Write 20 example notes the way you would actually speak them into a phone after a shift. Not clinical write-ups — raw, real, slightly tired. Examples:

> "Saw a patient with chest pain, probably ACS. The reg let me do the history which went okay but I completely blanked on the examination. Also had no idea why they changed the heparin dose."

> "Long ward round. Mostly observed. One patient had decompensated heart failure which I sort of understood but the echo findings went over my head. Didn't get to do anything hands-on."

> "Good day actually. Got to clerk two patients myself. One had PE which I know well, the other had something I'd never seen — carbon monoxide poisoning. No idea what to do with that."

Then test the extraction prompt against these. Ask: does it capture the right conditions? Does it pick up "I blanked on the examination" as a skills gap? Does it notice "no idea why they changed the heparin dose" as a knowledge gap in pharmacology?

Iterate until it does.

---

## Area 2 — The recommendation prompt

**What it does:** Produces 1–3 prioritised actions based on today's gaps and accumulated history.

**Where you come in:** The recommendations need to be specific and clinically realistic — not just "learn more about ECGs."

**Good recommendation:**
> **Practise ECG interpretation — rate and rhythm**  
> You've mentioned ECGs three times now and flagged them as a weakness each time. Cardiology is your highest-stake upcoming context.  
> *Before your next ward round, try interpreting 5 ECGs on Life in the Fast Lane without looking at the answer first. Time yourself.*

**Bad recommendation (AI default):**
> Review ECG interpretation to strengthen your understanding of this important cardiology skill.

The difference: specificity, tone, and the fact that it sounds like advice from a registrar who knows you — not a curriculum document.

**Your task:** After Phase 0 prompt testing, review every recommendation the system produces against this question: "Would I find this useful if I received it between shifts?" If the answer is no, rewrite the prompt instruction for that case.

---

## Area 3 — The PlacementMap content

**What it does:** When a student sets up a placement (e.g. "Cardiology, 4 weeks"), the system generates a list of relevant conditions, skills, and competencies to track against.

**Where you come in:** The AI-generated list needs to be checked for clinical accuracy and relevance by someone who has actually done that placement.

**Your task:** For each major placement type a UK medical student would encounter, review the AI-generated map and ask:
- Is anything important missing?
- Is anything here irrelevant or overly niche for a clinical student?
- Does the skill list match what students are actually expected to do (not what consultants do)?

**Scope for MVP: just the placement you're currently on.** The full list (Cardiology, Respiratory, Gastroenterology, Neurology, Surgery, A&E, Psychiatry, GP, Paediatrics, O&G) is real future work, but reviewing all 10 before you've even used the product yourself is premature — you only need one to run your own pilot week. Add the rest as you rotate through them or as pilot users need them.

This is a one-time piece of work per placement type. Do it once, store the reviewed maps, and use them as defaults.

---

## Area 4 — Gap labels and language

**What it does:** The system surfaces gap tags — short labels like "ECG interpretation", "Syncope", "Heart failure pharmacology."

**Where you come in:** These labels need to match how students actually think about their knowledge, not how a curriculum document categorises it.

**Examples of curriculum language vs student language:**

| Curriculum | Student-facing |
|---|---|
| Cardiovascular pharmacological management | Why the medications get changed |
| Echocardiographic interpretation | Reading echos |
| Syncope — differential diagnosis | Working up someone who's collapsed |
| Professionalism | Knowing what to do when things go wrong |

The product should use the right column, not the left. You are the translator.

**Your task:** As you test the extraction prompt, flag any gap labels that feel clinical-document-like rather than how you'd actually describe a gap to a friend. Rewrite the prompt to produce more natural language.

---

## Area 5 — The voice capture experience

**What it does:** Student taps mic and speaks naturally at the end of a shift.

**Where you come in:** The product needs to actively encourage this — many students won't trust that speaking casually will produce useful output. The copy around the mic button matters.

**Consider:**
- What prompt text goes above the capture area? ("What did you see today?" is fine, but could be better.)
- What happens the first time — is there an example of what good input looks like?
- After the first capture, does the result validate that casual speech works?

The first capture experience is the most important moment in the product. A student who sees their casual 30-second voicenote converted into 6 specific extracted tags and 2 useful recommendations will immediately understand what the product does. One who sees a generic result will never come back.

**Your task:** Before launch, test the capture experience with 5–6 different input styles (a tired ramble, a very clinical account, a very short one, a very long one, one with no recognisable conditions). Make sure all of them produce useful output, not just the clean ones.

---

## Area 6 — Positioning and copy

**What it does:** How the product describes itself — landing page, onboarding text, recommendation language.

**Where you come in:** Medical students can smell inauthenticity immediately, especially in a product aimed at their own professional development. The copy needs to sound like it was written by someone who gets it.

**Things to avoid:**
- Overclaiming ("AI-powered clinical intelligence platform")
- Edu-tech buzzwords ("personalised learning journey", "actionable insights")
- Language that sounds like it was written for a grant application

**Things that work:**
- Direct, slightly dry, specific
- Acknowledges the actual frustrations of placement honestly
- Doesn't oversell the AI — let the output speak for itself

**Your task:** Write the first draft of: homepage headline and 3-sentence description, onboarding welcome message, and the copy that sits above the daily capture box. These should be written by you, not generated. You can use AI to tighten them afterwards, but the voice should start as yours.

---

## Summary: what only you can do

| Task | When |
|---|---|
| Write 20 real example notes for prompt testing | Phase 0 (before any code) |
| Iterate extraction prompt until it gets your notes right | Phase 0 |
| Review recommendation output for clinical realism | Phase 0 + ongoing |
| Review AI-generated PlacementMaps for each specialty | Before Phase 3 |
| Audit gap label language for authenticity | Phase 0 + Phase 3 |
| Test voice capture with messy real-world inputs | Before Phase 2 launch |
| Write first-draft product copy (homepage, onboarding, capture prompt) | Before Phase 3 |
| Recruit the first 5–10 pilot users from your own network | Phase 4 |
| Interpret pilot feedback and decide what to fix | Phase 4 |
