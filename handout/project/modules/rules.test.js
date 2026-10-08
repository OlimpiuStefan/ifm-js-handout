// Tests for the alarm rules. node:test and node:assert come with Node:
// no test framework to install.
//
// Each test is one sentence that stays true: run `npm test` after any
// change to rules.js and the sentence that stopped being true tells you
// what you broke.
import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, activeAlarms, STATE } from './rules.js';

// A reading with only the fields the rules look at. Values are strings,
// as they are on the wire.
const r = (value, deviceId = 'PT-1042') => ({ deviceId, value });

test('classify returns CRITICAL above the critical threshold', () => {
  assert.equal(classify(r('96')), STATE.CRITICAL);
});

test('classify returns WARNING above the warning threshold', () => {
  assert.equal(classify(r('60')), STATE.WARNING);
});

test('classify returns OK below both', () => {
  assert.equal(classify(r('20')), STATE.OK);
});

test('classify treats 0 as a value, not as missing', () => {
  assert.equal(classify(r('0')), STATE.OK);
});

test('activeAlarms keeps only the non-OK readings', () => {
  const out = activeAlarms([r('20'), r('60'), r('96')]);
  assert.equal(out.length, 2);
});

test('activeAlarms puts the worst first', () => {
  const out = activeAlarms([r('60'), r('96')]);
  assert.equal(out[0].state, STATE.CRITICAL);
});

test('activeAlarms leaves the list it was given in its original order', () => {
  const readings = [r('60', 'A'), r('96', 'B')];
  activeAlarms(readings);
  assert.deepEqual(readings.map((x) => x.deviceId), ['A', 'B']);   // toSorted, not sort
});
