// ═══════════════════════════════════════════════════════════════════
//  Day 3 · State in the page: the Store
//
//  One object holds the state of the page. Nothing but the render touches
//  the DOM. A change is a NEW frozen object (spread), never a mutation,
//  and every change dispatches a 'change' event so the page can redraw.
//  "The Store remembers. Render draws."
// ═══════════════════════════════════════════════════════════════════
export class Store extends EventTarget {                  // EventTarget: the same addEventListener as a DOM element
  #state;                                                 // private: the only way in is set()

  constructor(initial) {
    super();
    this.#state = Object.freeze({ ...initial });
  }

  get state() {
    return this.#state;                                   // read it anywhere; you cannot change it (frozen)
  }

  set(change) {
    this.#state = Object.freeze({ ...this.#state, ...change });   // copy, merge, freeze: a new object every time
    this.dispatchEvent(new CustomEvent('change', { detail: this.#state }));
  }
}
