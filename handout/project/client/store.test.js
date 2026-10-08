// Tests for the Store. It runs in Node as it does in the browser:
// EventTarget and CustomEvent are in both.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from './store.js';

test('set merges the change into a new state', () => {
  const store = new Store({ readings: [], selectedId: null });
  store.set({ selectedId: 'PT-1042' });
  assert.deepEqual(store.state, { readings: [], selectedId: 'PT-1042' });
});

test('set dispatches change with the new state', () => {
  const store = new Store({ selectedId: null });
  let seen;
  store.addEventListener('change', (event) => (seen = event.detail));
  store.set({ selectedId: 'VS-0071' });
  assert.equal(seen.selectedId, 'VS-0071');
});

test('the state cannot be edited in place', () => {
  const store = new Store({ selectedId: null });
  assert.throws(() => {
    store.state.selectedId = 'PT-1042';   // frozen: throws in a module (strict mode)
  });
  assert.equal(store.state.selectedId, null);
});
