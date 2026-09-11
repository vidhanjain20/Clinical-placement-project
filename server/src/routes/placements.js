import express from 'express';
import { createPlacement, getActivePlacement, getPlacementById, updatePlacementMap } from '../db.js';
import { generatePlacementMap } from '../aiClient.js';

const router = express.Router();

// Screen 2 (design-spec.md §3): name + duration in, AI-generated
// conditions/skills/competencies list out, for the student to review and
// edit before it becomes the placement's tracking reference.
router.post('/', async (req, res, next) => {
  try {
    const { name, duration_weeks: durationWeeks } = req.body;
    if (!name || !durationWeeks || durationWeeks < 1) {
      return res.status(400).json({ error: 'name and duration_weeks (>= 1) are required.' });
    }

    const result = await generatePlacementMap({ name, durationWeeks });
    if (!result.ok) {
      return res.status(502).json({ error: 'Could not generate a placement map — try again.' });
    }

    const placement = createPlacement(req.student.id, { name, durationWeeks, placementMap: result.data });
    res.json(placement);
  } catch (err) {
    next(err);
  }
});

router.get('/active', (req, res) => {
  res.json(getActivePlacement(req.student.id));
});

// The AI-generated map is a starting point, not a final answer
// (founder-input.md §3) — the student can add/remove items before or
// after they start using it.
router.patch('/:id', (req, res) => {
  const { placement_map: placementMap } = req.body;
  if (!placementMap) {
    return res.status(400).json({ error: 'placement_map is required.' });
  }
  const placement = getPlacementById(req.params.id);
  if (!placement || placement.student_id !== req.student.id) {
    return res.status(404).json({ error: 'Placement not found.' });
  }
  res.json(updatePlacementMap(req.params.id, placementMap));
});

export default router;
