// ═══════════════════════════════════════════════════════════════════
//  Day 3 · 07 · A reusable module: init, update, destroy
//  Run:  node 07-module-lifecycle.js      (a stand-in element, so it runs in Node)
//
//  The module contract. A host (a plain page, a Blazor component, anything)
//  gives the module an element and calls:
//     init(el, host)     start: listeners, timers, state
//     update(el, data)   new data arrived: redraw
//     destroy()          stop everything init started
//  The module never looks for its element itself and never knows who the
//  host is. That is why the same file runs unchanged in a plain page and in
//  a Blazor page (Blazor calls init by name through JS interop and hands it
//  the element reference).
//
//  Why destroy matters: in a single-page application the page is never
//  reloaded, so a listener or a timer that nobody stops keeps running, and
//  keeps alive everything its closure can see. Load and unload a view fifty
//  times without destroy and you have fifty timers.
// ═══════════════════════════════════════════════════════════════════

// What the module remembers between init and destroy: the element, the
// handler it registered, and the timer it started. Same idea as createGauge
// on day 1: keep the function, so you can hand the SAME one to removeEventListener.
let mounted = null;

export function init(el, host) {
  if (!el) throw new Error('init: no element');
  destroy();                                              // init twice: release the first mount first

  const onClick = (e) => host.notify('pointPicked', { at: e.at });
  el.addEventListener('click', onClick);

  const timer = setInterval(() => host.notify('tick', {}), 50);

  mounted = { el, onClick, timer };
}

export function update(el, data) {
  if (!mounted) return;                                   // not mounted: nothing to draw on
  el.value = data.value;                                  // in the browser: move the needle, set a text
}

// The host called init, so the host calls destroy. Safe to call twice.
export function destroy() {
  if (!mounted) return;
  mounted.el.removeEventListener('click', mounted.onClick);
  clearInterval(mounted.timer);
  mounted = null;
}

// ─── a host, so the file runs in Node ─────────────────────────────
const el = new EventTarget();                             // stands in for a DOM element
let ticks = 0;
const host = {
  notify: (what, detail) => (what === 'tick' ? ticks++ : console.log('host heard', what, detail)),
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

init(el, host);
update(el, { value: 42 });
el.dispatchEvent(Object.assign(new Event('click'), { at: 17 }));   // → host heard pointPicked { at: 17 }
await wait(120);
console.log('ticks while mounted :', ticks);              // → ticks while mounted : 2

destroy();
el.dispatchEvent(new Event('click'));                     // nothing: the listener is gone
const before = ticks;
await wait(120);
console.log('ticks after destroy :', ticks - before);     // → ticks after destroy : 0
destroy();                                                // safe to call twice
