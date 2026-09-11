import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyGapMappings, applyExposureAndSkills } from './learnerModel.js';

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

test('exposure/skills: new condition starts at count 1, performed reflects the AI-judged flag', () => {
  const result = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    { exposureMappings: [{ raw: 'CHF', canonical: 'heart failure', performed: false }], skillMappings: [] },
  );
  assert.equal(result.exposure['heart failure'].count, 1);
  assert.equal(result.exposure['heart failure'].performed, false);
});

test('exposure/skills: performed once stays performed even if a later note marks it not performed', () => {
  const first = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    { exposureMappings: [{ raw: 'CHF', canonical: 'heart failure', performed: true }], skillMappings: [] },
  );
  const second = applyExposureAndSkills(first, {
    exposureMappings: [{ raw: 'CHF ward round', canonical: 'heart failure', performed: false }],
    skillMappings: [],
  });
  assert.equal(second.exposure['heart failure'].count, 2);
  assert.equal(second.exposure['heart failure'].performed, true);
});

test('exposure/skills: raw wording reconciles to the placement map\'s canonical wording', () => {
  const result = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    { exposureMappings: [], skillMappings: [{ raw: 'ECG interpretation', canonical: 'reading ECGs', performed: true }] },
  );
  assert.deepEqual(Object.keys(result.skills), ['reading ecgs']);
  assert.equal(result.skills['reading ecgs'].performed, true);
});

test('exposure/skills: same canonical item mentioned twice in one note only counts once', () => {
  const result = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    {
      exposureMappings: [
        { raw: 'CHF', canonical: 'heart failure', performed: true },
        { raw: 'heart failure again', canonical: 'heart failure', performed: false },
      ],
      skillMappings: [],
    },
  );
  assert.equal(result.exposure['heart failure'].count, 1);
});

test('exposure/skills: skills tracked separately from conditions', () => {
  const result = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    {
      exposureMappings: [{ raw: 'CHF', canonical: 'CHF', performed: true }],
      skillMappings: [{ raw: 'auscultation', canonical: 'auscultation', performed: true }],
    },
  );
  assert.deepEqual(Object.keys(result.exposure), ['chf']);
  assert.deepEqual(Object.keys(result.skills), ['auscultation']);
});
