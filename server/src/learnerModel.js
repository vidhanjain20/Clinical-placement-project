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
