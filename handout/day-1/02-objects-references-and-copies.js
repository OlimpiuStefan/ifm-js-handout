// ═══════════════════════════════════════════════════════════════════
//  Day 1 · 02 · Objects, references, mutation, copies
//  Run:  node 02-objects-references-and-copies.js
//
//  What this file shows: an object literal with nested data and a method,
//  object keys are strings, Object.freeze is shallow, two names can point at
//  one object, a function that changes its argument changes the caller's
//  object (a side effect), and how to return a copy instead with the spread.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · an object: values, nested objects, a list, a method ─────
const policy = {
  number: 'P001',                                              // a plain value
  holder: { name: 'John Doe', city: 'Boston' },                // an object inside an object
  claims: [                                                    // a list of objects
    { id: 'C1', amount: 250, settled: true },
    { id: 'C2', amount: 900, settled: false },
  ],
  describe() {                                                 // a method: `this` is the object it is called on
    return `${this.number} belongs to ${this.holder.name}`;
  },
};

console.log(policy.holder.city);                               // → Boston
console.log(policy.claims[1].amount);                          // → 900
console.log(policy.describe());                                // → P001 belongs to John Doe

// ─── 2 · keys are always strings ──────────────────────────────────
const grid = {};
grid[1] = 'one';
grid['1'] = 'one, again';                                      // the same key as 1
grid[{ x: 1 }] = 'an object';                                  // becomes the key "[object Object]"
console.log(grid);                                             // → { '1': 'one, again', '[object Object]': 'an object' }
console.log(Object.keys(grid));                                // → [ '1', '[object Object]' ]

// ─── 3 · Object.freeze is shallow ─────────────────────────────────
// Freeze stops writes on THIS object. Objects inside it are not frozen.
const cfg = { nested: { x: 0 } };
Object.freeze(cfg);
cfg.nested.x = 1;                                              // allowed: nested is another object
console.log(cfg.nested.x);                                     // → 1
try {
  cfg.nested = {};                                             // the frozen level: throws in a module (strict mode), silently ignored in old scripts
} catch (e) {
  console.log(e.message);                                      // → Cannot assign to read only property 'nested' of object '#<Object>'
}

// ─── 4 · two names, one object ────────────────────────────────────
// Assigning an object does not copy it. b1 and a1 are the same object.
const a1 = { v: 1 };
const b1 = a1;
b1.v = 99;
console.log(a1.v);                                             // → 99

// ─── 5 · a function that mutates its argument: a side effect ─────
// The caller's object is changed, whether the caller wanted it or not.
function flag(reading) {
  reading.state = 'CRITICAL';
  return reading;
}

const r1 = { deviceId: 'PT-1042', value: 234 };
const flagged = flag(r1);
console.log(r1.state);                                         // → CRITICAL    r1 was changed
console.log(flagged === r1);                                   // → true        it is the same object

// ─── 6 · good practice: return a copy, leave the input alone ─────
// The spread `...` copies every property into a new object, then we add one.
function flagCopy(reading) {
  return { ...reading, state: 'CRITICAL' };
}

const original = { deviceId: 'PT-1042', value: 234 };
const r2 = flagCopy(original);
console.log(r2.state);                                         // → CRITICAL
console.log(original.state);                                   // → undefined   the original is untouched

// ─── 7 · the spread is shallow too ────────────────────────────────
// `{ ...sensor }` copies the top level. `limits` inside is still the SAME object.
const sensor = { deviceId: 'PT-1042', limits: { warn: 50, crit: 95 } };
const copy = { ...sensor };
copy.deviceId = 'PT-1043';                                     // the copy has its own deviceId
copy.limits.warn = 60;                                         // ...but limits is shared
console.log(sensor.deviceId);                                  // → PT-1042
console.log(sensor.limits.warn);                               // → 60          the original changed

// To copy one level deeper, spread the inner object as well.
const safeCopy = { ...sensor, limits: { ...sensor.limits } };
safeCopy.limits.crit = 80;
console.log(sensor.limits.crit, safeCopy.limits.crit);         // → 95 80

// ─── 8 · the same lesson, inside a function ───────────────────────
const thresholds = { warn: 50, crit: 95 };
const reading = { deviceId: 'PT-1042', value: 97.4, limits: thresholds };

function withTighterLimit(r) {
  return { ...r, checked: true, limits: { ...r.limits, crit: 90 } };   // new object, new limits
}

const checked = withTighterLimit(reading);
console.log(reading.checked, thresholds.crit);                 // → undefined 95    nothing of the caller's changed
console.log(checked.checked, checked.limits.crit);             // → true 90
