// 04 · search box: cancel the old request
//
// Run, with local-server.js running in a second terminal:
//   node 04-search-box-cancel-the-old-request.js
// Read the task in README.md. Fill in searchUsers; the three calls at the bottom stay.

const SEARCH_URL = 'http://localhost:3999/api/users';

let controller;

async function searchUsers(query) {
  // 1. cancel the previous request
  // 2. start a new request for the current query:
  //    `${SEARCH_URL}?search=${encodeURIComponent(query)}`, with the controller's signal
  // 3. return only the latest result
  //    (an aborted fetch rejects: log that the search was cancelled, return [])
}

// The user types "c", "cl", "cle", a keystroke every 150 ms. Only the last one matters.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

searchUsers('c');
await wait(150);
searchUsers('cl');
await wait(150);
const found = await searchUsers('cle');

console.log(found.map((user) => user.name));
