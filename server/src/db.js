import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.CLL_DB_PATH || path.join(dataDir, 'clinical-learning-loop.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clerk_user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    year_of_study TEXT,
    medical_school TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS placements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    placement_map TEXT
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    placement_id INTEGER REFERENCES placements(id),
    date TEXT NOT NULL DEFAULT (datetime('now')),
    raw_text TEXT NOT NULL,
    structured TEXT,
    gaps TEXT,
    next_actions TEXT,
    extraction_status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS learner_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL UNIQUE REFERENCES students(id),
    exposure TEXT NOT NULL DEFAULT '{}',
    skills TEXT NOT NULL DEFAULT '{}',
    gap_tally TEXT NOT NULL DEFAULT '{}',
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS action_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id),
    note_id INTEGER NOT NULL REFERENCES notes(id),
    action_text TEXT NOT NULL,
    outcome TEXT,
    logged_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_notes_student ON notes(student_id);
  CREATE INDEX IF NOT EXISTS idx_placements_student ON placements(student_id);
  CREATE INDEX IF NOT EXISTS idx_action_log_student ON action_log(student_id);
`);

// Every table that holds a student's data (json columns above) stores it
// as a TEXT column containing JSON — SQLite has no native JSON type, so
// objects/arrays are serialized with JSON.stringify() on the way in and
// parsed with JSON.parse() on the way out. See learnerModel.js and
// notes.js for where that happens.

export function getOrCreateStudent({ clerkUserId, email, name }) {
  const existing = db.prepare('SELECT * FROM students WHERE clerk_user_id = ?').get(clerkUserId);
  if (existing) return existing;

  const result = db
    .prepare('INSERT INTO students (clerk_user_id, email, name) VALUES (?, ?, ?)')
    .run(clerkUserId, email, name || null);

  db.prepare('INSERT INTO learner_models (student_id) VALUES (?)').run(result.lastInsertRowid);

  return db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
}

// Screen 1 (design-spec.md §3): year + medical school, collected once.
// Deliberately not validating against a fixed list of schools/years here —
// free text is fine for MVP, this is context for prompts, not a lookup key.
export function updateStudentProfile(studentId, { yearOfStudy, medicalSchool }) {
  db.prepare('UPDATE students SET year_of_study = ?, medical_school = ? WHERE id = ?').run(
    yearOfStudy,
    medicalSchool,
    studentId,
  );
  return db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
}

// Only one placement is "active" per student at a time (design-spec.md's
// "current placement" — capture posts against whichever one that is).
// Starting a new one retires the previous rather than deleting it, since
// its notes/history should stay attached to it.
export function createPlacement(studentId, { name, durationWeeks, placementMap }) {
  db.prepare("UPDATE placements SET status = 'completed' WHERE student_id = ? AND status = 'active'").run(studentId);

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationWeeks * 7 * 24 * 60 * 60 * 1000);
  const result = db
    .prepare(
      'INSERT INTO placements (student_id, name, start_date, end_date, status, placement_map) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(studentId, name, startDate.toISOString(), endDate.toISOString(), 'active', JSON.stringify(placementMap));

  return getPlacementById(result.lastInsertRowid);
}

export function getActivePlacement(studentId) {
  return getPlacementRow(
    db.prepare("SELECT * FROM placements WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1").get(studentId),
  );
}

export function getPlacementById(placementId) {
  return getPlacementRow(db.prepare('SELECT * FROM placements WHERE id = ?').get(placementId));
}

export function updatePlacementMap(placementId, placementMap) {
  db.prepare('UPDATE placements SET placement_map = ? WHERE id = ?').run(JSON.stringify(placementMap), placementId);
  return getPlacementById(placementId);
}

function getPlacementRow(row) {
  if (!row) return null;
  return { ...row, placement_map: row.placement_map ? JSON.parse(row.placement_map) : null };
}

// One row per recommended action, created alongside the note that
// produced it (design-spec.md's ActionLog table). outcome starts NULL
// ("pending") until the student answers the follow-through prompt on a
// later visit — screen 3's "Did you act on this?" (design-spec.md §3).
export function createActionLogEntries(studentId, noteId, actions) {
  const insert = db.prepare('INSERT INTO action_log (student_id, note_id, action_text) VALUES (?, ?, ?)');
  for (const action of actions) {
    insert.run(studentId, noteId, action.topic);
  }
}

export function getPendingActions(studentId) {
  return db
    .prepare('SELECT * FROM action_log WHERE student_id = ? AND outcome IS NULL ORDER BY logged_at ASC')
    .all(studentId);
}

// Recent history (answered or not) for the recommendation prompt's own
// "don't repeat a completed action" instruction — see prompts.js.
export function getRecentActionLog(studentId, limit = 10) {
  return db
    .prepare('SELECT action_text, outcome FROM action_log WHERE student_id = ? ORDER BY logged_at DESC LIMIT ?')
    .all(studentId, limit);
}

export function updateActionOutcome(actionId, studentId, outcome) {
  const result = db
    .prepare('UPDATE action_log SET outcome = ? WHERE id = ? AND student_id = ?')
    .run(outcome, actionId, studentId);
  if (result.changes === 0) return null;
  return db.prepare('SELECT * FROM action_log WHERE id = ?').get(actionId);
}
