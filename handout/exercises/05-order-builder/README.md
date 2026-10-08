# 05 · Order Builder

An order you can edit and save, built in four steps on one page. In the folder:

```bash
cd template        # or solution
node server.js     # → order builder on http://localhost:3998
```

| File | What it is |
|---|---|
| `index.html` | the page: a title, an empty `#items` box, a `#total` line, a **Save order** button and a `#saveStatus` line. Do not change it. |
| `store.js` | provided: the `Store` from the course. Step 3 uses it. |
| `server.js` | provided: serves the page AND is the API, `POST /api/orders`. `node server.js --down` makes the save fail, for step 4. |
| `main.js` | yours. |

The order, as data: id 1842, three items, each with `id`, `name`, `price`, `qty`.

## Step 1 · render the order

Write `render(order)`: `title.textContent` with the order id; for each item a `div.item` with
`dataset.itemId = item.id` and spans for the name, the price and the quantity, built with
`createElement` and `textContent`, collected in a `DocumentFragment`, then
`items.replaceChildren(fragment)`; the total with `reduce` over `price * qty`.

Done when: three rows, each with `data-item-id`, `Total: 42`, no `innerHTML`, and the total is
derived from the items, not stored anywhere.

## Step 2 · one listener for all the buttons

Add to each row a button `.minus`, the quantity, a button `.plus`, and a button `.remove`. Handle
all of them with ONE `items.addEventListener('click', ...)`: `event.target.closest('button')`, then
`button.closest('[data-item-id]')` for the row and its `dataset.itemId`, then `button.matches('.plus')`
and the other two, one `console.log` each.

Then answer: why does this listener still work after `render` replaces every row?

## Step 3 · events change state, state renders

```
button click    →  change the state
state change    →  render
render          →  change the DOM
```

Put the order in the `Store`: `new Store({ order: { ... } })`. In the listener,
`const current = store.state.order`, then one `store.set({ order: ... })` per button: `+` maps the
items and the matching one gets `qty + 1`; `-` the same with `Math.max(0, qty - 1)`; `remove`
filters the item out. New objects every time: `...current`, `...item`, `map`, `filter`. Never
`item.qty += 1`. Subscribe with `store.addEventListener('change', (event) => render(event.detail.order))`
and draw once with `render(store.state.order)`.

Then say out loud: where does the quantity live? (the state) Where does the total live? (nowhere, it
is calculated) Who changes the DOM? (`render`)

## Step 4 · save the order asynchronously

The contract of the server this page comes from:

```
POST /api/orders     body: the order, as JSON
  201  { saved: true, orderId, total, savedAt }
  400  { error: 'invalid JSON' }  or  { error: 'order needs at least one item' }
  503  { error: 'order service unavailable' }        with --down
```

The listener on `#save`, `async`: `save.disabled = true`, `saveStatus.textContent = 'Saving...'`;
`try` a `fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' },
body: JSON.stringify(store.state.order) })`, check `res.ok` and throw when it is false, then write
`Saved order ...`; `catch` writes `Save failed: ` and the message; `finally` enables the button again.

Then restart with `node server.js --down`, reload, click Save: the failure reaches the status line
and the button is usable again.

Then answer: why does the server calculate the total itself instead of trusting the one the page
sends? Why is `res.ok` checked, when `fetch` did not throw?
