# Introduction to JavaScript · Course notes

ifm · 5 to 7 October 2026 · three days

These notes summarise what we covered, in the order we covered it, with short examples. The
code we wrote together is in the folders next to this file, cleaned up and commented. Every
file states at the top how to run it, and the comments show the real output.

```
handout/
  package.json                      "type": "module", so every file is an ES module
  day-1/                            the language
    01-types-and-coercion.js
    02-objects-references-and-copies.js
    03-this-and-closures.js
    04-collections.js
    05-destructuring-defaults-optional-chaining.js
    06-classes.js
  day-2/                            async, and how data reaches the screen
    01-event-loop-and-callbacks.js
    02-callbacks-to-promises.js
    03-promise-all-allsettled-abort.js
    04-fetch-and-json.js
    practice/                       the three fetch exercises, plus local-server.js for the search
    dom/                            index.html + dom.js, open through a local server
  day-3/                            events, state, and what breaks in production
    events/                         index.html + events.js
    order-app/                      the Order Builder: node server.js, then http://localhost:3998
    03-debugging.js
    04-errors.js
    05-storage-localstorage-vs-httponly.js
    06-logging-correlation-id.js
    07-module-lifecycle.js
  project/                          the production monitor as we left it: see project/README.md
  exercises/                        the five practice exercises: statement, template, solution
```

Run a `.js` file with `node file.js`. Open an `index.html` through a local server (for example
`npx serve .` in the folder), not as `file://`, because the scripts are modules.

---

## Day 1 · The language

### The project, npm, and the build

**Two files describe the dependencies.** `package.json` is what you asked for (`"eslint":
"^9.15.0"`, a range). `package-lock.json` is what you actually got (`eslint 9.39.5`, exact).
Both go into git.

**`npm install` against `npm ci`.** `npm install` is allowed to think: if the manifest and the
lockfile disagree it resolves the difference, installs something, and rewrites the lockfile.
`npm ci` never thinks: it reads the lockfile, deletes `node_modules` and puts on disk exactly
the tree the lockfile describes. If the two files do not match, it refuses. Use `npm ci` on
every clone and in CI. Use `npm install <package>` only when you mean to change a dependency.

**Node against the browser.** Node runs your files exactly as they are, from disk. The browser
gets them over the network, so for production you build: one bundled, minified file in `dist/`
(the equivalent of `bin/`), and next to it a source map, `dist/bundle.js.map`, the way back from
the minified line to your original source. Minification is not obfuscation. Anything in that
bundle can be read, including a key you left in client code, and the source map hands the
original code back. Publish source maps to production deliberately, or not at all.

**ESLint** reads your code and reports rules you broke, such as `==` where `===` was meant,
or `innerHTML`. In the project the linter fails the build rather than warning.

### Types, coercion, truthy and falsy

`let` can be reassigned, `const` cannot, `var` is the old keyword that ignores block scope.
Default to `const`.

`typeof` has two surprises: `typeof null` is `"object"` and `typeof []` is `"object"`.

**Coercion.** JavaScript converts values on its own. `10 + '5'` is `"105"` because `+` with a
string glues. `'10' - 5` is `5` because `-` has no string meaning. `==` converts, then compares,
and the results are not predictable (`'' == 0` is true, `'0' == 0` is true, `'' == '0'` is
false). Use `===`, always, with one exception below.

**The six falsy values:** `false`, `0`, `''`, `null`, `undefined`, `NaN`. Everything else is
truthy, including `'0'`, `[]` and `{}`.

**The bug.** A pressure sensor that reads 0 bar is a real reading, and 0 is falsy:

```js
if (!reading.value) return;          // throws away 0 together with the missing ones
if (reading.value == null) return;   // only null and undefined: "is it missing?"
```

That `== null` is the one useful `==`. Same story with defaults: `||` replaces every falsy
value, `??` replaces only `null` and `undefined`.

```js
reading.value || 20    // 20 when the value is 0: wrong
reading.value ?? 20    // 0 when the value is 0: right
```

### Objects, references, mutation, copies

An object is a bag of named values; values can be other objects, arrays, functions
(methods). Keys are always strings: `grid[1]` and `grid['1']` are the same key.

