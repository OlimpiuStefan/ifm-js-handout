// ═══════════════════════════════════════════════════════════════════
//  Day 3 · 06 · Logging: fields, not sentences, and one correlation id
//  Run:  node 06-logging-correlation-id.js
//
//  What this file shows: a log line that is a string is useless at
//  volume; a log line that is an object with fields can be filtered; one
//  id generated at the edge and carried through every function makes a
//  single request searchable; and secrets are redacted by field name,
//  in the logger, once.
//
//  Your platform already has a logger. This is what it needs FROM you.
// ═══════════════════════════════════════════════════════════════════

// A stand-in for the platform logger: it collects objects in an array.
const sink = [];
const logger = {
  info: (ctx, msg) => sink.push({ level: 'info', ...ctx, msg }),
  warn: (ctx, msg) => sink.push({ level: 'warn', ...ctx, msg }),
  error: (ctx, msg) => sink.push({ level: 'error', ...ctx, msg }),
};

// ─── 1 · what useless looks like ──────────────────────────────────
function ingestBad(reading) {
  console.log('processing ' + reading.deviceId + ' ' + JSON.stringify(reading));
  console.log('done');
}
ingestBad({ deviceId: 'PT-1042', value: '97.4' });
// Two problems. It is a STRING, so nothing can filter on deviceId. And
// there is no thread through it: at 800 readings a second, "done" belongs
// to which reading?

// ─── 2 · the same events, usable ──────────────────────────────────
let seq = 0;
const newCorrelationId = () => `req-${String(++seq).padStart(4, '0')}`;

function ingest(reading, correlationId) {
  logger.info({ correlationId, deviceId: reading.deviceId }, 'reading received');

  const state = Number(reading.value) > 95 ? 'CRITICAL' : 'OK';
  if (state !== 'OK') {
    logger.warn({ correlationId, deviceId: reading.deviceId, state }, 'alarm raised');
  }
  return { ...reading, state, correlationId };
}

const cid = newCorrelationId();                           // made ONCE, where the request arrives
ingest({ deviceId: 'PT-1042', value: '97.4' }, cid);      // and passed along
ingest({ deviceId: 'VS-0071', value: '12.0' }, newCorrelationId());

console.log('\nthe whole story of one request, by id:');
console.log(sink.filter((l) => l.correlationId === cid));
// → [
// →   { level: 'info', correlationId: 'req-0001', deviceId: 'PT-1042', msg: 'reading received' },
// →   { level: 'warn', correlationId: 'req-0001', deviceId: 'PT-1042', state: 'CRITICAL', msg: 'alarm raised' }
// → ]
//
//   request arrives  ──  correlationId made here, once
//      controller       log { correlationId }
//      service          log { correlationId }
//      response         header x-correlation-id, so the browser can quote it back
//
// One string to search for, and the story comes back in order.

// ─── 3 · what must never go in: the rule lives in the logger ──────
// A list of field names, in ONE place. Any field with one of these names
// is written as [redacted], whichever call site handed it over.
const SECRET = new Set(['x-api-key', 'authorization', 'password', 'token', 'cookie']);
const redact = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, SECRET.has(key.toLowerCase()) ? '[redacted]' : value]));

const safe = { info: (ctx, msg) => sink.push({ level: 'info', ...redact(ctx), msg }) };

// A call site that logs the whole header bag, API key included.
const headers = { 'x-api-key': 'sk_live_9dsfdfgdfgdfgdfgfgdf', accept: 'application/json' };
safe.info({ correlationId: cid, ...headers }, 'request received');
console.log('\nredacted by name:');
console.log(sink.at(-1));
// → { level: 'info', correlationId: 'req-0001', 'x-api-key': '[redacted]', accept: 'application/json', msg: 'request received' }

// The same line written three ways, worst to best:
//   ❌  safe.info({}, `rejected key ${apiKey}`)             a sentence: redaction cannot read it
//   ✅  safe.info({ userId, apiKey }, 'request rejected')   a field: redacted by its name
//   ✅  safe.info({ userId }, 'request rejected')           best: the secret never reaches the logger
