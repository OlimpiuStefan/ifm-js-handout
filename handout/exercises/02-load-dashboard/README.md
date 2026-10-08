# 02 · Load a dashboard in parallel

Needs the internet. `node 02-load-dashboard.js`.

**Use case.** An account page needs three independent things: the user, the orders, the
notifications. Three endpoints, none depends on another.

**Task.** Implement `loadDashboard()`: load all three and return `{ user, orders, notifications }`.
Do not wait for one before starting the next.

**Steps**

1. `getJson(url)` is provided: one request, `res.ok` checked, JSON returned. Use it three times.
2. Write the slow version first if you want to see it: three `await getJson(...)` lines, one under
   the other. Note the time on the last line.
3. Now the real one: make the three calls first, without `await`, and wait for all three together
   with `Promise.all`. It gives the results back in the order you asked, so take them apart with
   array destructuring.
4. Run it. The time should drop to about one request's worth.

**What you should see**

```
Leanne Graham
10 orders
20 notifications
three requests, one wait of 200 ms, about
```

**Then answer:** does `Promise.all` make the requests parallel? Be precise about what starts a
request and what `Promise.all` does.

**Done when** the three lines match, there is exactly one `await` in `loadDashboard`, and `getJson`
is called three times before anything is awaited.
