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

  CREATE INDEX IF NOT EXISTS idx_notes_student ON notes(student_id);
  CREATE INDEX IF NOT EXISTS idx_placements_student ON placements(student_id);
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
