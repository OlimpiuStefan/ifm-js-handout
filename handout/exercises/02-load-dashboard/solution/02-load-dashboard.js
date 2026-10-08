// 02 · load a dashboard in parallel
// Run:  node 02-load-dashboard.js        (needs the internet)

const BASE = 'https://jsonplaceholder.typicode.com';

// One request, checked. fetch does not reject on a 404: res.ok does that job, here, once.
async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadDashboard() {
  // The three calls START here, one after the other, without waiting.
  // Promise.all waits for all three, and hands the results back in this order.
  const [user, orders, notifications] = await Promise.all([
    getJson(`${BASE}/users/1`),
    getJson(`${BASE}/posts?userId=1`),
    getJson(`${BASE}/todos?userId=1`),
  ]);
  return { user, orders, notifications };
}

const started = Date.now();
const dashboard = await loadDashboard();

console.log(dashboard.user.name);
console.log(dashboard.orders.length, 'orders');
console.log(dashboard.notifications.length, 'notifications');
console.log('three requests, one wait of', Math.round((Date.now() - started) / 100) * 100, 'ms, about');
