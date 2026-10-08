// The Store from the course, as it is in the project: client/store.js. Provided.
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
