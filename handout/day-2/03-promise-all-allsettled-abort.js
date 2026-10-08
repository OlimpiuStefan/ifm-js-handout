// ═══════════════════════════════════════════════════════════════════
//  Day 2 · 03 · Promise.all, Promise.allSettled, AbortController
//  Run:  node 03-promise-all-allsettled-abort.js
//
//  What this file shows: Promise.all rejects as soon as ONE promise
//  rejects, and you lose the other eleven. Promise.allSettled waits for
//  all of them and reports each one. AbortController cancels a fetch that
//  would otherwise wait for ever.
// ═══════════════════════════════════════════════════════════════════
import { createServer } from 'node:http';

// A fake sensor read: 300 ms, and FL-0909 is offline.
const readSensor = (id, ms = 300) =>
  new Promise((resolve, reject) =>
    setTimeout(
      () => (id === 'FL-0909' ? reject(new Error('sensor offline')) : resolve({ id, value: '42.0' })),
      ms,
    ),
  );

const ids = [
  'VS-0071', 'PT-1042', 'PS-0310', 'MM-0002', 'LS-0120', 'SM-0415',
  'TA-0233', 'PN-0877', 'VS-0072', 'PT-1043', 'FL-0909', 'TA-0234',
];

// ─── 1 · Promise.all: all or nothing ──────────────────────────────
// Twelve reads start at once. One rejects, so Promise.all rejects, and the
// eleven good readings are thrown away with it. On a dashboard, that is a
// blank screen because of one dead sensor.
try {
  await Promise.all(ids.map((id) => readSensor(id)));
} catch (err) {
  console.log('Promise.all   :', err.message);            // → Promise.all   : sensor offline
}

// ─── 2 · Promise.allSettled: every result, good or bad ────────────
// Each entry is { status: 'fulfilled', value } or { status: 'rejected', reason }.
const results = await Promise.allSettled(ids.map((id) => readSensor(id)));
console.log(results[0]);                                  // → { status: 'fulfilled', value: { id: 'VS-0071', value: '42.0' } }
console.log(results[10]);                                 // → { status: 'rejected', reason: Error: sensor offline ... }

console.log('allSettled    :', results.filter((r) => r.status === 'fulfilled').length, 'of', results.length, 'readings');
// → allSettled    : 11 of 12 readings

// Rule: Promise.all when the results only make sense together.
//       Promise.allSettled when each result is useful on its own.

// ─── 3 · AbortController: cancel a request that never answers ────
// A server that accepts the connection and never replies. Without a way to
// cancel, `await fetch(url)` would wait for ever.
const hang = createServer(() => {});
await new Promise((resolve) => hang.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${hang.address().port}/slow`;

async function cancel() {
  const controller = new AbortController();
  const request = fetch(url, { signal: controller.signal });   // the signal links the fetch to the controller

  controller.abort();                                          // in real code: after a timeout, or on the next keystroke
  try {
    await request;
  } catch (err) {
    console.log('cancelled     :', err.name);                  // → cancelled     : AbortError
  }
}

await cancel();
hang.close();
