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

test('exposure/skills: new condition starts at count 1, not performed if only observed', () => {
  const result = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    { conditions: ['CHF'], skills: [], participation: { performed: [], observed: ['CHF workup'], assisted: [] } },
  );
  assert.equal(result.exposure.chf.count, 1);
  assert.equal(result.exposure.chf.performed, false);
});

test('exposure/skills: performed once stays performed even if a later note only observes it', () => {
  const first = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    { conditions: ['CHF'], skills: [], participation: { performed: ['managed CHF patient'], observed: [], assisted: [] } },
  );
  const second = applyExposureAndSkills(
    first,
    { conditions: ['CHF'], skills: [], participation: { performed: [], observed: ['CHF ward round'], assisted: [] } },
  );
  assert.equal(second.exposure.chf.count, 2);
  assert.equal(second.exposure.chf.performed, true);
});

test('exposure/skills: matches a performed phrase that is shorter than the skill name', () => {
  const result = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    {
      conditions: [],
      skills: ['taking a chest pain history'],
      participation: { performed: ['chest pain history'], observed: [], assisted: [] },
    },
  );
  assert.equal(result.skills['taking a chest pain history'].performed, true);
});

test('exposure/skills: skills tracked separately from conditions', () => {
  const result = applyExposureAndSkills(
    { exposure: {}, skills: {} },
    { conditions: ['CHF'], skills: ['auscultation'], participation: { performed: ['auscultation'], observed: [], assisted: [] } },
  );
  assert.deepEqual(Object.keys(result.exposure), ['chf']);
  assert.deepEqual(Object.keys(result.skills), ['auscultation']);
  assert.equal(result.skills.auscultation.performed, true);
});
