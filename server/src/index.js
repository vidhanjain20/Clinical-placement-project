import 'dotenv/config'; // loads .env into process.env — must be first
import { Sentry } from './sentry.js'; // Sentry.init() itself already ran in instrument.js (node --import)
import express from 'express';
import cors from 'cors';
import { attachClerk, requireAuth } from './auth.js';
import notesRouter from './routes/notes.js';
import learnerModelRouter from './routes/learnerModel.js';
import studentRouter from './routes/student.js';
import placementsRouter from './routes/placements.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check first, before Clerk — it should work even with no auth
// configured at all, so a monitoring tool can confirm the server is up
// independent of whether secrets are set correctly.
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(attachClerk);
app.use('/api/notes', requireAuth, notesRouter);
app.use('/api/learner-model', requireAuth, learnerModelRouter);
app.use('/api/student', requireAuth, studentRouter);
app.use('/api/placements', requireAuth, placementsRouter);

// Sentry error handler must be registered after all routes, before any
// other error-handling middleware, so it sees every unhandled error.
Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Clinical Learning Navigator server running on http://localhost:${PORT}`);
});
