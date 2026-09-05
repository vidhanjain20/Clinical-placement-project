import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, callAndParseJson } from './aiClient.js';

test('extractJson pulls JSON out of surrounding text', () => {
  const text = 'Sure, here you go:\n```json\n{"conditions": ["heart failure"]}\n```';
  assert.deepEqual(extractJson(text), { conditions: ['heart failure'] });
});

test('extractJson throws on text with no JSON', () => {
  assert.throws(() => extractJson('sorry, I cannot help with that'));
});

test('callAndParseJson succeeds on the first try when the model behaves', async () => {
  const fakeModel = async () => '{"gaps": ["ecg"]}';
  const result = await callAndParseJson('sys', 'user', fakeModel);
  assert.deepEqual(result, { ok: true, data: { gaps: ['ecg'] } });
});

test('callAndParseJson retries once, then succeeds', async () => {
  let calls = 0;
  const fakeModel = async () => {
    calls += 1;
    return calls === 1 ? 'not json at all' : '{"gaps": []}';
  };
  const result = await callAndParseJson('sys', 'user', fakeModel);
  assert.deepEqual(result, { ok: true, data: { gaps: [] } });
  assert.equal(calls, 2);
});

test('callAndParseJson falls back to ok:false after two bad replies', async () => {
  const fakeModel = async () => 'still not json';
  const result = await callAndParseJson('sys', 'user', fakeModel);
  assert.deepEqual(result, { ok: false, data: null });
});
