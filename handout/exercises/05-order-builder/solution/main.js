// ═══════════════════════════════════════════════════════════════════
//  Day 3 · Order Builder: state, events, render, and an async save
//  Run:  node server.js   →  http://localhost:3998
//        node server.js --down   makes POST /api/orders answer 503
//
//  The loop of the whole page:
//
//      event  ──►  store.set(new state)  ──►  'change'  ──►  render(state)
//
//  Handlers never touch the DOM. They compute the next state. Render is the
//  only function that writes to the page, and it draws the WHOLE order from
//  the state every time.
// ═══════════════════════════════════════════════════════════════════
import { Store } from './store.js';

const title = document.querySelector('#title');
const items = document.querySelector('#items');
const total = document.querySelector('#total');
const save = document.querySelector('#save');
const saveStatus = document.querySelector('#saveStatus');

// ─── 1 · the state ────────────────────────────────────────────────
const store = new Store({
  order: {
    id: 1842,
    items: [
      { id: 'A1', name: 'Coffee beans', price: 12, qty: 2 },
      { id: 'B4', name: 'Milk', price: 3, qty: 1 },
      { id: 'C7', name: 'Filters', price: 5, qty: 3 },
    ],
  },
});

// ─── 2 · render: state in, DOM out ────────────────────────────────
function render(order) {
  title.textContent = `Order ${order.id}`;

  const fragment = document.createDocumentFragment();     // build off-screen, insert once
  for (const item of order.items) {
    const row = document.createElement('div');
    row.className = 'item';
    row.dataset.itemId = item.id;                         // the id the click handler will read back

    const name = document.createElement('span');
    name.textContent = item.name;

    const price = document.createElement('span');
    price.textContent = item.price;

    const minus = document.createElement('button');
    minus.className = 'minus';
    minus.textContent = '-';

    const quantity = document.createElement('span');
    quantity.textContent = item.qty;

    const plus = document.createElement('button');
    plus.className = 'plus';
    plus.textContent = '+';

    const remove = document.createElement('button');
    remove.className = 'remove';
    remove.textContent = 'remove';

    row.append(name, price, minus, quantity, plus, remove);
    fragment.append(row);
  }
  items.replaceChildren(fragment);

  const totalValue = order.items.reduce((acc, item) => acc + item.price * item.qty, 0);
  total.textContent = `Total: ${totalValue}`;
}

// ─── 3 · one listener for all the buttons (delegation) ───────────
// The rows are rebuilt on every render, so a listener per button would be
// lost each time. The #items container is stable: listen there, once.
items.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const row = button.closest('[data-item-id]');
  if (!row) return;

  const id = row.dataset.itemId;
  const current = store.state.order;

  // Each branch builds the NEXT order as a new object: the spread copies the
  // order, map returns a new items array, and the one changed item is a copy
  // too. The current state is never mutated.
  if (button.matches('.plus')) {
    store.set({
      order: {
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)),
      },
    });
  }

  if (button.matches('.minus')) {
    store.set({
      order: {
        ...current,
        items: current.items.map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty - 1) } : item)),
      },
    });
  }

  if (button.matches('.remove')) {
    store.set({
      order: { ...current, items: current.items.filter((item) => item.id !== id) },
    });
  }
});

// ─── 4 · the wiring: every change renders ─────────────────────────
store.addEventListener('change', (event) => render(event.detail.order));
render(store.state.order);                                // the first draw

// ─── 5 · save the order asynchronously ────────────────────────────
// The contract, from server.js:
//   POST /api/orders  body: the order as JSON
//     201 { saved: true, orderId, total, savedAt }    400 invalid    503 service down
save.addEventListener('click', async () => {
  save.disabled = true;                                   // no double submit while the request is in flight
  saveStatus.textContent = 'Saving...';
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(store.state.order),
    });
    if (!res.ok) throw new Error(`${res.status}`);        // fetch does not reject on 4xx/5xx: check res.ok
    const result = await res.json();
    saveStatus.textContent = `Saved order ${result.orderId}, total ${result.total}, at ${result.savedAt}`;
  } catch (err) {
    saveStatus.textContent = `Save failed: ${err.message}`;   // an expected failure, with a deliberate response
  } finally {
    save.disabled = false;                                // runs either way
  }
});
