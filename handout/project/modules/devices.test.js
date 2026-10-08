// Tests for loading several devices at once.
//
// loadAll takes the fetch function as a parameter, so a test hands in a
// fake and needs no server, no socket and no network. The fake answers a
// promise, like the real one would.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll } from './devices.js';

const IDS = Array.from({ length: 12 }, (_, i) => `XX-${String(i).padStart(4, '0')}`);
const answer = (id) => Promise.resolve({ deviceId: id, value: '1' });

test('loads every device when all of them answer', async () => {
  const results = await loadAll(IDS, answer);
  assert.equal(results.length, 12);
});

test('one dead sensor does not blank the other eleven', async () => {
  const dead = IDS[7];
  const results = await loadAll(IDS, (id) => (id === dead ? Promise.reject(new Error('503')) : answer(id)));
  assert.equal(results.filter(Boolean).length, 11);   // Promise.allSettled, not Promise.all
  assert.equal(results[7], null);                      // the dead one is an explicit null, in its place
});
