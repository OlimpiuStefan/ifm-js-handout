// A small local server for practice 04 (and the hanging-request demo). No internet needed.
//
// Run, in a second terminal, and leave it running:  node local-server.js
//
//   http://localhost:3999/fast                  answers at once
//   http://localhost:3999/report                hangs for ever (try it with an AbortController)
//   http://localhost:3999/api/users?search=cl   server-side search, answers after 400 ms   (practice 04)
//   anything else                               404
import { createServer } from 'node:http';

const USERS = [
  { id: 1, name: 'Leanne Graham' },
  { id: 2, name: 'Ervin Howell' },
  { id: 3, name: 'Clementine Bauch' },
  { id: 4, name: 'Patricia Lebsack' },
  { id: 5, name: 'Chelsey Dietrich' },
  { id: 6, name: 'Dennis Schulist' },
  { id: 7, name: 'Kurtis Weissnat' },
  { id: 8, name: 'Nicholas Runolfsdottir' },
  { id: 9, name: 'Glenna Reilly' },
  { id: 10, name: 'Clementina DuBuque' },
];

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

createServer((req, res) => {
  const { pathname, searchParams } = new URL(req.url, 'http://localhost');

  if (pathname === '/fast') {
    return json(res, 200, { report: 'Q3', total: 1250 });
  }

  if (pathname === '/report') {
    console.log('request for /report received, and never answered');
    return; // nothing: no response, ever
  }

  if (pathname === '/api/users') {
    // The server does the search. It takes a moment, like a database query would.
    const q = (searchParams.get('search') ?? '').toLowerCase();
    const hits = USERS.filter((u) => u.name.toLowerCase().includes(q));

    console.log(`search "${q}" started`);

    const timer = setTimeout(() => {
      json(res, 200, hits);
      console.log(`search "${q}" answered, ${hits.length} users`);
    }, 400);

    // The client hung up before the answer went out: stop working on it.
    res.on('close', () => {
      if (!res.writableFinished) {
        clearTimeout(timer);
        console.log(`search "${q}": the client gave up, answer dropped`);
      }
    });

    return;
  }

  json(res, 404, { error: 'no such route' });
}).listen(3999, () => console.log('local server on http://localhost:3999'));
