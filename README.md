# Clinical Learning Loop

A tool that turns a medical student's free-text (or voice) placement notes into structured learning gaps and one trajectory-aware next action — so real clinical experience, not a question bank, drives what you study next.

## Status: Design phase

## Contents

- [`design-spec.md`](design-spec.md) — v1 design spec (data model, core loop, screens, stack, compliance)
- [`competitor-research.md`](competitor-research.md) — market landscape, white-space analysis, competitors to watch

## The core idea

Student speaks or types what happened on placement → two LLM calls extract topics/skills/gaps and surface a recommendation informed by their *recent history* of gaps → one dashboard shows the breakdown, history, and what to focus on next.

The differentiator is the trajectory: a single-note diary is easy to copy, but "you've now flagged echo interpretation three times across your last ten notes" is not.

## Separate from Continuity

This is a distinct concept. The `continuity/` app (patient drop-off tracking for physio clinics) stays parked and untouched.
