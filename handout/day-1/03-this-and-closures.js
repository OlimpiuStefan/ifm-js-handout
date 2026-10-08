// ═══════════════════════════════════════════════════════════════════
//  Day 1 · 03 · Functions, `this`, arrow functions, closures
//  Run:  node 03-this-and-closures.js
//
//  What this file shows: a function is a value; var against let; `this` is
//  decided by HOW a function is called, not where it was written; arrow
//  functions have no `this` of their own; how to hand a method over as a
//  callback without losing `this` (an arrow, or bind); and closures, a
//  function that remembers the variables of the place it was created in.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · a function is a value, and `this` is whatever is before the dot
function report() {
  return `reading from ${this.id}`;
}
const press = { id: 'PT-1042', report };          // the same function, stored in two objects
const conveyor = { id: 'VS-0071', report };

console.log(typeof report);                        // → function
console.log(press.report === conveyor.report);     // → true      one function, not two
console.log(press.report());                       // → reading from PT-1042
console.log(conveyor.report());                    // → reading from VS-0071

// ─── 2 · var ignores blocks, let does not ─────────────────────────
function testVar() {
  if (true) {
    var message = 'I used var';
  }
  console.log(message);                            // → I used var    var leaks out of the if
}
function testLet() {
  if (true) {
    let message = 'I used let';
  }
  console.log(message);                            // → ReferenceError: message is not defined
}
testVar();
try {
  testLet();
} catch (error) {
  console.error(error.message);
}

// ─── 3 · a plain call has no object in front of the dot ──────────
// In a module (this file), `this` in a plain function call is undefined.
function sayHello() {
  console.log(`Hello, ${this?.name}`);
}
sayHello();                                        // → Hello, undefined

function calculateRectangleArea(width, height) {
  console.log(this);                               // → undefined
  return width * height;
}
console.log(calculateRectangleArea(5, 10));        // → 50

const subtract = function (a, b) {                 // a function expression: the same thing, stored in a const
  console.log(this);                               // → undefined
  return a - b;
};
console.log(subtract(10, 5));                      // → 5

// ─── 4 · arrow functions ──────────────────────────────────────────
console.log(((num) => num % 2 === 0)(4));          // → true     written and called in one go

const isEven2 = function (num) {                   // the long form
  return num % 2 === 0;
};
console.log(isEven2(4));                           // → true

const items = ['PT-1042', 'VS-0071', 'PT-1043'];
items.forEach((item) => console.log(item));        // the usual place for an arrow: a callback

const add = (a, b) => a + b;                       // one line: the return is implied
console.log(add(3, 4));                            // → 7

const area = (radius) => {                         // a body with braces: return is explicit
  const pi = 3.14159;
  return pi * radius * radius;
};
console.log(area(5));                              // → 78.53975

const broken = (name) => ({                        // returning an object literal: wrap it in ( )
  name: name,                                      // without them, { } is read as a block
});
console.log(broken('Alice'));                      // → { name: 'Alice' }

// ─── 5 · `this` in a method, and why an arrow method does not work
const person = {
  name: 'Alice',
  greet: function () {
    console.log(`Hello, ${this.name}`);
  },
};
person.greet();                                    // → Hello, Alice    person is before the dot

const dog = {
  name: 'Fido',
  speakv1: function () {
    console.log(`Woof, I'm ${this.name}`);
  },
  speakv2: () => console.log(`Woof, I'm ${this?.name}`),   // an arrow has NO this of its own
};
dog.speakv1();                                     // → Woof, I'm Fido
dog.speakv2();                                     // → Woof, I'm undefined

// ─── 6 · the method that loses its object ─────────────────────────
class Gauge {
  constructor(id) {
    this.id = id;
    this.value = 42;
  }
  report() {
    console.log(`Reporting for ${this.id}: ${this.value}`);
  }
}

const g = new Gauge('PT-1042');
g.report();                                        // → Reporting for PT-1042: 42

const loose = g.report;                            // the function alone, without its object
try {
  loose();                                         // nothing before the dot: this is undefined
} catch (error) {
  console.error(error.message);                    // → Cannot read properties of undefined (reading 'id')
}

