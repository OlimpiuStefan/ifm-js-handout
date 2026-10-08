// ═══════════════════════════════════════════════════════════════════
//  Day 2 · practice 03 · Send notifications with Promise.allSettled
//  Run:  node 03-notifications-allsettled.js     (needs internet)
//
//  Three notifications, one of them fails. With Promise.all the first
//  failure would hide the two that were sent. allSettled reports each one.
// ═══════════════════════════════════════════════════════════════════
const BASE = 'https://jsonplaceholder.typicode.com';

async function sendNotification(notification) {
  const res = await fetch(`${BASE}/posts`, {
    method: 'POST',                                     // a POST with a JSON body
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ title: notification.title, body: notification.body, userId: notification.userId }),
  });
  if (!res.ok) throw new Error(`${res.status}`);

  if (notification.userId === 3) throw new Error('user 3 has notifications switched off');   // a failure, on purpose

  return res.json();
}

const notifications = [
  { userId: 1, title: 'Welcome', body: 'Thanks for joining!' },
  { userId: 2, title: 'Update', body: 'Your account is ready.' },
  { userId: 3, title: 'Reminder', body: 'Check your notifications.' },
];

const results = await Promise.allSettled(notifications.map((n) => sendNotification(n)));

results.forEach((result, i) => {                        // results come back in the order of the input
  const n = notifications[i];
  if (result.status === 'fulfilled') console.log('sent    ', n.title, '→ id', result.value.id);
  else console.log('not sent', n.title, '·', result.reason.message);
});
// → sent     Welcome → id 101
// → sent     Update → id 101
// → not sent Reminder · user 3 has notifications switched off
