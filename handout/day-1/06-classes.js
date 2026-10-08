// ═══════════════════════════════════════════════════════════════════
//  Day 1 · 06 · Classes: private fields, inheritance, and the gauge
//  Run:  node 06-classes.js
//
//  What this file shows: a class with a private field (#), a subclass with
//  super(), and the Gauge from the exercise: a method handed to
//  addEventListener is kept as an arrow property so that `this` survives,
//  and destroy() can remove the very same function.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · a class with a private field ─────────────────────────────
class BankAccount {
  #balance;                                        // private: only this class's code can read it
  constructor(owner, startingBalance = 0) {
    this.owner = owner;                            // public
    this.#balance = startingBalance;
  }
  deposit(amount) {
    this.#balance += amount;
  }
  withdraw(amount) {
    if (amount > this.#balance) throw new Error('Insufficient funds');
    this.#balance -= amount;
  }
  getBalance() {
    return this.#balance;
  }
}

const acc = new BankAccount('Alice', 100);
acc.deposit(50);
console.log(acc.getBalance());                     // → 150
// acc.#balance                                    // SyntaxError: private field

// ─── 2 · inheritance: extends, super() ────────────────────────────
class Sensor {
  constructor(id) {
    this.id = id;
  }
  describe() {
    return `sensor ${this.id}`;
  }
}

class PressureSensor extends Sensor {
  constructor(id, unit) {
    super(id);                                     // call the parent constructor before touching `this`
    this.unit = unit;
  }
  describe() {
    return `${super.describe()} in ${this.unit}`;  // super.method(): the parent's version
  }
}

console.log(new PressureSensor('PS-0310', 'bar').describe());   // → sensor PS-0310 in bar

// Composition over inheritance: prefer handing an object the pieces it needs
// (a notifier, a logger, a store) over deep class hierarchies. One level of
// extends, as above, is fine; three levels is where the trouble starts.

// ─── 3 · the exercise: a Gauge that keeps `this` and can be destroyed
// Analogue gauge: a needle on a half dial, from min to max. Click it to log the current value.
export class Gauge {
  constructor(el, { min = 0, max = 100, unit = 'C' } = {}) {
    this.el = el;
    this.min = min;
    this.max = max;
    this.unit = unit;
    this.value = min;
    // The handler is an arrow kept on the instance: `this` is this gauge whoever
    // calls it later, and destroy() can hand the SAME function back to removeEventListener.
    this.onClick = () => console.log(`${this.unit}: ${this.value}`);
  }

  setValue(v) {
    this.value = v;
    const pct = (v - this.min) / (this.max - this.min);
    const needle = this.el.querySelector('.needle');
    if (needle) needle.style.transform = `rotate(${pct * 180 - 90}deg)`;
  }

  mount() {
    this.el.addEventListener('click', this.onClick);
  }

  destroy() {
    this.el.removeEventListener('click', this.onClick);   // works only because it is the same function object
  }
}

// A stand-in element, so the file runs in Node without a browser.
const el = new EventTarget();
el.querySelector = () => null;

const g = new Gauge(el, { min: 0, max: 100, unit: 'C' });
g.mount();
g.setValue(42);
el.dispatchEvent(new Event('click'));              // → C: 42
g.setValue(99);
el.dispatchEvent(new Event('click'));              // → C: 99
g.destroy();
el.dispatchEvent(new Event('click'));              // nothing: the listener is gone
