# 04 · Search box: cancel the old request

Two terminals. In the first, `node local-server.js` and leave it running. In the second,
`node 04-search-box-cancel-the-old-request.js`.

**Use case.** The user types `c`, `cl`, `cle`. Three searches start, one per keystroke. By the time
the first answer arrives, nobody cares about it: only the last search matters.

The local server has `GET /api/users?search=<text>`. It does the search on the server and answers
after about 400 ms, like a database query would. The client never downloads the whole list.

**Task.** Implement `searchUsers(query)`. Each new search should cancel the previous request,
start a new one for the current query, and return only the latest result.

**Steps**

1. Write it without cancelling first: `fetch` the URL with the query in it, check `res.ok`, return
   `res.json()`. Run it and look at the server's terminal: it answered all three. Two of them were
   wasted work, on both sides.
2. The file has one variable outside the function, `controller`. At the start of `searchUsers`,
   abort the previous controller if there is one (`controller?.abort()`), then make a new one and
   keep it there.
3. Pass its `signal` to `fetch`.
4. An aborted `fetch` rejects. That is not a failure here: catch it, log `search "..." cancelled`,
   return `[]`.
5. Run it again, and read the server's terminal this time too.

**What you should see**

```
search "c" cancelled
search "cl" cancelled
[ 'Clementine Bauch', 'Clementina DuBuque' ]
```

and on the server's side:

```
search "c" started
search "c": the client gave up, answer dropped
search "cl" started
search "cl": the client gave up, answer dropped
search "cle" started
search "cle" answered, 2 users
```

**Then answer:** which request answers `cle`? What happened to the requests for `c` and `cl`, and
how did the server find out?

**Not in this exercise: debounce.** What you wrote is cancellation: a request has started and its
answer is no longer wanted. Debounce comes before that: it avoids starting the request at all while
the user is still typing. Every keystroke restarts a short timer, and only after, say, 300 ms with
no new key does the search start:

```js
let timer;
input.addEventListener('input', (event) => {
  clearTimeout(timer);                                            // still typing
  timer = setTimeout(() => searchUsers(event.target.value), 300); // 300 ms of silence: search
});
```

The two work together. Debounce is a timer and nothing more; keep it apart from the abort.

**Done when** the three lines match, a new search always aborts the one before it, and the query is
in the URL: nothing in your file filters names.
