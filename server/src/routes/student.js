import express from 'express';
import { updateStudentProfile } from '../db.js';

const router = express.Router();

// req.student is already the current row (attached by auth.js on every
// request) — this just hands it back so the client knows whether
// onboarding (design-spec.md §3, Screen 1) has been completed yet.
router.get('/', (req, res) => {
  res.json(req.student);
});

router.patch('/', (req, res) => {
  const { year_of_study: yearOfStudy, medical_school: medicalSchool } = req.body;
  if (!yearOfStudy || !medicalSchool) {
    return res.status(400).json({ error: 'year_of_study and medical_school are both required.' });
  }
  res.json(updateStudentProfile(req.student.id, { yearOfStudy, medicalSchool }));
});

export default router;
