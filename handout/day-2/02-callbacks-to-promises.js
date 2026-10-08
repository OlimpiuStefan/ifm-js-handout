// ═══════════════════════════════════════════════════════════════════
//  Day 2 · 02 · From callbacks to promises to async/await
//  Run:  node 02-callbacks-to-promises.js
//
//  What this file shows: three dependent calls with callbacks (the
//  "callback hell"), the same thing as a .then chain, wrapping a
//  callback API in a Promise, async/await with try/catch, a wait()
//  helper, sequential await against Promise.all, and the trap of
//  map(async ...) which gives you promises, not values.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · three callback APIs, Node style: done(error, result) ────
function getUser(userId, done) {
  setTimeout(() => {
    if (!userId) return done(new Error('userId is required'));
    done(null, { id: userId, name: 'Ana' });
  }, 100);
}

function getOrders(userId, done) {
  setTimeout(() => {
    if (userId !== 1) return done(new Error('user not found'));
    done(null, [
      { id: 101, total: 120 },
      { id: 102, total: 80 },
    ]);
  }, 100);
}

function getOrderDetails(orderId, done) {
  setTimeout(() => {
    if (orderId !== 101) return done(new Error('order not found'));
    done(null, {
      id: 101,
      items: [
        { name: 'Keyboard', price: 70 },
        { name: 'Mouse', price: 50 },
      ],
    });
  }, 100);
}

// ─── 2 · callback hell ────────────────────────────────────────────
// Each step needs the result of the previous one, so each callback nests
// inside the last. Three levels in, and every level repeats the error check.
getUser(1, (error, user) => {
  if (error) return console.error(error);
  getOrders(user.id, (error, orders) => {
    if (error) return console.error(error);
    getOrderDetails(orders[0].id, (error, details) => {
      if (error) return console.error(error);
      console.log('callbacks :', details.items.length, 'items');   // → callbacks : 2 items
    });
  });
});

// ─── 3 · wrap a callback API in a Promise ("promisify") ──────────
// A Promise is an object that stands for a value that is not there yet.
// It is the JavaScript version of Task<T>. resolve(value) completes it,
// reject(error) fails it.
function readSensor(id, done) {
  setTimeout(() => done(null, { id, value: '42.0' }), 100);
}

function readSensorAsync(id) {
  return new Promise((resolve, reject) => {
    readSensor(id, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

const getUserAsync = (id) =>
  new Promise((resolve, reject) => getUser(id, (err, user) => (err ? reject(err) : resolve(user))));
const getOrdersAsync = (id) =>
  new Promise((resolve, reject) => getOrders(id, (err, orders) => (err ? reject(err) : resolve(orders))));
const getOrderDetailsAsync = (id) =>
  new Promise((resolve, reject) => getOrderDetails(id, (err, d) => (err ? reject(err) : resolve(d))));

// ─── 4 · the same three steps as a .then chain ────────────────────
// Flat, in reading order, and ONE catch at the end covers every step.
getUserAsync(1)
  .then((user) => getOrdersAsync(user.id))
  .then((orders) => getOrderDetailsAsync(orders[0].id))
  .then((details) => console.log('then chain:', details.items.length, 'items'))   // → then chain: 2 items
  .catch((err) => console.log('failed:', err.message));

getUserAsync()                                                                     // no id: the first step rejects
  .then((user) => getOrdersAsync(user.id))
  .catch((err) => console.log('failed    :', err.message));                        // → failed    : userId is required

readSensorAsync('PT-2344')
  .then((data) => console.log('then      :', data.value))                          // → then      : 42.0
  .catch((err) => console.log(err.message));

// ─── 5 · async / await: the same chain that reads like normal code ─
// `await` pauses THIS function and steps aside; the thread goes on with
// other work. It does not start a thread. Errors come out as exceptions,
// so try/catch works again.
async function showSensor(id) {
  try {
    const data = await readSensorAsync(id);
    console.log('await     :', data.value);                                        // → await     : 42.0
  } catch (err) {
    console.log(err.message);
  }
}
await showSensor('PT-23443');

// ─── 6 · a wait() helper: a Promise with no value, just time ──────
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
await wait(200);
console.log('waited 200 ms');

// ─── 7 · sequential await against Promise.all ────────────────────
const saveBothAsync = (a, b) =>
  new Promise((resolve) => setTimeout(() => resolve(`${a.id}+${b.id}`), 100));

// One after the other: the second read starts only when the first is done.
async function saveTwoReadings() {
  const a = await readSensorAsync('PT-234');              // 100 ms
  const b = await readSensorAsync('PT-324');              // then 100 ms more
  return saveBothAsync(a, b);
}

// At the same time: both reads start now, Promise.all waits for both.
async function parallelSave() {
  const [a, b] = await Promise.all([                      // 100 ms in total
    readSensorAsync('PT-234'),
    readSensorAsync('PT-324'),
  ]);
  return saveBothAsync(a, b);
}

let t = Date.now();
console.log(await saveTwoReadings(), `sequential, ${Date.now() - t} ms`);   // → PT-234+PT-324 sequential, ~300 ms
t = Date.now();
console.log(await parallelSave(), `parallel,   ${Date.now() - t} ms`);      // → PT-234+PT-324 parallel,   ~200 ms
// Rule: await in a row only when step two NEEDS step one. Otherwise start
// everything, then await Promise.all.

// ─── 8 · the trap: map(async) gives you promises ─────────────────
const ids = ['PT-1042', 'VS-0071'];
const promises = ids.map(async (id) => await readSensorAsync(id));
console.log(promises);                                    // → [ Promise { <pending> }, Promise { <pending> } ]
// An async function ALWAYS returns a promise, so map returns an array of
// promises. To get the values, await Promise.all on that array:
const readings = await Promise.all(ids.map((id) => readSensorAsync(id)));
console.log(readings.map((r) => r.id));                   // → [ 'PT-1042', 'VS-0071' ]
