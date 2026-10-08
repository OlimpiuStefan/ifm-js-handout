// 1 · one operation, three async styles
// Run:  node 01-three-ways.js          (needs the internet)
//
// fetch is already promise-based. Part 1 wraps that promise in a callback
// interface; it does not show a callback-native API.

const URL = 'https://swapi.dev/api/people/1/';
// If swapi.dev is down: 'https://swapi.info/api/people/1'  <- no trailing slash

// ── Part 1 · a callback interface around fetch ───────────────────


// ── Part 2 · promise ─────────────────────────────────────────────


// ── Part 3 · async / await ───────────────────────────────────────

