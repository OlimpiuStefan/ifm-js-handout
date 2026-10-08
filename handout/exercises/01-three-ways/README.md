# 01 · One operation, three async styles

Needs the internet. `node 01-three-ways.js` after every part.

```js
const URL = 'https://swapi.dev/api/people/1/';
```

The same operation, written three ways: fetch that address, read the JSON, print the character's
name. Callbacks, promises and async/await are not three tools for three jobs. They are three ways
of consuming one async operation, invented in that order. `fetch` is already promise-based, so
part 1 wraps that promise in a callback interface, which is what you do when you meet code written
in that style.

**Part 1 · callback.** Write `fetchCharacterData(callback)`: it fetches `URL`, reads the JSON with
a `.then` chain, and hands the data to the function it was given. Call it with a function that
prints `Callbacks: <the name>`. Before you run it: `fetchCharacterData(show)` has no brackets after
`show`. What is being handed over? Is there a `return` anywhere? Where does the answer come out?

**Part 2 · promise.** Write `fetchCharacterDataPromise()`: no parameter, it returns a promise of the
parsed data. The caller attaches `.then` and prints `Promises: <the name>`. Delete the `return` in
front of `fetch` once, run it, read the error, put it back.

**Part 3 · async / await.** Write `fetchCharacterDataAsync()`: the same with `await`, and
`return data` at the end. Call it with `await` and print `Async/await: <the name>`. Then add
`console.log('without await ->', fetchCharacterDataAsync())` above that call: what does an async
function return to a caller that does not await it?

**What you should see**

```
without await -> Promise { <pending> }
Callbacks: Luke Skywalker
Promises: Luke Skywalker
Async/await: Luke Skywalker
```

Run it twice and watch the order of the three names change.

**Done when** the three versions print the same name, the extra line prints `Promise { <pending> }`,
and you can say in one sentence what the three have in common and what differs.
