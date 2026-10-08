// 3 · send five jobs, but keep every result
//
// Run:  node 03-send-all-keep-every-result.js        (needs the internet)
// Read the task in README.md, part 3. Your code goes under the users array.

// Provided. Sends one notification; fails for one user, on purpose.
async function sendNotification(user) {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: user.id, message: 'System maintenance' })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  // simulate one business failure
  if (user.id === 3) {
    throw new Error('notifications disabled');
  }

  return res.json();
}

const users = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Dan' },
  { id: 3, name: 'Mira' },
  { id: 4, name: 'Ioan' },
  { id: 5, name: 'Sara' }
];

// Send all five at the same time, and print one line per user:
//   Ana sent
//   Mira failed: notifications disabled
// Then the summary: { sent: 4, failed: 1 }

// your code