**Assigning an object does not copy it.** Two names, one object:

```js
const b = a;
b.v = 99;          // a.v is 99 too
```

So a function that changes its argument changes the caller's object. That is a side effect,
and the caller may not expect it:

```js
function flag(reading) { reading.state = 'CRITICAL'; return reading; }    // mutates the input
function flagCopy(reading) { return { ...reading, state: 'CRITICAL' }; }  // returns a new object
```

The spread `...` copies every property into a new object; then you add or override. Prefer
the second shape: inputs untouched, a new value out.

**Shallow.** Both `Object.freeze` and the spread work one level deep. A frozen object's nested
objects are still writable, and `{ ...sensor }` shares `sensor.limits` with the original. To
copy a level deeper, spread the inner object too: `{ ...sensor, limits: { ...sensor.limits } }`.
`JSON.parse(JSON.stringify(x))` is a deep copy for plain data only (see day 2).

### Functions, `this`, arrow functions, closures

A function is a value: you can store it in an object, pass it to another function, return it.

**`this` is decided by the call, not by where the function was written.** In `press.report()`
`this` is `press`, whatever is before the dot. In a plain call, `report()`, there is nothing
before the dot and `this` is `undefined` (in modules and classes). That is what happens when
you hand a method to `addEventListener`: the browser calls it later with nothing before the
dot, and `this.id` throws.

**Arrow functions** have no `this` of their own; they use the `this` of the code around them.
That makes them wrong as methods (`speak: () => this.name` sees no object) and right as
callbacks. Returning an object literal from a one-line arrow needs parentheses:
`(name) => ({ name })`.

**Passing a method without losing `this`**, two ways:

```js
button.addEventListener('click', () => gauge.report());     // an arrow that makes the normal call
button.addEventListener('click', gauge.report.bind(gauge)); // bind: a new function with this fixed
```

**Closures.** A function remembers the variables of the place it was created in, even after
that place has returned:

```js
function makeCounter() {
  let n = 0;
  return () => ++n;      // sees n for as long as it lives
}
```

That is how a component keeps private state without a class, and how `destroy` can find the
very same handler it registered:

```js
function createGauge(el, unit) {
  let value = 0;
  const onClick = () => console.log(`${unit}: ${value}`);
  el.addEventListener('click', onClick);
  return {
    setValue: (v) => (value = v),
    destroy: () => el.removeEventListener('click', onClick),   // the same function object
  };
}
```

A closure keeps everything it can see alive. A handler that captures a large payload and is
never removed keeps that payload in memory for as long as the handler is registered.

### Collections

`for...of` gives the values of an array; `for...in` gives the keys (as strings) and is for
objects.

**The three that replace most loops.** `map` transforms every element (same length), `filter`
keeps the ones that pass a test, `reduce` folds everything into one value. Each returns a new
array (or value), so they chain:

```js
const alarms = readings
  .filter((r) => r.value != null)
  .map((r) => ({ ...r, state: classify(r) }))
  .filter((r) => r.state !== STATE.OK);
```

`find` returns the first match or `undefined`; `some` and `every` answer yes or no;
`Object.groupBy(list, (r) => r.deviceId)` groups into an object of arrays.

**Sorting.** `sort()` reorders the array in place: the caller's array changes. `toSorted()`
returns a sorted copy. The comparator returns negative, zero or positive, like `IComparer`.
The debugging session on day 3 is this exact bug.

### Destructuring, defaults, optional chaining, enums

```js
const { deviceId, value, unit = 'C' } = reading;            // fields out, by name, with a default
const { meta: { unit: measuredIn } } = reading;              // nested, renamed
function createGauge({ min = 0, max = 100 } = {}) {}         // an options object with defaults
function greet(name = 'Guest') {}                            // a default parameter
reading.meta?.unit                                           // undefined instead of a TypeError when meta is missing
```

Use `?.` for fields that are genuinely optional, not to hide a bug.

**An enum** is a frozen object. Nobody can add a fourth state or misspell one:

```js
const STATE = Object.freeze({ OK: 'OK', WARNING: 'WARNING', CRITICAL: 'CRITICAL' });
```

### Classes

