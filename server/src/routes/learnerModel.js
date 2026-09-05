import express from 'express';
import { getLearnerModel } from '../learnerModel.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(getLearnerModel(req.student.id));
});

export default router;
