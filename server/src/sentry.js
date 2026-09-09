// Sentry.init() itself happens in instrument.js, loaded via `node --import`
// before this or any other module — see that file for why. This just
// re-exports the SDK so other files can call Sentry.captureException(),
// Sentry.setupExpressErrorHandler(), etc. against the already-initialized
// client.
import * as Sentry from '@sentry/node';

export { Sentry };