```js
class BankAccount {
  #balance;                                  // private: only this class can read it
  constructor(owner, start = 0) { this.owner = owner; this.#balance = start; }
  deposit(amount) { this.#balance += amount; }
}

class PressureSensor extends Sensor {
  constructor(id, unit) { super(id); this.unit = unit; }       // super() before touching this
  describe() { return `${super.describe()} in ${this.unit}`; }
}
```

A handler kept as an arrow property on the instance keeps `this` and can be removed later:

```js
this.onClick = () => console.log(this.value);
mount()   { this.el.addEventListener('click', this.onClick); }
destroy() { this.el.removeEventListener('click', this.onClick); }
```

**Composition over inheritance.** One level of `extends` is fine. Beyond that, prefer handing
an object the pieces it needs (a store, a logger, a fetcher) over deep class hierarchies. The
day 3 module gets its element and its host passed in for the same reason.

---

## Day 2 · Async, and how data reaches the screen

### The event loop and the call stack

JavaScript has **one thread**. The call stack holds the function running now and whoever
called it. Timers, network and file reads happen outside the thread; when they are done,
their callback goes into a queue. The event loop moves the next callback onto the stack only
when the stack is empty.

Consequences:

- `setTimeout(fn, 0)` runs after the current code has finished, not now.
- A loop that spins for 300 ms blocks everything for 300 ms, timers included. In the browser
  the same thread paints the screen, so a long loop freezes the page.
- `await` does not start a thread. It pauses this function, steps aside, and the thread goes
  on with other work.

### Callbacks, and callback hell

A function that takes a callback returns at once, and returns nothing useful: the result goes
into the callback later. Three dependent calls nest three levels deep, each repeating the
error check. That shape is callback hell.

### Promises

A Promise is an object that stands for a value that is not there yet, like `Task<T>`.
`resolve(value)` completes it, `reject(error)` fails it. Wrap a callback API once:

```js
const readSensorAsync = (id) =>
  new Promise((resolve, reject) =>
    readSensor(id, (err, data) => (err ? reject(err) : resolve(data))));
```

Then chain with `.then`, flat and in reading order, with one `.catch` at the end for every
step:

```js
getUser(1)
  .then((user) => getOrders(user.id))
  .then((orders) => getOrderDetails(orders[0].id))
  .then((details) => console.log(details))
  .catch((err) => console.log(err.message));
```

### async / await

The same chain that reads like normal code, and errors come out as exceptions:

```js
async function showSensor(id) {
  try {
    const data = await readSensorAsync(id);
    console.log(data.value);
  } catch (err) {
    console.log(err.message);
  }
}
```

An `async` function always returns a promise. So `ids.map(async (id) => ...)` gives you an
array of promises, not values: `await Promise.all(...)` on it to get the values.

**Sequential against parallel.** Two awaits in a row run one after the other. Start both,
then await `Promise.all`, and they run at the same time:

```js
const a = await readSensorAsync('PT-234');     // 100 ms
const b = await readSensorAsync('PT-324');     // then 100 ms more

const [a, b] = await Promise.all([readSensorAsync('PT-234'), readSensorAsync('PT-324')]);   // 100 ms
```

Await in a row only when step two needs step one.

### Promise.all, Promise.allSettled, AbortController

`Promise.all` rejects as soon as one promise rejects, and the other results are lost. On a
dashboard that is a blank screen because of one dead sensor. `Promise.allSettled` waits for
all of them and reports each as `{ status: 'fulfilled', value }` or `{ status: 'rejected',
reason }`, so the other eleven readings are still there.

Use `Promise.all` when the results only make sense together; `allSettled` when each result is
useful on its own.

`AbortController` cancels a request: pass `controller.signal` to `fetch`, call
`controller.abort()` later. The fetch rejects with an `AbortError`. In the search box each new
keystroke aborts the previous search, so a slow old answer can never overwrite a newer one.

### fetch, JSON, the contract

`fetch` rejects only when the request could not be made at all. A 404 or a 500 is a successful
exchange with a bad answer, so the promise resolves. Check `res.ok` (status 200 to 299), in
one helper, once:

```js
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.json();
}
```

