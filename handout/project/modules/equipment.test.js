// Tests for the view model. renderList is not tested here: it needs a
// document, and the browser is where it is exercised.
import test from 'node:test';
import assert from 'node:assert/strict';
import { toView } from './equipment.js';

const reading = { deviceId: 'VS-0071', name: 'Conveyor bearing', value: '12.08', unit: 'mm/s' };

test('toView labels a reading with its name', () => {
  assert.equal(toView(reading).label, 'Conveyor bearing');
});

test('toView falls back to the device id when there is no name', () => {
  assert.equal(toView({ ...reading, name: undefined }).label, 'VS-0071');   // spread: a copy with one field changed
});

test('toView prefers the unit from meta when there is one', () => {
  assert.equal(toView({ ...reading, meta: { unit: 'in/s' } }).unit, 'in/s');
});

test('toView defaults the state to OK', () => {
  assert.equal(toView(reading).state, 'OK');
});

test('toView draws a reading of zero', () => {
  assert.notEqual(toView({ ...reading, value: '0' }), null);   // 0 bar is a reading
});

test('toView returns null when there is no value at all', () => {
  assert.equal(toView({ ...reading, value: null }), null);
});
