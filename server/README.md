# Clinical Learning Navigator — server (Phase 1)

This is the backend only — no app screens yet (see `build-plan.md` Phase 2 for that). Everything here is tested via a tool like Postman or `curl`, not a browser.

## What you need before this actually works

Three accounts, three keys. Nothing here runs against real AI, real auth, or real error monitoring until you have these:

1. **Anthropic API key** — [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys). Powers the two AI calls that are the whole product.
2. **Clerk keys** (publishable + secret) — [dashboard.clerk.com](https://dashboard.clerk.com), create a new application, copy both keys from API Keys. Handles signup/login — you never touch passwords yourself.
3. **Sentry DSN** — [sentry.io](https://sentry.io), create a new project (choose "Node.js"), copy the DSN from Settings → Client Keys. Optional to start (the server runs fine without it, just logs a warning and only shows errors in your terminal instead of Sentry's dashboard) but worth setting up before you rely on this for real placement weeks.

## Setup

```bash
cp .env.example .env
```

Paste the three keys/values from above into `.env`. This file is git-ignored — it will never be committed.

```bash
npm install
```

(Run from the `clinical-learning-loop` folder, not this one — it's an npm workspace.)

```bash
npm run dev
```

Server starts at `http://localhost:4000`. `npm run test` runs the automatic checks (gap-tally math, JSON-parsing fallback) — these work with no keys at all, since they don't call any real service.

## Trying it

Every route except `/api/health` requires a real Clerk session token in the request — there's no login screen yet (that's Phase 2), so testing `POST /api/notes` for real requires either a quick Clerk-hosted sign-in page or waiting for Phase 2's UI. `/api/health` works immediately with no setup:

```bash
curl http://localhost:4000/api/health
```

## What's actually implemented

- `POST /api/notes` — the core loop: raw text in, two Claude calls, structured result + recommendations out. Rate-limited per student (20/hour).
- `GET /api/notes` — history for the signed-in student.
- `GET /api/learner-model` — current gap tally and exposure summary.

## What's deliberately not here yet

No placement setup, no PlacementMap generation, no dashboard, no voice input — those are Phase 2/3 (see `../build-plan.md`).