`JSON.stringify` makes a string, `JSON.parse` makes an object again. JSON has strings,
numbers, booleans, null, arrays and objects, and nothing else: a `Date` becomes a string,
`undefined` and functions disappear. So `JSON.parse(JSON.stringify(x))` is a deep copy only
for plain data.

**The contract** is the written agreement on what the server sends: which fields, which
types, which status codes. The front end can only be as right as that document. Write it
down, and check the data where it enters (day 3, the boundary).

### The DOM

- Select: `document.querySelector('#panel')` (first match or null), `querySelectorAll('.row')`.
- Create: `document.createElement('div')`, `el.className`, `el.dataset.deviceId = 'PT-1042'`
  (the attribute `data-device-id`), `parent.append(a, b)`.
- **`textContent` against `innerHTML`.** `textContent` shows the value as the characters it is
  made of. `innerHTML` parses it as HTML, so a name that came from another system,
  `<img src=x onerror="...">`, runs as code. That is cross-site scripting, and the fix is the
  mechanism, not a filter: build DOM from data with `createElement` and `textContent`. The
  project's lint rule forbids `innerHTML`.
- Many rows: build them into a `DocumentFragment` off-screen, then `panel.replaceChildren(frag)`
  once.
- When the script runs: a plain `<script>` in the head runs before the HTML below it exists.
  `type="module"` scripts are deferred by default, which is why `dom.js` finds `#panel`.

---

## Day 3 · Events, state, and what breaks in production

### Events

The click starts at the element you clicked (the **target**) and then **bubbles** up through
every ancestor: span, row, panel, body, document. A listener on the panel hears a click on a
span inside it.

- `event.target` is where the event started. `event.currentTarget` is whose listener is
  running right now.
- `event.target.closest('.row')` walks up from the target to the first ancestor that matches,
  so a click on the name finds the row that holds `data-device-id`.
- **Delegation:** one listener on the stable parent instead of one per row. Rows added later
  are covered too, and rows rebuilt by a render do not lose their listener.
- `event.stopPropagation()` stops the event: nothing above hears it, including the analytics
  listener. If the requirement is "row selection should ignore acknowledge clicks", the right
  fix is a `return` in that handler, not stopping the event for everyone.
- `event.preventDefault()` cancels the browser's built-in action (follow a link, submit a
  form). The event still bubbles.
- **Custom events:** the module reports, the host decides.
  `el.dispatchEvent(new CustomEvent('alarm:selected', { detail: { deviceId } }))`, and the host
  listens with `addEventListener('alarm:selected', ...)`. The module never knows what
  "selected" means in this application.

### State in the page

One object holds the state of the page. Handlers compute the next state; the render draws the
whole screen from it. Nothing but the render touches the DOM.

```
event  ──►  store.set(newState)  ──►  'change'  ──►  render(state)
```

The `Store` extends `EventTarget`, keeps its state frozen in a private field, and every `set`
builds a new object with the spread and dispatches `change`. "The Store remembers. Render
draws." A Blazor component's fields are its state in the same way: a handler changes them,
and the framework redraws.

### A reusable module: init, update, destroy

The module contract. A host gives the module an element and calls:

- `init(el, host)` to start: listeners, timers, state;
- `update(el, data)` when new data arrives;
- `destroy()` to stop everything `init` started.

The module never looks for its element itself and never knows who the host is, so the same
file runs unchanged in a plain page and in a Blazor page, where Blazor calls `init` by name
through JS interop and hands it the element reference. Child to parent goes through a custom
event, or through the host object the module was given.

**Why `destroy` matters.** In a single-page application the page is never reloaded, so a
listener or a timer nobody stops keeps running and keeps alive everything its closure can see.
The module keeps the handler and the timer it started, and `destroy` removes the one and
clears the other, the same `removeEventListener` as in `createGauge` on day 1.

### Debugging

Node code: VS Code, Terminal › New Terminal › JavaScript Debug Terminal, click the gutter for a
breakpoint, run `node file.js` in that terminal. Browser code: Chrome DevTools, Sources tab,
same panels, same buttons.

