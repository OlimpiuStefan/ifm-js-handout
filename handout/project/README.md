# Production monitor

The project from the course: a Node.js server that serves an API and the dashboard page
that reads it. One process, one origin, no framework on either side.

## Run it

```
npm ci                 install exactly what the lockfile says
npm run dev            the server          http://localhost:3000
npm test               the tests (node --test)
npm run lint           the linter (eslint)
npm run build          dist/bundle.js and its source map (esbuild)
npm run verify         lint, test and build, in that order
```

In a second terminal, with the server running, `node tools/load-devices.js` loads all twelve
devices through the API and prints them as a table, the dead one as `null`.

## The files

```
api/src/
  server.js        the API routes and the static files of the page; one correlation id per
                   request, on every log line and in the x-correlation-id header
  store.js         twelve devices and their readings, in memory
  normalize.js     a raw frame becomes the transport shape (value as string, ISO date)
  log.js           one JSON object per line
  config.js        PORT
contract/
  reading.schema.json   the shape of one reading; api/src/contract.test.js checks the service
                        and the fixture against it
modules/           the code the page is made of; each module is handed an element, none looks
                   in the document itself
  rules.js         classify, activeAlarms (filter, map, filter, toSorted)
  equipment.js     toView, renderList (fragment, textContent), worstFirst (toSorted)
  alarm-list.js    the list as a module: init(el), update(el, state), a custom event
  gauge.js         the Gauge class: mount, setValue, destroy
  devices.js       loadAll with Promise.allSettled, httpReading with a timeout and a res.ok check
client/
  index.html       the page: owns the elements, hands them to start()
  app.js           the dashboard: event, store.set, 'change', render
  store.js         the Store: frozen state, set() dispatches 'change'
  config.js        READINGS_URL
fixtures/          sample readings, used by the contract test
tools/             load-devices.js
```

Every `.test.js` sits next to the file it tests, and `npm test` finds them all.

## What happens when you open the page

1. The browser asks for `/`. `server.js` sees it is not an API path and sends
   `client/index.html`.
2. The page's `<script type="module">` imports `client/app.js`, which imports the modules it
   needs. Module scripts run after the page is parsed, so the elements exist.
3. The page calls `start({ panel, status, gauge, selected })`. It hands over elements. Nothing
   in `app.js` or in the modules ever calls `document.querySelector`.
4. `start` creates the `Store` with the initial state, `{ readings: [], selectedId: null }`, and
   subscribes `render` to the store's `change` event. It mounts the gauge and calls
   `alarmList.init(panel)`, which registers one click listener on the panel.
5. `start` fetches `/api/readings`. `fetch` does not reject on a 404 or a 500, so `getReadings`
   checks `res.ok` and throws when the answer is bad. Then `store.set({ readings })`.
6. `set` builds a new frozen state object with the spread and dispatches `change`. `render`
   runs with that state and draws everything: the status line, the list, the gauge.
7. Every five seconds the same thing happens again: fetch, `store.set`, `change`, `render`.
   A refresh that times out is skipped; any other error is thrown, not hidden.

## What happens when you click a row

1. The click starts on the span you clicked and bubbles up to the panel, where the one
   listener from `alarmList.init` is. `event.target.closest('[data-device-id]')` finds the row.
2. The module does not know what "selected" means in this page, so it dispatches
   `alarm:selected` with the device id in `detail`.
3. `app.js` listens for that event and calls `store.set({ selectedId })`.
4. `change` fires, `render` runs, and the list is redrawn with the selected row marked and the
   gauge pointed at that device. The handler never touched the DOM; the state did.
5. Five seconds later the refresh redraws the page from the new readings and the same
   `selectedId`. That is why the selection survives: it lives in the store, not in the DOM.

```
click  ──►  alarm:selected  ──►  store.set(...)  ──►  'change'  ──►  render(state)
```

## What happens on the server for one request

1. `createServer` gets the request. A correlation id is generated once, here.
2. `request received` is logged as a JSON object with the method, the path and the id.
3. An `/api/...` path goes to `api(url)`, which returns `[status, body]`. Any other path goes to
   `file(pathname)`, which only serves `client/` and `modules/`, never `package.json`,
   `node_modules` or `dist/`.
4. `respond` is the one function that writes to the response: status, content type,
   `cache-control: no-store`, and the correlation id in `x-correlation-id`.
5. `request responded` is logged with the status. If a handler threw, `request failed` is
   logged with the error and the stack, and the client gets `500 { error: 'internal error' }`,
   a shape and not a stack trace.

Pick any id from the log and you have the whole story of that request.

## Practices to notice

- **Zero is a value.** `normalize`, `toView` and `activeAlarms` ask `== null`, never `!value`.
  The hydraulic main reports `0 bar` and it is drawn.
- **A new object, not a mutation.** `set` spreads into a fresh frozen object, `activeAlarms` and
  `worstFirst` use `toSorted`, `toView` builds a new object. The caller's data is never changed
  behind its back.
- **One fetch helper, one `res.ok` check.** `getReadings` and `httpReading` turn a bad answer into
  an error in one place. Everything above them deals with errors, not status codes.
- **`allSettled` for independent requests.** One dead sensor is one `null`, the other eleven
  are still there.
- **Build DOM from data.** `renderList` uses `createElement`, `textContent` and a fragment. No
  `innerHTML` with data we did not write. The lint rules keep `==`, `var` and empty `catch` out.
- **Catch what you can handle.** A timed-out refresh is skipped on purpose. A render error or a
  bad frame is not caught, because nobody can fix it from inside a `catch`.
- **The module contract.** `alarm-list.js` and `gauge.js` are handed an element, start with
  `init` or `mount`, and can be stopped. They report with a custom event or a method call and
  never decide what the page should do about it. The same files work in any page, or in a
  Blazor component through JS interop.
- **Logs are data.** One JSON object per line, with fields you can filter on, and one
  correlation id per request.
- **The contract is written down.** `contract/reading.schema.json`, and a test that fails when
  either side drifts.
