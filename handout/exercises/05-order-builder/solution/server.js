// Order Builder · the server. Provided; nothing in it is yours to write.
//
//   node server.js          →  http://localhost:3998        the page, and the API
//   node server.js --down   →  the same, but POST /api/orders answers 503, for the failure path
//
// Two things in one process, so the page and the API share one origin and no CORS is needed:
//   static files   GET /, /main.js, /store.js, /main.part*.js     from this folder
//   the API        POST /api/orders                                 saves an order (in memory)
//
// The API, as a contract:
//   POST /api/orders   body: the order as JSON   { id, items: [{ id, name, price, qty }, ...] }
//     201  { saved: true, orderId, total, savedAt }
//     400  { error: 'invalid JSON' }  or  { error: 'order needs at least one item' }
//     405  anything but POST on /api/orders
//     503  { error: 'order service unavailable' }        with --down
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3998;
const DOWN = process.argv.includes('--down');
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
};

const saved = []; // the "database": gone when the process ends

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

// The body arrives in pieces; collect them, then parse once.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function saveOrder(req, res) {
  if (req.method !== 'POST')
    return json(res, 405, { error: 'method not allowed' });
  if (DOWN) return json(res, 503, { error: 'order service unavailable' });

  let order;
  try {
    order = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: 'invalid JSON' });
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return json(res, 400, { error: 'order needs at least one item' });
  }

  // The server computes the total itself: it never trusts a total the client sends.
  const total = order.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const record = {
    orderId: order.id,
    total,
    savedAt: new Date().toISOString(),
  };
  saved.push(record);
  console.log(
    `saved order #${order.id} · ${order.items.length} items · total ${total}`,
  );
  return json(res, 201, { saved: true, ...record });
}

async function serveFile(pathname, res) {
  const rel =
    pathname === '/'
      ? 'index.html'
      : normalize(pathname)
          .replace(/^(\.\.[/\\])+/, '')
          .slice(1);
  try {
    const body = await readFile(join(ROOT, rel));
    res.writeHead(200, { 'content-type': TYPES[extname(rel)] ?? 'text/plain' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api/orders') return saveOrder(req, res);
  if (pathname.startsWith('/api/'))
    return json(res, 404, { error: 'no such route' });
  return serveFile(pathname, res);
}).listen(PORT, () =>
  console.log(
    `order builder on http://localhost:${PORT}${DOWN ? '  (POST /api/orders answers 503)' : ''}`,
  ),
);
