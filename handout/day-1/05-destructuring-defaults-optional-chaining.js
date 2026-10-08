// ═══════════════════════════════════════════════════════════════════
//  Day 1 · 05 · Optional chaining, destructuring, default parameters
//  Run:  node 05-destructuring-defaults-optional-chaining.js
//
//  What this file shows: `?.` for a path that may not exist, taking fields
//  out of an object by name (destructuring), nested destructuring, renaming,
//  defaults, and default parameters on functions. Then the exercise: the same
//  function written the 2014 way and the modern way, same behaviour.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · optional chaining ────────────────────────────────────────
// `a?.b` is undefined when a is null or undefined, instead of throwing.
// Use it for fields that are genuinely optional, not to hide bugs.
const policy = {
  number: 'P001',
  holder: { name: 'John Doe', city: 'Boston' },
};
console.log(policy.holder.phone?.number);          // → undefined    no phone, no exception

const reading = {
  deviceId: 'PT-1042',
  value: 97,
  meta: { unit: 'C' },
  alarms: [
    { at: '2026-09-03T14:32:07Z', state: 'WARNING' },
    { at: '2026-09-03T14:33:11Z', state: 'CRITICAL' },
  ],
};
console.log(reading?.missing?.unit);               // → undefined

// ─── 2 · destructuring: fields out of an object, by name ─────────
const person = { name: 'Alice', age: 25 };
const { name, age } = person;                      // two consts, taken off person
console.log(name, age);                            // → Alice 25

const { meta: { unit: metaUnit } } = reading;      // nested: reading.meta.unit, named metaUnit
console.log(metaUnit);                             // → C

const { unit = 'C' } = reading;                    // a default, used only when the field is undefined
console.log(unit);                                 // → C           reading has no top-level unit

const frame = { deviceId: 'VS-0071', value: 12, meta: { unit: 'mm/s' } };
const {
  deviceId: device,                                // rename: frame.deviceId → device
  value: amount = 0,                               // rename and default
  meta: { unit: measuredIn = 'C' } = {},           // nested, with a default for meta itself
} = frame;
console.log(device, amount, measuredIn);           // → VS-0071 12 mm/s

// ─── 3 · default parameters ───────────────────────────────────────
function greet(name = 'Guest') {
  return `Welcome, ${name}`;
}
console.log(greet());                              // → Welcome, Guest
console.log(greet('Ana'));                         // → Welcome, Ana

const fmt = (value, unit, label = `${value} ${unit}`) => label;   // a default can use the earlier parameters
console.log(fmt(21, 'C'));                         // → 21 C

// ─── 4 · the exercise: modernise without changing behaviour ──────
const STATE = Object.freeze({ OK: 'OK', WARNING: 'WARNING', CRITICAL: 'CRITICAL' });

// As shipped: var, one assignment per property, a loose string for the state.
function toViewShipped(reading) {
  if (reading.value == null) return null;

  var label = reading.name ? reading.name : reading.deviceId;

  var out = {};
  out.id = reading.deviceId;
  out.label = label;
  out.unit = reading.unit;
  out.value = reading.value;
  out.state = reading.state || 'OK';

  return out;
}

// The same function: destructuring, the object built in the return, STATE.OK instead of 'OK'.
function toViewClean(reading) {
  if (reading.value == null) return null;
  const { deviceId, name, value, unit, state } = reading;
  return {
    id: deviceId,
    label: name || deviceId,
    unit,                                          // shorthand for unit: unit
    value,
    state: state || STATE.OK,
  };
}

const r = { deviceId: 'PT-1042', value: '97.4', unit: 'C' };
console.log(toViewShipped(r));                     // → { id: 'PT-1042', label: 'PT-1042', unit: 'C', value: '97.4', state: 'OK' }
console.log(toViewClean(r));                       // → the same object

// Destructuring in the parameter list, with defaults, for an options object:
function createGauge({ min = 0, max = 100, unit = 'C' } = {}) {   // `= {}` so createGauge() with nothing works
  return { min, max, unit };
}
console.log(createGauge());                        // → { min: 0, max: 100, unit: 'C' }
console.log(createGauge({ max: 10 }));             // → { min: 0, max: 10, unit: 'C' }
