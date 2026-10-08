// ═══════════════════════════════════════════════════════════════════
//  Day 1 · 04 · Collections: arrays, objects as dictionaries, map / filter / reduce
//  Run:  node 04-collections.js     (Node 21 or later, for Object.groupBy)
//
//  What this file shows: for...of against for...in, the spread for copies and
//  defaults, the two ways to read a property, the three methods that replace
//  most loops (map, filter, reduce) and how they chain, a frozen "enum",
//  sorting a copy with toSorted, grouping, and some / every / find.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · for...of gives values, for...in gives keys ───────────────
const ids = ['PT-1042', 'VS-0071', 'PT-1043'];
ids.push('PT-1044');

for (const id of ids) console.log('of', id);       // → of PT-1042 ...   the values: this is the one for arrays
for (const key in ids) console.log('in', key);     // → in 0, in 1 ...   the keys, as strings: for objects, not arrays

// ─── 2 · the spread: a copy with one more field, and defaults ────
const r = { deviceId: 'PT-1042', value: 234 };
const copy = { ...r, state: 'CRITICAL' };
console.log(copy);                                 // → { deviceId: 'PT-1042', value: 234, state: 'CRITICAL' }
const defaults = { state: 'OK', value: 23 };
console.log({ ...defaults, ...r });                // → { state: 'OK', value: 234, deviceId: 'PT-1042' }
                                                   //   the later spread wins: r's value overrides the default

// ─── 3 · two ways to read a property ──────────────────────────────
const person = { name: 'Alice', age: 25, 'favorite color': 'blue' };
console.log(person.name);                          // → Alice     the dot: when you know the name
console.log(person['name']);                       // → Alice     the brackets: the same thing
const whichOne = 'age';
console.log(person[whichOne]);                     // → 25        the brackets take a variable
console.log(person['favorite color']);             // → blue      or a name with a space in it

// ─── 4 · map, filter, reduce ──────────────────────────────────────
// map:    one in, one out, same length, transformed
// filter: keep the ones the test says yes to
// reduce: fold everything into one value (the 0 is the starting value)
const numbers = [1, 2, 3, 4, 5, 6];
const isEven = (num) => num % 2 === 0;
console.log(numbers.map((n) => n * 2));            // → [ 2, 4, 6, 8, 10, 12 ]
console.log(numbers.filter(isEven));               // → [ 2, 4, 6 ]
console.log(numbers.reduce((sum, n) => sum + n, 0)); // → 21

// They chain, because each one returns an array (reduce returns the value).
console.log(
  numbers
    .filter(isEven)
    .map((n) => n * 2)
    .reduce((sum, n) => sum + n, 0),
);                                                 // → 24

// ─── 5 · a frozen object as an enum, and a pipeline on readings ──
const readings = [
  { deviceId: 'PT-1042', value: 91, unit: 'C' },
  { deviceId: 'VS-0071', value: 60, unit: 'mm/s' },
  { deviceId: 'PT-1042', value: 97, unit: 'C' },
  { deviceId: 'PS-0310', value: null, unit: 'bar' },
];

// Object.freeze: nobody can add a fourth state or rename one by mistake.
const STATE = Object.freeze({ OK: 'OK', WARNING: 'WARNING', CRITICAL: 'CRITICAL' });
const SEVERITY = Object.freeze({ OK: 0, WARNING: 1, CRITICAL: 2 });

const classify = (reading) =>
  reading.value > 95 ? STATE.CRITICAL
  : reading.value > 50 ? STATE.WARNING
  : STATE.OK;

const alarms = readings
  .filter((r) => r.value != null)                  // drop the missing ones (== null: null or undefined, NOT 0)
  .map((r) => ({ ...r, state: classify(r) }))      // a new object per reading, with its state
  .filter((r) => r.state !== STATE.OK);            // keep the alarms
console.log(alarms);
// → [ { deviceId: 'PT-1042', value: 91, unit: 'C', state: 'WARNING' },
//     { deviceId: 'VS-0071', value: 60, unit: 'mm/s', state: 'WARNING' },
//     { deviceId: 'PT-1042', value: 97, unit: 'C', state: 'CRITICAL' } ]

console.log([1, 2].map((n) => ({ value: n })));    // → [ { value: 1 }, { value: 2 } ]   an arrow returning an object

// ─── 6 · sort a COPY ──────────────────────────────────────────────
// .sort() reorders the array in place; .toSorted() returns a sorted copy.
// The comparator returns negative / zero / positive, like IComparer.
const values = [4, 2, 3, 7, 1];
console.log(values.toSorted((a, b) => a - b));     // → [ 1, 2, 3, 4, 7 ]
console.log(values);                               // → [ 4, 2, 3, 7, 1 ]   untouched

const worstFirst = alarms.toSorted((a, b) => SEVERITY[b.state] - SEVERITY[a.state]);
console.log(worstFirst.map((a) => `${a.deviceId} ${a.state}`));   // → [ 'PT-1042 CRITICAL', 'PT-1042 WARNING', 'VS-0071 WARNING' ]

// ─── 7 · group, and ask questions of a list ───────────────────────
const grouped = Object.groupBy(readings, (reading) => reading.deviceId);   // { 'PT-1042': [...], 'VS-0071': [...], ... }
console.log(Object.keys(grouped));                 // → [ 'PT-1042', 'VS-0071', 'PS-0310' ]

console.log(readings.some((r) => r.value == null));    // → true      at least one missing?
console.log(readings.every((r) => r.value != null));   // → false     all present?
console.log(readings.find((r) => r.value > 95));       // → { deviceId: 'PT-1042', value: 97, unit: 'C' }   the first match, or undefined
