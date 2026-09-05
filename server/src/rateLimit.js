// design-spec.md §6b — POST /notes triggers two paid Anthropic API calls,
// so it gets its own limit keyed by student, not by IP address (a shared
// wifi/phone network shouldn't get one combined limit).
import rateLimit from 'express-rate-limit';

export const notesRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20, // well above realistic use (a few notes a day), low enough to stop a runaway loop
  keyGenerator: (req) => req.student?.id ?? req.ip,
  message: { error: 'Too many notes submitted this hour. Try again shortly.' },
});
