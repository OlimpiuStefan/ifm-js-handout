// Tests for the transport shape: what a raw frame becomes before it leaves
// the service.
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, normalizeAll } from './normalize.js';

// A good frame, with any field overridden by the spread: frame({ value: null }).
const frame = (over = {}) => ({
  deviceId: 'PT-1042', name: 'Press line 1', value: 92.4,
  unit: 'C', at: '2026-09-03T14:32:07.000Z', ...over,
});

test('normalize carries the identifying fields through', () => {
  const r = normalize(frame());
  assert.equal(r.deviceId, 'PT-1042');
  assert.equal(r.unit, 'C');
});

test('normalize turns the value into a string', () => {
  assert.equal(normalize(frame({ value: 92.4 })).value, '92.4');
  assert.equal(typeof normalize(frame()).value, 'string');
});

test('normalize keeps a reading of zero', () => {
  assert.equal(normalize(frame({ value: 0 })).value, '0');   // `== null`, not `!value`
});

test('normalize emits ISO 8601 in UTC', () => {
  assert.equal(normalize(frame()).at, '2026-09-03T14:32:07.000Z');
});

test('normalizeAll drops the frames with no value', () => {
  const out = normalizeAll([frame(), frame({ value: null })]);
  assert.equal(out.length, 1);
});
