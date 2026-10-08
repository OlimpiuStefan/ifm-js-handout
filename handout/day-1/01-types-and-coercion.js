// ═══════════════════════════════════════════════════════════════════
//  Day 1 · 01 · Types and coercion
//  Run:  node 01-types-and-coercion.js
//
//  What this file shows: let / const / var, typeof, how JavaScript converts
//  values on its own ("coercion"), == against ===, the six falsy values, and
//  the bug that comes from testing a value with "if (!value)".
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · let, const, var ──────────────────────────────────────────
// `let` can be reassigned, `const` cannot. `var` is the old keyword: it
// ignores block scope (see 03-this-and-closures.js). Use const by default,
// let when you really reassign, var never.
let age = 25;
const firstName = 'Alice';
var name = 'Bob';

const y = 5;
try {
  y = 15;                                       // reassigning a const throws
} catch (e) {
  console.log(e.message);                       // → Assignment to constant variable.
}

// ─── 2 · typeof, and its two surprises ────────────────────────────
console.log(typeof null);                       // → object     (a historical bug of the language)
console.log(typeof []);                         // → object     (an array is an object)
console.log(typeof function greet() {});        // → function

// ─── 3 · coercion: the language converts for you, not always the way you expect
console.log(10 + '5');                          // → "105"      + with a string on either side GLUES
console.log('10' - 5);                          // → 5          - has no string meaning, so it converts to numbers
console.log(10 == '10');                        // → true       == converts, then compares
console.log(10 === '10');                       // → false      === compares type AND value: use this one

console.log('' == 0);                           // → true       three results nobody can predict:
console.log('0' == 0);                          // → true       so == is out, with one exception below
console.log('' == '0');                         // → false

console.log(null == undefined);                 // → true       the one useful ==: "is it missing?"
console.log(null === undefined);                // → false

// ─── 4 · the six falsy values ─────────────────────────────────────
// Everything else is truthy, including '0', [] and {}.
console.log(Boolean(false), Boolean(0), Boolean(''), Boolean(null), Boolean(undefined), Boolean(NaN));
// → false false false false false false
console.log(Boolean('0'), Boolean([]), Boolean({}));
// → true true true

// ─── 5 · the bug: a reading of zero is a reading ──────────────────
// A pressure sensor that reads 0 bar is a real reading, and 0 is falsy.
// `if (!reading.value)` would throw it away, together with the missing ones.
// The right question is "is it missing?", and that is `== null`
// (null or undefined, nothing else).
const reading = { deviceId: 'PT-1042', value: 0 };
if (reading.value == null) console.log('No value');   // nothing printed: 0 is a value

// ─── 6 · || and ??: two different defaults ────────────────────────
// `||` replaces any falsy value. `??` replaces only null and undefined.
const username = '';
const displayName = username || 'Guest';
console.log(displayName);                       // → Guest      '' is falsy, so || replaced it

console.log({ v: 0 }.v ?? 20);                  // → 0          0 is a value: ?? keeps it
console.log({ v: 0 }.v || 20);                  // → 20         0 is falsy: || replaced it (the bug again)
