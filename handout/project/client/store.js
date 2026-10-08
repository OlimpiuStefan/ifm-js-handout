// One place holds the state of the page.
//
// The store is an EventTarget, so it is listened to exactly like a DOM
// element. The state is frozen and replaced, never edited in place, and
// set() is the only way in. "The Store remembers. Render draws."
export class Store extends EventTarget {
  #state;

  constructor(initial) {
    super();
    this.#state = Object.freeze({ ...initial });
  }

  get state() {
    return this.#state;
  }

  set(change) {
    this.#state = Object.freeze({ ...this.#state, ...change });
    this.dispatchEvent(new CustomEvent('change', { detail: this.#state }));
  }
}
