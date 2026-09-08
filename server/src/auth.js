// Auth is handled by Clerk (a managed auth provider — see design-spec.md
// §6a), not hand-rolled. Clerk verifies the student's login and hands us
// back a "userId" we can trust; we never see or store passwords ourselves.
import { clerkMiddleware, requireAuth as clerkRequireAuth, clerkClient, getAuth } from '@clerk/express';
import { getOrCreateStudent } from './db.js';

// DEV-ONLY STUB: with no CLERK_SECRET_KEY set, every request is treated as
// one fixed local student instead of requiring a real Clerk session. This
// exists purely to test the note-submission loop (extraction + recommendation)
// before Clerk is wired up — never use this path for a real pilot or deploy.
const hasClerkKeys = Boolean(process.env.CLERK_SECRET_KEY);

if (!hasClerkKeys) {
  console.warn(
    'CLERK_SECRET_KEY not set — using a single fixed dev student instead of real login. ' +
      'This is a stub for local testing only; add Clerk keys before any real user touches this.',
  );
}

// Reads Clerk's session cookie/token on every request. Must run before
// any route that uses requireAuth or getAuth.
export const attachClerk = hasClerkKeys ? clerkMiddleware() : (req, res, next) => next();

// Blocks the request with 401 if there's no valid Clerk session, then
// looks up (or creates, on first login) the local `students` row that
// holds our own app-specific fields (year_of_study, medical_school, etc)
// that Clerk has no reason to know about. Attaches it as req.student.
export const requireAuth = hasClerkKeys
  ? [
      clerkRequireAuth(),
      async (req, res, next) => {
        try {
          const { userId } = getAuth(req);
          const clerkUser = await clerkClient.users.getUser(userId);
          req.student = getOrCreateStudent({
            clerkUserId: userId,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
            name: clerkUser.firstName ?? null,
          });
          next();
        } catch (err) {
          next(err);
        }
      },
    ]
  : (req, res, next) => {
      req.student = getOrCreateStudent({
        clerkUserId: 'dev-local-student',
        email: 'dev@local.test',
        name: 'Dev',
      });
      next();
    };