- **VARIABLES** (Scope): what every variable holds right now.
- **WATCH**: an expression evaluated on every stop, for example `alarms[0].deviceId`.
- **CALL STACK**: how execution got here, read from the bottom.
- **Step Into** goes into the call on the current line, **Step Over** runs it and stops on the
  next line, **Step Out** finishes the current function and stops in the caller.
- A **conditional breakpoint** pauses only when its condition is true: in a loop of thousands,
  the one bad pass.
- A **logpoint** logs an expression on every pass without pausing and without touching the
  file.

`console.log` shows you the wrong value. Stepping through the one call that touched the
array shows you who changed it. The bug we chased had no error and no log line: `sort()`
reordered an array the caller still held, and `toSorted()` was the fix.

### Errors

```
1. Programming errors → fix them.                TypeError, ReferenceError: always bugs
2. Operational errors → handle them.             a dead sensor, a 503, a timeout
3. Catch only what you can actually handle.
4. Do not turn bugs into nulls.                  catch { return null } hides the bug
5. If you add context, preserve the original.    err.deviceId = id; throw err   or   new Error(msg, { cause: err })
6. Branch on type, code or properties.           err instanceof ValidationError, not err.message.includes(...)
7. Validate external data once, at the boundary.
```

`throw` signals a failure, `try` wraps code that may fail, `catch` handles a failure you
understand, `finally` runs either way.

When to catch: can you handle it? catch. Can you add context the original error cannot know
(which device, which operation, which boundary)? catch and rethrow. Can you do nothing useful?
do not catch; let it reach someone who can. If an error reaches the top and nobody can handle
it, log it and let the process fail rather than pretending everything is healthy.

The catch that is right has an expected failure and a deliberate response: `JSON.parse` on
text you did not write, returning null and a log line.

**fetch errors.** A failed request (no network, aborted) rejects. A bad answer (404, 500)
resolves, so `if (!res.ok) throw` turns it into an error at the fetch layer, once. In the UI an
expected failure gets a deliberate response: a status line that says "Save failed: 503", and
the button re-enabled in `finally`.

**The boundary.** Outside is untrusted: a sensor frame, an HTTP response, what a user typed.
The boundary validates and normalises, throwing a `ValidationError` that names the field, and
returns a new object that is ours. Inside is trusted, and nothing after the door checks again.

### localStorage against an HttpOnly cookie

```
localStorage      JavaScript can read it    →  injected JavaScript (XSS) can read it too
HttpOnly cookie   JavaScript cannot read it →  the browser sends it by itself
```

`localStorage` is fine for preferences. A session credential belongs in an `HttpOnly` cookie
when you can have one (`Set-Cookie: session=...; HttpOnly; SameSite=Lax`). `HttpOnly` does not fix XSS, an injected script can still make requests as you,
but the credential cannot be copied out and used elsewhere. Nothing in the browser is hidden:
a key in client code is in `dist/bundle.js`; the server holds keys.

### Logging with a correlation id

A log line is data, not prose. A string such as `'processing PT-1042 done'` cannot be
filtered. An object with fields can:

```js
logger.info({ correlationId, deviceId: reading.deviceId }, 'reading received');
```

The **correlation id** is made once, where the request arrives, passed
through every function, written on every log line of that request, and returned in a response
header so the browser can quote it back. One string to search for, and the whole story of one
request comes back in order.

Secrets are redacted in the logger, by field name, from one configured list
(`authorization`, `x-api-key`, `password`, `token`, `cookie`). Redaction knows names, not
sentences, so log fields, and best of all do not hand the logger a secret it does not need.

---

## The reflexes to keep

- Zero is a value. Ask `== null`, not `!value`.
- `this` belongs to the call. Hand over an arrow, or bind.
- Return a new object; do not change the one you were given. `toSorted`, not `sort`.
- One thread. `await` yields, it does not parallelise. Start together, then `Promise.all`.
- `fetch` does not fail on a 404. Check `res.ok`.
- Build DOM from data with `textContent`. Never `innerHTML` with data you did not write.
- One listener on the parent, `closest()` to find the row, `return` to skip, not `stopPropagation`.
- The Store remembers, render draws.
- Anything `init` starts, `destroy` stops.
- Fix bugs, handle failures, and do not catch what you cannot handle.
- Validate once, at the boundary.
- Log fields, with one correlation id per request.
