// Error monitoring (design-spec.md §6d). This must be imported and
// initialized before anything else in index.js, so it can catch errors
// from every other file, not just ones written after it.
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
} else {
  console.warn('SENTRY_DSN not set — errors will only show in the server console, not in Sentry.');
}

export { Sentry };
