// ═══════════════════════════════════════════════════════════════════
//  Day 3 · 04 · Errors: fix the bugs, handle the failures
//  Run:  node 04-errors.js
//
//  What this file shows: two failures that look the same in a catch and
//  need opposite answers; throw / try / catch / finally; the defensive
//  catch that hides a bug; rethrowing with context, and `cause`; a custom
//  error class and instanceof; the one catch that is right (text you did
//  not write); and the boundary: validate external data once.
//
//  The seven rules:
//    1. Programming errors → fix them.
//    2. Operational errors → handle them.
//    3. Catch only what you can actually handle.
//    4. Do not turn bugs into nulls.
//    5. If you add context, preserve the original error.
//    6. Branch on error type, code or properties, not on message text.
//    7. Validate external data once, at the boundary.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · two failures out of the same project ─────────────────────
// The fetch layer from day 2: a bad answer becomes an error, here, once.
const httpReading = (baseUrl, { fetcher = fetch } = {}) => async (id) => {
  const res = await fetcher(`${baseUrl}/api/devices/${id}/reading`);
  if (!res.ok) throw new Error(`${res.status} on ${id}`);
  return res.json();
};

// One · the flow meter FL-0909 is dead. The service answers 503 for it.
const deadSensor = async () => ({ ok: false, status: 503 });   // a fake fetch, so no server is needed
try {
  await httpReading('http://localhost:3000', { fetcher: deadSensor })('FL-0909');
} catch (e) {
  console.log('one:', e.name, '·', e.message);                 // → one: Error · 503 on FL-0909
}

// Two · the dashboard, on a morning when no reading has arrived yet.
const readings = [];
try {
  readings.at(-1).at.slice(11, 19);                           // readings.at(-1) is undefined
} catch (e) {
  console.log('two:', e.name, '·', e.message);                 // → two: TypeError · Cannot read properties of undefined (reading 'at')
}
// One: the world did something we knew it might. OPERATIONAL. The program
// needs an answer for it: a null, a hole in the table, a retry.
// Two: we did that. The line assumes there is always a last reading. A
// PROGRAMMING error. No catch makes the page right; somebody changes the line.
//
//   Error            the one you throw yourself                 → either
//   TypeError        wrong type, e.g. calling a non-function     → a bug, fix it
//   ReferenceError   using a variable that was never declared    → a bug, fix it

// ─── 2 · the four words ───────────────────────────────────────────
function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');            // throw: stop, and signal a failure
  return a / b;
}

try {
  console.log(divide(5, 0));                                   // try: code that may fail
} catch (err) {
  console.log(err.message);                                    // catch: a failure you understand   → Division by zero
} finally {
  console.log('cleanup');                                      // finally: runs either way           → cleanup
}

// ─── 3 · the defensive catch that hides a bug ─────────────────────
function processDefensive(reading) {
  try {
    return reading.meta.unit;                                  // meta is undefined: a TypeError, a bug
  } catch (err) {
    console.log(err.message);
    return null;                                               // ⚠️ the bug became a believable "no value"
  }
}
console.log('defensive:', processDefensive({ deviceId: 'PT-1042' }));
// → Cannot read properties of undefined (reading 'unit')
// → defensive: null
// The caller now thinks "no unit". Nobody fixes anything. Do not catch what
// you cannot handle; let a bug be loud.

// ─── 4 · rethrow: keep the failure, add what your layer knows ─────
async function readSensor(id) {
  if (id === 'PS-0310') throw new Error('connection timeout');
  return { id, value: '42' };
}

// a · the same error continues upward, with one property added
async function withContext(id) {
  try {
    return await readSensor(id);
  } catch (err) {
    err.deviceId = id;
    throw err;
  }
}

// b · a new error with a better sentence for this layer, the original kept in `cause`
async function withCause(id) {
  try {
    return await readSensor(id);
  } catch (err) {
    throw new Error(`Reading ${id} failed`, { cause: err });
  }
}

