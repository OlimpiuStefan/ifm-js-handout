// ═══════════════════════════════════════════════════════════════════
//  04 · A search box that cancels the previous search
//  Run, in one terminal:   node local-server.js
//       in another:        node 04-search-box-cancel-the-old-request.js
//
//  The user types c, cl, cle. Three requests go out; only the last answer
//  matters. Each new search aborts the one before it, so an old, slow
//  answer can never overwrite a newer one.
// ═══════════════════════════════════════════════════════════════════
const SEARCH_URL = 'http://localhost:3999/api/users';

let controller;                                         // the controller of the search in flight, if any

async function searchUsers(query) {
  controller?.abort();                                  // cancel the previous search (optional chaining: none the first time)
  controller = new AbortController();
  try {
    const res = await fetch(`${SEARCH_URL}?search=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    return await res.json();
  } catch {
    console.log(`search "${query}" cancelled`);         // an aborted fetch rejects: the old search is dropped
    return [];
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

searchUsers('c');                                       // not awaited: the next keystroke comes before the answer
await wait(150);
searchUsers('cl');
await wait(150);
const found = await searchUsers('cle');
console.log(found.map((u) => u.name));
// → search "c" cancelled
// → search "cl" cancelled
// → [ 'Clementine Bauch', 'Clementina DuBuque' ]
