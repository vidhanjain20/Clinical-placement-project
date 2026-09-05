import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyGapMappings } from './learnerModel.js';

test('new canonical tag starts at count 1', () => {
  const result = applyGapMappings({}, [{ raw: 'reading ECGs', canonical: 'ecg_interpretation' }]);
  assert.deepEqual(result, { ecg_interpretation: 1 });
});

test('existing canonical tag increments regardless of today\'s wording', () => {
  const result = applyGapMappings(
    { ecg_interpretation: 2 },
    [{ raw: 'ECG interpretation', canonical: 'ecg_interpretation' }],
  );
  assert.deepEqual(result, { ecg_interpretation: 3 });
});

test('same canonical tag mentioned twice in one note only counts once', () => {
  const result = applyGapMappings({}, [
    { raw: 'reading ECGs', canonical: 'ecg_interpretation' },
    { raw: 'ECG interpretation again', canonical: 'ecg_interpretation' },
  ]);
  assert.deepEqual(result, { ecg_interpretation: 1 });
});

test('unrelated tags stay independent', () => {
  const result = applyGapMappings(
    { ecg_interpretation: 1 },
    [{ raw: 'reading echos', canonical: 'echo_interpretation' }],
  );
  assert.deepEqual(result, { ecg_interpretation: 1, echo_interpretation: 1 });
});
