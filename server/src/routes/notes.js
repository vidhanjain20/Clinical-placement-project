import express from 'express';
import { db } from '../db.js';
import { runExtraction, runRecommendation } from '../aiClient.js';
import { getLearnerModel, applyGapMappings, saveLearnerModelGapTally } from '../learnerModel.js';
import { notesRateLimit } from '../rateLimit.js';

const router = express.Router();

// This is the endpoint described in design-spec.md §2 — the whole
// product, in one request handler. A student's raw text goes in; two
// Claude API calls happen in sequence; a Note row and the running gap
// tally get saved; the structured result and recommendations come back.
router.post('/', notesRateLimit, async (req, res, next) => {
  try {
    const { raw_text, placement_id } = req.body;
    if (!raw_text || raw_text.trim().length < 20) {
      return res.status(400).json({ error: 'Note is too short — add a little more detail.' });
    }

    // Insert immediately with raw_text saved, before calling the AI at
    // all — design-spec.md §5's core rule: the student's words are never
    // lost even if everything after this point fails.
    const insertResult = db
      .prepare('INSERT INTO notes (student_id, placement_id, raw_text, extraction_status) VALUES (?, ?, ?, ?)')
      .run(req.student.id, placement_id ?? null, raw_text, 'pending');
    const noteId = insertResult.lastInsertRowid;

    const extraction = await runExtraction(raw_text);
    if (!extraction.ok) {
      db.prepare("UPDATE notes SET extraction_status = 'failed' WHERE id = ?").run(noteId);
      return res.status(200).json({
        note_id: noteId,
        extraction_status: 'failed',
        message: "Saved — we'll process this when the connection recovers.",
      });
    }

    const learnerModel = getLearnerModel(req.student.id);
    const placement = placement_id
      ? db.prepare('SELECT * FROM placements WHERE id = ?').get(placement_id)
      : null;

    const recommendation = await runRecommendation({
      todaysGaps: extraction.data.gaps,
      gapTally: learnerModel.gap_tally,
      placementContext: placement ? { name: placement.name } : null,
      assessmentDate: null, // not collected until Phase 3 onboarding
    });

    const nextActions = recommendation.ok ? recommendation.data.actions : [];
    if (recommendation.ok) {
      const updatedTally = applyGapMappings(learnerModel.gap_tally, recommendation.data.gap_mappings);
      saveLearnerModelGapTally(req.student.id, updatedTally);
    }

    db.prepare(
      "UPDATE notes SET structured = ?, gaps = ?, next_actions = ?, extraction_status = 'ok' WHERE id = ?",
    ).run(JSON.stringify(extraction.data), JSON.stringify(extraction.data.gaps), JSON.stringify(nextActions), noteId);

    res.json({
      note_id: noteId,
      extraction_status: 'ok',
      structured: extraction.data,
      next_actions: nextActions,
      recommendations_available: recommendation.ok,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, date, raw_text, structured, gaps, next_actions, extraction_status FROM notes WHERE student_id = ? ORDER BY date DESC')
    .all(req.student.id);

  res.json(
    rows.map((row) => ({
      ...row,
      structured: row.structured ? JSON.parse(row.structured) : null,
      gaps: row.gaps ? JSON.parse(row.gaps) : [],
      next_actions: row.next_actions ? JSON.parse(row.next_actions) : [],
    })),
  );
});

export default router;
