// ═══════════════════════════════════════════════════════════════════
//  Day 2 · practice 02 · Load a dashboard with Promise.all
//  Run:  node 02-dashboard-promise-all.js     (needs internet)
//
//  Three independent requests for one screen. They do not depend on each
//  other, so they start together and we wait once, for all three.
// ═══════════════════════════════════════════════════════════════════
const BASE = 'https://jsonplaceholder.typicode.com';

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.json();
}

async function loadDashboard() {
  const [user, posts, todos] = await Promise.all([    // destructuring the array Promise.all resolves to
    getJson(`${BASE}/users/1`),
    getJson(`${BASE}/posts?userId=1`),
    getJson(`${BASE}/todos?userId=1`),
  ]);
  return { user, posts, todos };
}

try {
  const dashboard = await loadDashboard();
  console.log(dashboard.user.name, '·', dashboard.posts.length, 'posts ·', dashboard.todos.length, 'todos');
  // → Leanne Graham · 10 posts · 20 todos
} catch (err) {
  console.log('dashboard failed:', err.message);       // one failed request fails the whole dashboard: Promise.all
}