// This is exactly what happens when you hand a method to addEventListener:
// the browser calls it later, with nothing before the dot.
const button = new EventTarget();                  // a stand-in for a DOM element, so the file runs in Node
button.addEventListener('click', () => g.report()); // ✅ the arrow calls the method the normal way, g.report()
button.dispatchEvent(new Event('click'));          // → Reporting for PT-1042: 42

// ─── 7 · the two ways to keep `this`: an arrow, or bind ──────────
const sensor = {
  id: 'PT-1042',
  value: 42,
  report() {
    console.log(`Reporting for ${this.id}: ${this.value}`);
  },
};

const bound = sensor.report.bind(sensor);          // bind: a NEW function with this fixed for ever (the older way)
bound();                                           // → Reporting for PT-1042: 42
const arrow = () => sensor.report();               // an arrow that calls it the normal way (the usual way today)
arrow();                                           // → Reporting for PT-1042: 42

// ─── 8 · closures: a function remembers where it was created ─────
function makeCounter() {
  let n = 0;                                       // this variable lives on after makeCounter returns
  return () => ++n;                                // because the returned function can still see it
}

const next = makeCounter();
console.log(next(), next(), next());               // → 1 2 3

function attachCounter(el, id) {
  let count = 0;                                   // one count per attachCounter call
  el.addEventListener('click', () => {
    count++;
    console.log(`Clicked ${count} times on ${id}`);
  });
}

const counted = new EventTarget();
attachCounter(counted, 'PT-1042');
counted.dispatchEvent(new Event('click'));         // → Clicked 1 times on PT-1042
counted.dispatchEvent(new Event('click'));         // → Clicked 2 times on PT-1042

// A closure sees the variable, not a copy of its value at the time.
let state = 'OK';
const readState = () => state;
state = 'CRITICAL';
console.log(readState());                          // → CRITICAL

// A closure keeps everything it can see alive. A big payload captured by a
// handler that is never removed stays in memory as long as the handler does.
function attachPayload(bigThing) {
  const payload = new Array(250_000).fill('x');    // ~1 MB
  return () => `${bigThing.id} ${payload.length}`;
}
const handler = attachPayload({ id: 'PT-1042' });
console.log(handler());                            // → PT-1042 250000
// window.addEventListener('resize', handler);     // in a browser: that 1 MB now lives as long as the window

// ─── 9 · a component with a closure: setValue and destroy ────────
// The function creates its state (value, onClick) and hands back an object
// that can change it and clean it up. Nothing else can reach inside.
function createGauge(el, unit) {
  let value = 0;
  const onClick = () => console.log(`${unit}: ${value}`);
  el.addEventListener('click', onClick);
  return {
    setValue: (v) => (value = v),
    destroy: () => el.removeEventListener('click', onClick),   // the SAME function is handed back, so it can be removed
  };
}

const el = new EventTarget();
const gauge = createGauge(el, 'C');
gauge.setValue(42);
el.dispatchEvent(new Event('click'));              // → C: 42
gauge.destroy();
el.dispatchEvent(new Event('click'));              // nothing: the listener is gone

// ─── 10 · the same two rules, once more ───────────────────────────
const account = {
  owner: 'Ana',
  normal() {
    return this.owner;                             // this = account, because account.normal()
  },
  arrow: () => {
    return this?.owner;                            // an arrow has no this: undefined here
  },
};
console.log(account.normal());                     // → Ana
console.log(account.arrow());                      // → undefined

const user = {
  name: 'Claudia',
  greet() {
    console.log(`Hello ${this.name}`);
  },
};
const button2 = new EventTarget();
button2.addEventListener('click', () => user.greet());   // hand over an arrow, call the method inside it
button2.dispatchEvent(new Event('click'));         // → Hello Claudia

// A listener you can remove later: keep the function, hand back a cleanup.
function attachClicks(el, name) {
  let count = 0;
  const onClick = () => {
    count++;
    console.log(`${name} ${count}`);
  };
  el.addEventListener('click', onClick);
  return () => el.removeEventListener('click', onClick);
}

const button3 = new EventTarget();
const cleanup = attachClicks(button3, 'save');
button3.dispatchEvent(new Event('click'));         // → save 1
button3.dispatchEvent(new Event('click'));         // → save 2
cleanup();
button3.dispatchEvent(new Event('click'));         // nothing
