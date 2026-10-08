// ═══════════════════════════════════════════════════════════════════
//  Day 3 · 05 · Where a session credential lives: localStorage or an HttpOnly cookie
//  Run:  node 05-storage-localstorage-vs-httponly.js   →  http://localhost:5174
//        then open that address in the browser and watch both the page and the terminal.
//
//  localStorage      JavaScript can read it   →  injected JavaScript (XSS) can read it too
//  HttpOnly cookie   JavaScript cannot read it →  the browser sends it by itself
//
//  Rule: localStorage is fine for preferences. A session credential belongs
//  in an HttpOnly cookie when you can have one. HttpOnly does not fix XSS
//  (an injected script can still make requests as you), but it stops the
//  credential from being copied out and used elsewhere.
// ═══════════════════════════════════════════════════════════════════
import { createServer } from 'node:http';

// ─── the page: what the browser side looks like, both ways ────────
const page = `<!doctype html><meta charset="utf-8"><title>storage</title>
<body style="font:15px system-ui;margin:2rem">
<h3>1 · localStorage</h3>
<pre id="ls"></pre>
<h3>2 · HttpOnly cookie</h3>
<pre id="ck"></pre>
<script type="module">
  // 1 · a token in localStorage: the page puts it in, the page sends it, and
  //     any script running in this page can read it back.
  localStorage.setItem('token', 'abc123');
  const token = localStorage.getItem('token');
  const r1 = await fetch('/api/readings', { headers: { Authorization: 'Bearer ' + token } });
  document.querySelector('#ls').textContent =
    'localStorage.getItem("token") → ' + token + '\\n' +
    'sent as Authorization: Bearer ' + token + '\\n' +
    'server answered: ' + JSON.stringify(await r1.json());

  // 2 · a session cookie set by the server with HttpOnly: this script
  //     cannot read it, and the browser attaches it to every request anyway.
  await fetch('/login');
  const r2 = await fetch('/api/readings');
  document.querySelector('#ck').textContent =
    'document.cookie → "' + document.cookie + '"   (HttpOnly: invisible to JavaScript)\\n' +
    'server answered: ' + JSON.stringify(await r2.json()) + '\\n' +
    'look at the terminal: the server received the cookie';
</script>`;

// ─── the server ───────────────────────────────────────────────────
createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(page);
  }

  if (req.url === '/login') {
    res.writeHead(200, {
      'Set-Cookie': 'session=abc123; HttpOnly; SameSite=Lax',   // HttpOnly: the browser keeps it, scripts never see it
      'Content-Type': 'text/plain',
    });
    return res.end('logged in');
  }

  if (req.url === '/api/readings') {
    console.log('authorization header:', req.headers.authorization ?? '(none)');
    console.log('cookie received     :', req.headers.cookie ?? '(none)');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify([{ deviceId: 'PT-1042', value: 97.4 }]));
  }

  res.writeHead(404);
  res.end();
}).listen(5174, () => console.log('open http://localhost:5174 and watch this terminal'));
