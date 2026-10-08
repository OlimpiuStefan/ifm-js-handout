// ═══════════════════════════════════════════════════════════════════
//  Day 2 · 04 · fetch, JSON and the contract
//  Run:  node 04-fetch-and-json.js      (needs internet for section 4)
//
//  What this file shows: fetch does NOT reject on a 404, you must check
//  res.ok yourself; JSON.stringify / JSON.parse, and the values JSON
//  silently destroys (Date, undefined, functions); and the same request
//  written three ways: callback, .then, async/await.
// ═══════════════════════════════════════════════════════════════════
import { createServer } from 'node:http';

// A tiny local API, so this file runs without the project service.
const api = createServer((req, res) => {
  if (req.url === '/api/devices/PT-1042/reading') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ deviceId: 'PT-1042', value: 97.4, unit: 'C', at: '2026-10-06T09:00:00Z' }));
  }
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'no such device' }));
});
await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${api.address().port}`;

// ─── 1 · fetch does not treat a 404 as an error ───────────────────
// fetch rejects only when the request could not be made at all (no
// network, DNS, aborted). A 404 or a 500 is a successful HTTP exchange
// with a bad answer, so the promise RESOLVES. Check res.ok, always.
const res = await fetch(`${BASE}/api/devices/XX-9999/reading`);
console.log(await res.json());                            // → { error: 'no such device' }   the body parsed fine
console.log(res.status);                                  // → 404
console.log(res.ok);                                      // → false      ok means status 200 to 299

// The shape to use everywhere: one helper, one check.
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} on ${url}`);   // turn a bad answer into an error, here, once
  return res.json();
}

try {
  await getJson(`${BASE}/api/devices/XX-9999/reading`);
} catch (err) {
  console.log('getJson:', err.message);                   // → getJson: 404 on http://127.0.0.1:.../api/devices/XX-9999/reading
}

// ─── 2 · JSON: a string in, a string out ──────────────────────────
const text = JSON.stringify({ deviceId: 'PT-1042', value: '97.4' });
console.log(text);                                        // → {"deviceId":"PT-1042","value":"97.4"}   a string
const obj = JSON.parse(text);
console.log(obj.deviceId);                                // → PT-1042                                 an object again

// ─── 3 · what JSON silently destroys ──────────────────────────────
// JSON has strings, numbers, booleans, null, arrays and objects. Nothing else.
const x = {
  at: new Date('2026-10-06T09:00:00Z'),                   // a Date      → becomes a string
  missing: undefined,                                     // undefined   → the key disappears
  calculate() {},                                         // a function  → the key disappears
};
const copy = JSON.parse(JSON.stringify(x));
console.log(copy);                                        // → { at: '2026-10-06T09:00:00.000Z' }
console.log(copy.at instanceof Date);                     // → false      it is a string now; new Date(copy.at) brings it back
// So JSON.parse(JSON.stringify(obj)) is a deep copy ONLY for plain data.

// ─── 4 · the contract ─────────────────────────────────────────────
// What comes over the wire is whatever the server sent. The field names
// and types are an agreement between the two sides: the contract. Write it
// down, and check it where the data enters (see day 3, errors, the boundary).
//
//   GET /api/devices/:id/reading
//     200  { deviceId: string, value: number, unit: string, at: ISO-8601 string }
//     404  { error: string }
const reading = await getJson(`${BASE}/api/devices/PT-1042/reading`);
console.log(reading);                                     // → { deviceId: 'PT-1042', value: 97.4, unit: 'C', at: '2026-10-06T09:00:00Z' }
api.close();

// ─── 5 · the same request, three ways (practice 01) ───────────────
// Needs internet. The callback style is how it was done before promises;
// the .then style and async/await are the same thing in two spellings.
const URL = 'https://swapi.dev/api/people/1/';

function fetchCharacterData(callback) {                   // a · callback: the caller hands in what to do with the result
  fetch(URL)
    .then((response) => response.json())
    .then((data) => callback(data));
}

function fetchDataPromise() {                             // b · .then chain
  return fetch(URL)
    .then((response) => response.json())
    .then((data) => data.name);
}

async function fetchDataAsyncAwait() {                    // c · async/await
  const response = await fetch(URL);
  const data = await response.json();
  return data.name;
}

try {
  fetchCharacterData((data) => console.log('callback :', data.name));
  console.log('then     :', await fetchDataPromise());
  console.log('await    :', await fetchDataAsyncAwait());
  // → Luke Skywalker, three times
} catch (err) {
  console.log('no internet, or swapi.dev is down:', err.message);
}
