// ═══════════════════════════════════════════════════════════════════
//  Day 2 · 01 · The event loop and callbacks
//  Run:  node 01-event-loop-and-callbacks.js
//
//  What this file shows: JavaScript has ONE thread. A function that takes a
//  callback returns at once, and the callback runs later, when the thread
//  is free. setTimeout(fn, 0) does not mean "now": it means "as soon as the
//  current code has finished". A busy loop blocks everything, timers
//  included. A callback-taking function returns nothing useful.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · a callback runs later ────────────────────────────────────
// readSensor hands the work to a timer and returns immediately. `done` is
// called one second later, from the event loop, when the call stack is empty.
function readSensor(id, done) {
  setTimeout(() => done(7), 1000);
}

console.log('1');
readSensor('PT-0234', (reading) => console.log('2', reading));
console.log('3');
// → 1
// → 3
// → 2 7          one second later

// Compare with a normal, synchronous call: the order would be 1, 2, 3, and
// nothing else could run during the one second the work takes.
//   console.log('1');
//   heavyFunction(readings);      // blocks the thread until it is finished
//   console.log('3');

// ─── 2 · setTimeout 0 is not "now" ────────────────────────────────
// The timer is ready after 0 ms, but its callback can only run once the
// current code has finished. A loop that spins for 300 ms delays it by 300 ms.
const t0 = Date.now();
setTimeout(() => {
  console.log(`timer fired at ${Date.now() - t0} ms`);     // → timer fired at ~300 ms
}, 0);

const end = Date.now() + 300;
while (Date.now() < end) { /* busy */ }                     // the thread is busy: nothing else runs

// The picture:
//
//   call stack        the function running right now, and who called it
//   Web APIs / Node   timers, fetch, file reads: work that happens OUTSIDE the thread
//   queue             callbacks whose work is finished, waiting for their turn
//   event loop        when the call stack is empty, move the next callback onto it
//
// In the browser the same thread also paints the screen, so a long loop
// freezes the page: no clicks, no repaint, until the loop is done.

// ─── 3 · the shape of an async function with a callback ──────────
function fetchData(performOperation) {
  console.log('Fetching data..');
  setTimeout(() => {
    const data = { id: 1, name: 'Alice' };
    performOperation(data);                                  // the callback gets the result
  }, 300);
}

fetchData((data) => console.log('Data received:', data));
console.log('heavy operation');
// → Fetching data..
// → heavy operation
// → Data received: { id: 1, name: 'Alice' }

// ─── 4 · a callback-taking function returns nothing ──────────────
// The result goes INTO the callback. The return value of readSensor2 is
// undefined, because the reading does not exist yet when it returns.
function readSensor2(id, done) {
  setTimeout(() => done({ id, value: '42.0' }), 300);
}

function showReading(reading) {
  console.log('reading is', reading.value);
}

readSensor2('PT-234', showReading);                          // a named function as the callback
readSensor2('PT-565', (reading) => console.log('reading is', reading.value));   // an arrow, same thing

const returned = readSensor2('PT043', showReading);
console.log('returned:', returned);                          // → returned: undefined
// That is the problem promises solve: a value you can hold on to NOW for a
// result that arrives LATER. See 02-callbacks-to-promises.js.
