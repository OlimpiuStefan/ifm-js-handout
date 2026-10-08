// ═══════════════════════════════════════════════════════════════════
//  The server: the API, and the page that uses it. One process, one
//  origin, so the page can call /api/... with no CORS in the way.
//  Run:  npm run dev   →  http://localhost:3000
//  No framework: node:http is enough to see every moving part.
//
//  The API:
//     GET /api/equipment             the device list
//     GET /api/readings[?since=]     normalised readings
//     GET /api/devices/:id/reading   latest reading for one device
//     GET /health                    liveness
//  Everything else is a file from client/ or modules/ (the page itself).
// ═══════════════════════════════════════════════════════════════════
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize as normalizePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEVICES, tick, since, latestFor } from './store.js';
import { normalize, normalizeAll } from './normalize.js';
import { config } from './config.js';
import { log } from './log.js';

setInterval(() => tick(), 1000).unref();
tick();

// ─── the API ──────────────────────────────────────────────────────
// Every route returns [status, body]; respond() is the only place that
// writes to `res`.
const routes = {
  '/api/equipment': () => [200, DEVICES.map(({ deviceId, name, unit }) => ({ deviceId, name, unit }))],
  '/api/readings': (url) => [200, normalizeAll(since(url.searchParams.get('since')))],
  '/health': () => [200, { status: 'UP' }],
};

// One device at a time. tools/load-devices.js loads all twelve through this.
const DEVICE_READING = /^\/api\/devices\/([A-Z]{2}-\d{4})\/reading$/;

function deviceReading(id) {
  const device = DEVICES.find((d) => d.deviceId === id);
  if (!device) return [404, { error: 'unknown device' }];
  // A dead sensor is an operational failure: answer it, do not crash on it.
  if (device.dead) return [503, { error: 'sensor not responding' }];
  return [200, normalize(latestFor(device.deviceId))];
}

function api(url) {
  const match = DEVICE_READING.exec(url.pathname);
  if (match) return deviceReading(match[1]);
  const handler = routes[url.pathname];
  if (!handler) return [404, { error: 'not found' }];
  return handler(url);
}

// ─── the page ─────────────────────────────────────────────────────
// Static files, only from the two folders the page loads from. Never
// package.json, node_modules or the build output.
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SERVED = new Set(['client', 'modules']);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

async function file(pathname) {
  const rel = pathname === '/' ? 'client/index.html' : normalizePath(pathname).replace(/^(\.\.[/\\])+/, '');
  const parts = rel.split(/[/\\]/).filter(Boolean);
  if (!SERVED.has(parts[0]) || parts.some((p) => p.startsWith('.'))) return [404, 'not found', 'text/plain'];
  try {
    return [200, await readFile(join(ROOT, rel)), TYPES[extname(rel)] ?? 'text/plain'];
  } catch {
    return [404, 'not found', 'text/plain']; // could not read it: there is nothing to send
  }
}

// ─── one handler ──────────────────────────────────────────────────
const respond = (res, code, body, type, correlationId) => {
  res.writeHead(code, {
    'content-type': type,
    'cache-control': 'no-store', // polled endpoints: a proxy must not serve a stale reading
    'x-correlation-id': correlationId,
  });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

const server = createServer(async (req, res) => {
  // One id per request, made here, once. It goes on every log line of this
  // request and back to the caller in a header, so a report can quote it.
  const correlationId = randomUUID();
  if (!URL.canParse(req.url, 'http://localhost')) {
    return respond(res, 400, { error: 'bad request' }, 'application/json', correlationId);
  }
  const url = new URL(req.url, 'http://localhost');
  const ctx = { correlationId, method: req.method, path: url.pathname };
  log(ctx, 'request received');

  try {
    const isApi = url.pathname.startsWith('/api/') || url.pathname === '/health';
    const [code, body, type] = isApi ? [...api(url), 'application/json'] : await file(url.pathname);
    respond(res, code, body, type, correlationId);
    log({ ...ctx, status: code }, 'request responded');
  } catch (err) {
    // The detail stays in the log. The client gets a shape, not a stack trace.
    log({ ...ctx, error: err.message, stack: err.stack }, 'request failed');
    respond(res, 500, { error: 'internal error' }, 'application/json', correlationId);
  }
});

server.listen(config.port, '127.0.0.1', () =>
  log({ port: config.port }, `listening on http://localhost:${config.port}`));
