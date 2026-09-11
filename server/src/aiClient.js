import Anthropic from '@anthropic-ai/sdk';
import { EXTRACTION_PROMPT, RECOMMENDATION_PROMPT, PLACEMENT_MAP_PROMPT } from './prompts.js';
import { Sentry } from './sentry.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Claude sometimes wraps JSON in markdown code fences or adds stray text
// around it despite being asked for JSON only. This pulls out the first
// {...} or [...] block found, rather than assuming the whole response is
// clean JSON. Pure function — no network call — so it's unit-testable.
export function extractJson(text) {
  const match = text.match(/[{[][\s\S]*[}\]]/);
  if (!match) throw new Error('No JSON found in model response');
  return JSON.parse(match[0]);
}

// Calls the model, tries to parse JSON out of the reply, and retries once
// with a stricter instruction if parsing fails (design-spec.md §5). The
// actual "call the model" step is injected as `callModel` so this
// retry/parse logic can be unit-tested with a fake model that returns
// broken JSON, without needing a real API key.
export async function callAndParseJson(systemPrompt, userMessage, callModel = defaultCallModel, options = {}) {
  try {
    const first = await callModel(systemPrompt, userMessage, options);
    return { ok: true, data: extractJson(first) };
  } catch (firstErr) {
    try {
      const retry = await callModel(
        systemPrompt + '\n\nIMPORTANT: reply with ONLY the JSON object, no other text.',
        userMessage,
        options,
      );
      return { ok: true, data: extractJson(retry) };
    } catch (retryErr) {
      // Both attempts failed — this is the one place a bad API key, an
      // exhausted credit balance, or a persistent model/parsing problem
      // would otherwise vanish silently, since the caller only sees
      // ok:false and degrades gracefully. Report it so it's visible
      // somewhere instead of only showing up as "why are gaps not
      // building up" days later.
      console.error('AI call failed after retry:', firstErr.message, '/', retryErr.message);
      Sentry.captureException(retryErr, { extra: { firstAttemptError: firstErr.message } });
      return { ok: false, data: null };
    }
  }
}

async function defaultCallModel(systemPrompt, userMessage, { maxTokens = 1024 } = {}) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: maxTokens,
    // We just want structured JSON back, not reasoning — extended
    // thinking is on by default for this model and was eating into
    // max_tokens, sometimes truncating the JSON output entirely.
    thinking: { type: 'disabled' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No text block in model response');
  return textBlock.text;
}

export async function runExtraction(rawText) {
  return callAndParseJson(EXTRACTION_PROMPT, rawText);
}

export async function runRecommendation({ todaysGaps, gapTally, placementContext, assessmentDate }) {
  const userMessage = JSON.stringify({ todaysGaps, gapTally, placementContext, assessmentDate });
  return callAndParseJson(RECOMMENDATION_PROMPT, userMessage);
}

export async function generatePlacementMap({ name, durationWeeks }) {
  const userMessage = JSON.stringify({ name, durationWeeks });
  return callAndParseJson(PLACEMENT_MAP_PROMPT, userMessage, defaultCallModel, { maxTokens: 2048 });
}
