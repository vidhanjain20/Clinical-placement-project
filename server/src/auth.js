// Auth is handled by Clerk (a managed auth provider — see design-spec.md
// §6a), not hand-rolled. Clerk verifies the student's login and hands us
// back a "userId" we can trust; we never see or store passwords ourselves.
import { clerkMiddleware, requireAuth as clerkRequireAuth, clerkClient, getAuth } from '@clerk/express';
import { getOrCreateStudent } from './db.js';

// Reads Clerk's session cookie/token on every request. Must run before
// any route that uses requireAuth or getAuth.
export const attachClerk = clerkMiddleware();

// Blocks the request with 401 if there's no valid Clerk session, then
// looks up (or creates, on first login) the local `students` row that
// holds our own app-specific fields (year_of_study, medical_school, etc)
// that Clerk has no reason to know about. Attaches it as req.student.
export const requireAuth = [
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
];