await withContext('PT-1042').then((r) => console.log('ok path    :', r.id));
await withContext('PS-0310').catch((e) => console.log('same error :', e.message, '| device:', e.deviceId));
await withCause('PS-0310').catch((e) => console.log('cause kept :', e.message, '<-', e.cause.message));
// → ok path    : PT-1042
// → same error : connection timeout | device: PS-0310
// → cause kept : Reading PS-0310 failed <- connection timeout
//
// When to catch:
//   can handle it?                 → catch
//   can add useful context?        → catch, then rethrow (or wrap with cause)
//   can do nothing useful?         → do not catch; let it reach someone who can
// Useful context is what the original error cannot know: which entity
// (deviceId, orderId), which operation (loading the dashboard), which
// boundary (database, external API), sometimes the correlation id.

// ─── 5 · a custom error, and branching on type ────────────────────
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function checkAge(age) {
  if (age < 18) throw new ValidationError('Age must be 18 or older');
  return 'Valid age';
}

try {
  console.log(checkAge(15));
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Validation failed:', err.message);          // → Validation failed: Age must be 18 or older
  } else {
    throw err;                                                 // not mine: hand it on, untouched
  }
}
//   bad      if (err.message.includes('timeout')) ...        the message is for humans
//   better   if (err instanceof TimeoutError) ...            type, code and properties are for programs
//   or       if (err.retryable) ...

// ─── 6 · the catch that is right: text you did not write ──────────
// We know exactly what failure to expect (the string is not JSON) and we
// have a deliberate answer (null, and a line in the log).
function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    console.log('Invalid JSON');
    return null;
  }
}
console.log(parseJSON('{"name": "Alice"}'));                   // → { name: 'Alice' }
console.log(parseJSON('Invalid JSON'));                        // → Invalid JSON, then null
//   expected failure + deliberate response   → the catch is useful
//   "something might go wrong" + null        → the catch is hiding something

// ─── 7 · the boundary: validate external data once ────────────────
//   OUTSIDE (untrusted)          THE BOUNDARY                  INSIDE (trusted)
//   a sensor frame               validate + normalise          a reading we trust:
//   an HTTP response      ───►   throw, naming the field  ───► every field there,
//   what a user typed                                          every type right
//                                nothing after the door checks again
const UNITS = ['C', 'bar', 'mm/s', '%', 'l/min'];

function parseFrame(raw) {
  if (raw.deviceId == null) throw new ValidationError('deviceId is missing');
  if (typeof raw.value !== 'number') throw new ValidationError(`value must be a number, got ${typeof raw.value}`);
  if (!Number.isFinite(raw.value)) throw new ValidationError(`value is not a measurement: ${raw.value}`);
  const at = new Date(raw.at);
  if (Number.isNaN(at.getTime())) throw new ValidationError(`at is not a timestamp: ${raw.at}`);
  if (!UNITS.includes(raw.unit)) throw new ValidationError(`unknown unit: ${raw.unit}`);
  return { deviceId: raw.deviceId, value: raw.value, unit: raw.unit, at: at.toISOString() };   // a NEW object, ours
}

const frames = [
  { deviceId: 'PT-1042', value: 97.4, unit: 'C', at: '2026-10-07T09:00:00Z' },        // good
  { value: 97.4, unit: 'C', at: '2026-10-07T09:00:00Z' },                             // a field is missing
  { deviceId: 'PT-1042', value: '97.4', unit: 'C', at: '2026-10-07T09:00:00Z' },      // the wrong type
  { deviceId: 'PT-1042', value: 97.4, unit: 'C', at: 'yesterday' },                   // a malformed timestamp
  { deviceId: 'PT-1042', value: 97.4, unit: 'furlongs', at: '2026-10-07T09:00:00Z' }, // an unknown unit
];
for (const raw of frames) {
  try {
    console.log('accepted', parseFrame(raw).deviceId);
  } catch (err) {
    console.log(`${err.name}: ${err.message}`);
  }
}
// → accepted PT-1042
// → ValidationError: deviceId is missing
// → ValidationError: value must be a number, got string
// → ValidationError: at is not a timestamp: yesterday
// → ValidationError: unknown unit: furlongs

// ─── 8 · at the process edge ──────────────────────────────────────
// If an error reaches the top and nobody can handle it, log it and let the
// process fail, rather than pretending everything is healthy. Node does
// that by default, and the default is right.
