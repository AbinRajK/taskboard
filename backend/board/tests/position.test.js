import test from 'node:test';
import assert from 'node:assert/strict';
import { between, nextPosition, STEP } from '../src/utils/position.js';

test('first item gets the base step', () => {
  assert.equal(nextPosition(undefined), STEP);
  assert.equal(between(null, null), STEP);
});

test('appending goes after the last item', () => {
  assert.equal(nextPosition(3000), 4000);
  assert.equal(between(3000, null), 4000);
});

test('inserting at the top halves the first position', () => {
  assert.equal(between(null, 1000), 500);
});

test('inserting between two items lands strictly between them', () => {
  const pos = between(1000, 2000);
  assert.ok(pos > 1000 && pos < 2000);
});
