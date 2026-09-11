import express from 'express';
import { getPendingActions, updateActionOutcome } from '../db.js';

const router = express.Router();

// design-spec.md §3 Screen 3: "Did you act on this?" prompt for previous
// day's recommendations, shown at the top of Capture if unanswered.
router.get('/pending', (req, res) => {
  res.json(getPendingActions(req.student.id));
});

// MVP keeps this binary in the UI (completed/skipped) even though the
// column accepts any of design-spec.md's six outcome values — a simple
// yes/no matches how the screen is actually described ("did you act on
// this?"), the finer-grained values are there if a later pass wants them.
router.patch('/:id', (req, res) => {
  const { outcome } = req.body;
  if (!outcome) {
    return res.status(400).json({ error: 'outcome is required.' });
  }
  const updated = updateActionOutcome(req.params.id, req.student.id, outcome);
  if (!updated) {
    return res.status(404).json({ error: 'Action not found.' });
  }
  res.json(updated);
});

export default router;
