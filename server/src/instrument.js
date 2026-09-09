// Sentry's Node SDK auto-instruments libraries (Express included) by
// patching them as they're `import`ed — which only works if Sentry.init()
// runs before anything else loads. In ESM that means this file must be
// loaded via `node --import` (see package.json scripts), not a regular
// `import` inside index.js: by the time index.js's own imports run,
// express is already loaded and it's too late to patch it.
import 'dotenv/config';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
} else {
  console.warn('SENTRY_DSN not set — errors will only show in the server console, not in Sentry.');
}
