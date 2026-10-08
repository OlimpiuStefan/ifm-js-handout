// 01 · one operation, three async styles
// Run:  node 01-three-ways.js          (needs the internet)

const URL = 'https://swapi.dev/api/people/1/';

// ── Part 1 · a callback interface around fetch ───────────────────
// The caller hands in what to do with the result. Nothing is returned:
// the answer comes out through the callback, later.
function fetchCharacterData(callback) {
  fetch(URL)
    .then((response) => response.json())
    .then((data) => callback(data));
}

fetchCharacterData((data) => console.log('Callbacks:', data.name));

// ── Part 2 · promise ─────────────────────────────────────────────
// No parameter. It returns the promise, and the caller attaches .then.
// Without the `return`, the caller gets undefined and .then throws.
function fetchCharacterDataPromise() {
  return fetch(URL).then((response) => response.json());
}

fetchCharacterDataPromise().then((data) => console.log('Promises:', data.name));

// ── Part 3 · async / await ───────────────────────────────────────
// `await` pauses this function only, not the program. `return data`
// gives the caller a promise of data, not the data.
async function fetchCharacterDataAsync() {
  const response = await fetch(URL);
  const data = await response.json();
  return data;
}

console.log('without await ->', fetchCharacterDataAsync());   // → Promise { <pending> }
const data = await fetchCharacterDataAsync();
console.log('Async/await:', data.name);
