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

// Tracks how many times each condition/skill has come up, keyed by the
// canonical text the recommendation call matched it to (its own wording
// if nothing on the placement map was a good match). This mirrors
// applyGapMappings — an earlier version tried to match extraction wording
// against the placement map with plain substring checks (e.g. "reading
// ECGs" vs "ECG interpretation"), which missed anything that wasn't a
// literal substring of the other; letting the same AI call that already
// reconciles gaps handle this is both simpler and more accurate.
export function applyExposureAndSkills(current, { exposureMappings, skillMappings }) {
  return {
    exposure: tally(current.exposure, exposureMappings),
    skills: tally(current.skills, skillMappings),
  };
}

function tally(current, mappings) {
  const updated = { ...current };
  const today = new Date().toISOString();
  const seenToday = new Set();
  for (const { canonical, performed } of mappings ?? []) {
    const key = canonical.trim().toLowerCase();
    if (!key || seenToday.has(key)) continue; // one note mentioning the same item twice counts once
    seenToday.add(key);
    const existing = updated[key] ?? { count: 0, last_seen: null, performed: false };
    updated[key] = {
      count: existing.count + 1,
      last_seen: today,
      performed: existing.performed || Boolean(performed), // once performed, stays performed
    };
  }
  return updated;
}

export function saveLearnerModelExposureAndSkills(studentId, { exposure, skills }) {
  db.prepare(
    "UPDATE learner_models SET exposure = ?, skills = ?, last_updated = datetime('now') WHERE student_id = ?",
  ).run(JSON.stringify(exposure), JSON.stringify(skills), studentId);
}
