// 2 · load a dashboard in parallel
//
// Run:  node 02-load-dashboard.js        (needs the internet)
// Read the task in README.md, part 2. Fill in loadDashboard; the printing at the bottom stays.

const BASE = 'https://jsonplaceholder.typicode.com';

// One request, checked. Use it for every resource.
async function getJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

async function loadDashboard() {
  // user 1                         GET `${BASE}/users/1`
  // posts for user 1 = orders      GET `${BASE}/posts?userId=1`
  // todos for user 1 = alerts      GET `${BASE}/todos?userId=1`
  // Do not wait for one before starting the next.
}

const started = Date.now();
const dashboard = await loadDashboard();

console.log(dashboard.user.name);
console.log(dashboard.orders.length, 'orders');
console.log(dashboard.notifications.length, 'notifications');
console.log('three requests, one wait of', Math.round((Date.now() - started) / 100) * 100, 'ms, about');
