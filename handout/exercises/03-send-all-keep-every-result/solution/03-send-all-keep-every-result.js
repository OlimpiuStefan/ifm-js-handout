// 03 · send five jobs, but keep every result
// Run:  node 03-send-all-keep-every-result.js        (needs the internet)

// Provided. Sends one notification; fails for one user, on purpose.
async function sendNotification(user) {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: user.id, message: 'System maintenance' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (user.id === 3) throw new Error('notifications disabled');   // one business failure
  return res.json();
}

const users = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Dan' },
  { id: 3, name: 'Mira' },
  { id: 4, name: 'Ioan' },
  { id: 5, name: 'Sara' },
];

// Promise.all would reject on Mira and throw Ana's success away with it.
// allSettled waits for every promise and reports each one, in the users' order.
const results = await Promise.allSettled(users.map((user) => sendNotification(user)));

results.forEach((result, i) => {
  const user = users[i];                                           // same index, same user
  if (result.status === 'fulfilled') console.log(`${user.name} sent`);
  else console.log(`${user.name} failed: ${result.reason.message}`);
});

const sent = results.filter((r) => r.status === 'fulfilled').length;
console.log({ sent, failed: results.length - sent });
