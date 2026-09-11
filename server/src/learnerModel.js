import { db } from './db.js';

export function getLearnerModel(studentId) {
  const row = db.prepare('SELECT * FROM learner_models WHERE student_id = ?').get(studentId);
  return {
    ...row,
    exposure: JSON.parse(row.exposure),
    skills: JSON.parse(row.skills),
    gap_tally: JSON.parse(row.gap_tally),
  };
}

// Increments the count for each canonical tag the recommendation call
// identified today. Pure function (no database, no AI) — this is what
// makes "you've flagged X three times" reliable, and it's exactly the
// piece that's cheap to unit-test without any external service.
export function applyGapMappings(currentTally, gapMappings) {
  const updated = { ...currentTally };
  const seenToday = new Set();
  for (const { canonical } of gapMappings) {
    if (seenToday.has(canonical)) continue; // one note mentioning the same gap twice counts once
    seenToday.add(canonical);
    updated[canonical] = (updated[canonical] ?? 0) + 1;
  }
  return updated;
}

export function saveLearnerModelGapTally(studentId, newTally) {
  db.prepare(
    "UPDATE learner_models SET gap_tally = ?, last_updated = datetime('now') WHERE student_id = ?",
  ).run(JSON.stringify(newTally), studentId);
}

// Tracks how many times each condition/skill has come up, keyed by a
// lowercased/trimmed version of the extraction's own wording. Unlike
// gap_tally, there's no AI reconciliation step here (that only happens
// for gaps, via the recommendation call's gap_mappings) — so "CHF" and
// "heart failure" are counted as separate entries. That's a known
// limitation matching the same tradeoff the gap tags accept elsewhere in
// this codebase: freeform extraction over a fixed taxonomy, at the cost
// of occasional near-duplicates.
export function applyExposureAndSkills(current, { conditions, skills, participation }) {
  const performedOrAssisted = [...(participation?.performed ?? []), ...(participation?.assisted ?? [])];

  return {
    exposure: tally(current.exposure, conditions, performedOrAssisted),
    skills: tally(current.skills, skills, performedOrAssisted),
  };
}

function tally(current, items, performedOrAssisted) {
  const updated = { ...current };
  const today = new Date().toISOString();
  for (const item of items ?? []) {
    const key = item.trim().toLowerCase();
    if (!key) continue;
    const existing = updated[key] ?? { count: 0, last_seen: null, performed: false };
    // Bidirectional, since neither phrase is reliably the longer one —
    // e.g. skill "taking a chest pain history" vs. performed "chest pain
    // history", or the reverse for a more verbose participation phrase.
    const mentionedAsPerformed = performedOrAssisted.some((p) => {
      const performedPhrase = p.toLowerCase();
      return performedPhrase.includes(key) || key.includes(performedPhrase);
    });
    updated[key] = {
      count: existing.count + 1,
      last_seen: today,
      performed: existing.performed || mentionedAsPerformed, // once performed, stays performed
    };
  }
  return updated;
}

export function saveLearnerModelExposureAndSkills(studentId, { exposure, skills }) {
  db.prepare(
    "UPDATE learner_models SET exposure = ?, skills = ?, last_updated = datetime('now') WHERE student_id = ?",
  ).run(JSON.stringify(exposure), JSON.stringify(skills), studentId);
}
